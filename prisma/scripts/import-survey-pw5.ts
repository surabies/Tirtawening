// ============================================================
// scripts/import-survey-pw5.ts
// Import data survei lapangan (mWater) ke database.
// Jalankan manual & berulang setiap ada batch survei baru:
//   npx tsx scripts/import-survey-pw5.ts
//
// Sumber: Data_progres_verifikasi_pelanggan_PW_5_2026.geojson (1.875 titik)
//
// Kenapa ini IMPORT SCRIPT (bukan prisma/seed.ts):
//   - Data transaksional/progres, terus bertambah seiring survei berjalan
//     (bukan data referensi tetap seperti batas wilayah).
//   - Idempotent BUKAN lewat unique constraint biasa, tapi lewat field
//     "Response Code" mWater yang dipakai sebagai kunci dedup eksplisit.
//   - WAJIB jalan SETELAH prisma/seed.ts (butuh tabel Kelurahan terisi
//     untuk lookup kelurahanId di PotensiPelanggan).
//
// Tiga skenario "Status Kepelangganan" di data, tiga tujuan berbeda:
//   1. "Pelanggan"     (928 baris) → UPDATE koordinat di Pelanggan existing
//                                     (match by nomorLangganan). TIDAK insert
//                                     baru — kalau tidak ketemu, dicatat di
//                                     warning, BUKAN bikin error.
//   2. "Non Pelanggan" (728 baris) → INSERT PotensiPelanggan baru (prospek).
//   3. "Eks Pelanggan"  (219 baris) → UPSERT ke Pemutusan (jenis = LAINNYA),
//                                     karena banyak histori cabut LAMA
//                                     (1994–2025) yang nolg-nya sudah tidak
//                                     ada di tabel Pelanggan. Lihat catatan
//                                     di schema.prisma model Pemutusan.
//
// PENTING — kolom geometry (Unsupported type di schema) tidak bisa ditulis
// lewat create()/update() biasa. Semua koordinat ditulis lewat $executeRaw
// terpisah setelah row utamanya berhasil dibuat/diupdate.
// ============================================================

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Sesuaikan kalau file geojson kamu simpan di lokasi lain.
const SURVEY_GEOJSON_PATH = path.join(
  process.cwd(),
  'data',
  'Data_progres_verifikasi_pelanggan_PW_5_2026.geojson',
)

const LOG_DIR = path.join(process.cwd(), 'logs')
const WARNING_LOG_PATH = path.join(LOG_DIR, 'import-survey-pw5-warnings.json')

type GeoJSONFeature = {
  type: 'Feature'
  properties: Record<string, any>
  geometry: { type: 'Point'; coordinates: [number, number] }
}
type GeoJSONFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

type Warning = {
  responseCode: string | null
  status: string | null
  alasan: string
  detail?: unknown
}

const warnings: Warning[] = []
const counters = {
  total: 0,
  pelangganDiupdate: 0,
  pelangganTidakDitemukan: 0,
  potensiDibuat: 0,
  potensiDilewatiDuplikat: 0,
  eksPelangganDiproses: 0,
  eksPelangganCocokKePelanggan: 0,
  eksPelangganTanpaNomorValid: 0,
  statusTidakDikenal: 0,
}

// ------------------------------------------------------------
// Helper: normalisasi & parsing field mentah dari survei
// ------------------------------------------------------------

/** "00101800390" / " 00101800390 " / "101800390" -> "00101800390". null kalau tidak valid. */
function normalisasiNomorPelanggan(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  if (trimmed.length > 11) return null // data kotor (>11 digit), jangan dipaksa
  return trimmed.padStart(11, '0')
}

/**
 * Field "Nomor Eks Pelanggan" sering kotor:
 *   "00102000270 (No Rumah 33) 00102000300 (No Rumah 35) (29-08-2013)"
 *   "Elang Bayu-DJ5JNG"  (bukan nomor sama sekali — nama enumerator)
 * Ambil nomor 11-digit PERTAMA yang valid, sisanya diabaikan (tapi teks
 * mentah aslinya tetap disimpan terpisah di catatanSurveiAsli).
 */
function parseNomorEksPelanggan(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const match = raw.match(/\d{11}/)
  return match ? match[0] : null
}

function keYYYYMM(d: Date): number {
  return d.getFullYear() * 100 + (d.getMonth() + 1)
}

/** Parse tanggal dengan fallback berjenjang. Selalu balikin Date valid. */
function tentukanPeriode(
  tanggalCabut: unknown,
  submittedOn: unknown,
): {
  periode: number
  tanggalCabutParsed: Date | null
} {
  const tglCabut =
    typeof tanggalCabut === 'string' && tanggalCabut.trim()
      ? new Date(tanggalCabut)
      : null

  if (tglCabut && !isNaN(tglCabut.getTime())) {
    return { periode: keYYYYMM(tglCabut), tanggalCabutParsed: tglCabut }
  }

  const submitted =
    typeof submittedOn === 'string' && submittedOn.trim()
      ? new Date(submittedOn)
      : null

  if (submitted && !isNaN(submitted.getTime())) {
    return { periode: keYYYYMM(submitted), tanggalCabutParsed: null }
  }

  // Fallback terakhir: bulan saat script dijalankan, supaya tidak crash.
  return { periode: keYYYYMM(new Date()), tanggalCabutParsed: null }
}

function ambilLatLng(
  feature: GeoJSONFeature,
): { lat: number; lng: number } | null {
  const coords = feature.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const [lng, lat] = coords
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  return { lat, lng }
}

// ------------------------------------------------------------
// Helper: tulis kolom geometry (Unsupported type) via raw SQL
// ------------------------------------------------------------

async function setKoordinatPelanggan(id: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE "Pelanggan"
    SET koordinat = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${id}
  `
}

async function setKoordinatPotensi(id: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE "PotensiPelanggan"
    SET koordinat = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${id}
  `
}

async function setKoordinatVerifikasiPemutusan(
  id: string,
  lat: number,
  lng: number,
) {
  await prisma.$executeRaw`
    UPDATE "Pemutusan"
    SET "koordinatVerifikasi" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${id}
  `
}

// ------------------------------------------------------------
// Cache lookup Kelurahan (nama -> id), dibangun sekali di awal.
// Butuh prisma/seed.ts sudah dijalankan duluan.
// ------------------------------------------------------------

async function buatCacheKelurahan(): Promise<Map<string, string>> {
  const semua = await prisma.kelurahan.findMany({
    select: { id: true, nama: true },
  })
  const map = new Map<string, string>()
  for (const k of semua) map.set(k.nama.trim().toUpperCase(), k.id)
  return map
}

// ------------------------------------------------------------
// Handler 1: Status Kepelangganan = "Pelanggan"
// → UPDATE koordinat Pelanggan existing. TIDAK PERNAH insert baru di sini.
// ------------------------------------------------------------

async function tanganiPelangganAktif(f: GeoJSONFeature) {
  const p = f.properties
  const responseCode: string | null = p['Response Code'] ?? null
  const nolg = normalisasiNomorPelanggan(p['Nomor Pelanggan'])
  const titik = ambilLatLng(f)

  if (!nolg) {
    warnings.push({
      responseCode,
      status: 'Pelanggan',
      alasan: 'Nomor Pelanggan kosong/tidak valid di data survei',
      detail: p['Nomor Pelanggan'],
    })
    counters.pelangganTidakDitemukan++
    return
  }
  if (!titik) {
    warnings.push({
      responseCode,
      status: 'Pelanggan',
      alasan: 'Koordinat titik survei tidak valid',
    })
    return
  }

  const pelanggan = await prisma.pelanggan.findUnique({
    where: { nomorLangganan: nolg },
    select: { id: true },
  })

  if (!pelanggan) {
    warnings.push({
      responseCode,
      status: 'Pelanggan',
      alasan: `nomorLangganan ${nolg} tidak ditemukan di tabel Pelanggan`,
    })
    counters.pelangganTidakDitemukan++
    return
  }

  await setKoordinatPelanggan(pelanggan.id, titik.lat, titik.lng)
  counters.pelangganDiupdate++
}

// ------------------------------------------------------------
// Handler 2: Status Kepelangganan = "Non Pelanggan"
// → INSERT PotensiPelanggan baru (calon pelanggan/prospek).
// Idempoten lewat marker [SURVEI:<responseCode>] di kolom catatan,
// karena PotensiPelanggan belum punya kolom khusus untuk ini.
// ------------------------------------------------------------

async function tanganiNonPelanggan(
  f: GeoJSONFeature,
  kelurahanCache: Map<string, string>,
) {
  const p = f.properties
  const responseCode: string = p['Response Code'] ?? 'UNKNOWN'
  const marker = `[SURVEI:${responseCode}]`
  const titik = ambilLatLng(f)

  const sudahAda = await prisma.potensiPelanggan.findFirst({
    where: { catatan: { contains: marker } },
    select: { id: true },
  })
  if (sudahAda) {
    counters.potensiDilewatiDuplikat++
    return
  }

  const namaKelurahan = String(p['KELURAHAN'] ?? '')
    .trim()
    .toUpperCase()
  const kelurahanId = kelurahanCache.get(namaKelurahan)

  const alamatParts = [p['Nama Jalan'], p['Nomor Rumah'], p['Nama Gang']]
    .filter(Boolean)
    .join(' ')
  const alamat = alamatParts || p['Alamat'] || '(alamat tidak lengkap)'

  const catatan = [
    marker,
    p['Kategori Pelanggan'] ? `Kategori: ${p['Kategori Pelanggan']}` : null,
    p['Golongan Tarif']
      ? `Golongan tarif usulan: ${p['Golongan Tarif']}`
      : null,
    p['Luas Bangunan (m2)']
      ? `Luas bangunan: ${p['Luas Bangunan (m2)']} m2`
      : null,
    p['RT'] || p['RW'] ? `RT ${p['RT'] ?? '-'} / RW ${p['RW'] ?? '-'}` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  const potensi = await prisma.potensiPelanggan.create({
    data: {
      alamat: String(alamat),
      status: 'PROSPEK',
      catatan,
      kelurahanId: kelurahanId ?? null,
    },
  })

  if (titik) {
    try {
      await setKoordinatPotensi(potensi.id, titik.lat, titik.lng)
    } catch (geoError) {
      // Rollback data yang terlanjur dibuat agar bisa di-import ulang secara utuh nanti
      await prisma.potensiPelanggan.delete({ where: { id: potensi.id } })
      throw new Error(`Gagal menulis geometri PostGIS: ${geoError}`)
    }
  }

  if (!kelurahanId) {
    warnings.push({
      responseCode,
      status: 'Non Pelanggan',
      alasan: `Kelurahan "${namaKelurahan}" tidak ditemukan di cache (jalankan prisma/seed.ts dulu?)`,
    })
  }

  counters.potensiDibuat++
}

// ------------------------------------------------------------
// Handler 3: Status Kepelangganan = "Eks Pelanggan"
// → UPSERT ke Pemutusan (jenis = LAINNYA), idempoten lewat kodeSurvei.
// ------------------------------------------------------------

async function tanganiEksPelanggan(
  f: GeoJSONFeature,
  kelurahanCache: Map<string, string>, // Wajib menerima cache
) {
  const p = f.properties
  const responseCode: string = p['Response Code'] ?? 'UNKNOWN'
  const rawNomorEks: string | undefined = p['Nomor Eks Pelanggan']
  const titik = ambilLatLng(f)

  // 1. Resolve Kelurahan ID dari GeoJSON properties
  const namaKelurahan = String(p['KELURAHAN'] ?? '')
    .trim()
    .toUpperCase()
  const kelurahanId = kelurahanCache.get(namaKelurahan)

  // Jika kelurahan tidak ditemukan di database, catat sebagai warning agar bisa dicek
  if (!kelurahanId && namaKelurahan) {
    warnings.push({
      responseCode,
      status: 'Eks Pelanggan',
      alasan: `Kelurahan "${namaKelurahan}" tidak ditemukan di database`,
    })
  }

  const nolgParsed = parseNomorEksPelanggan(rawNomorEks)

  if (!nolgParsed) {
    counters.eksPelangganTanpaNomorValid++
    warnings.push({
      responseCode,
      status: 'Eks Pelanggan',
      alasan: "Tidak ada nomor 11-digit valid di field 'Nomor Eks Pelanggan'",
      detail: rawNomorEks,
    })
  }

  let pelangganId: string | null = null
  if (nolgParsed) {
    const cocok = await prisma.pelanggan.findUnique({
      where: { nomorLangganan: nolgParsed.padStart(11, '0') },
      select: { id: true },
    })
    if (cocok) {
      pelangganId = cocok.id
      counters.eksPelangganCocokKePelanggan++
      await prisma.pelanggan.update({
        where: { id: cocok.id },
        data: { status: 'CABUT_PERMANEN' },
      })
    }
  }

  const { periode, tanggalCabutParsed } = tentukanPeriode(
    p['Tanggal Cabut'],
    p['Submitted On'],
  )

  const catatan = [
    p['Alamat'] ? `Alamat survei: ${p['Alamat']}` : null,
    p['KELURAHAN'] ? `Kelurahan: ${p['KELURAHAN']}` : null,
    !nolgParsed ? 'PERLU REVIEW MANUAL' : null,
  ]
    .filter(Boolean)
    .join(' | ')

  // 2. Gunakan upsert dengan kelurahanId
  const pemutusan = await prisma.pemutusan.upsert({
    where: { kodeSurvei: responseCode },
    update: {
      pelangganId,
      kelurahanId: kelurahanId ?? null, // Update relasi
      nomorLangganan: nolgParsed,
      tanggalCabut: tanggalCabutParsed,
      catatan,
      catatanSurveiAsli: rawNomorEks ?? null,
    },
    create: {
      kodeSurvei: responseCode,
      pelangganId,
      kelurahanId: kelurahanId ?? null, // Insert relasi
      nomorLangganan: nolgParsed,
      jenis: 'LAINNYA',
      sumberData: 'SURVEI_GEOJSON',
      periode,
      tanggalCabut: tanggalCabutParsed,
      catatan,
      catatanSurveiAsli: rawNomorEks ?? null,
    },
  })

  if (titik) {
    await setKoordinatVerifikasiPemutusan(pemutusan.id, titik.lat, titik.lng)
  }

  counters.eksPelangganDiproses++
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  if (!fs.existsSync(SURVEY_GEOJSON_PATH)) {
    throw new Error(
      `File tidak ditemukan: ${SURVEY_GEOJSON_PATH}\n` +
        `Letakkan Data_progres_verifikasi_pelanggan_PW_5_2026.geojson di folder 'data/', ` +
        `atau sesuaikan SURVEY_GEOJSON_PATH di scripts/import-survey-pw5.ts.`,
    )
  }

  const geojson: GeoJSONFeatureCollection = JSON.parse(
    fs.readFileSync(SURVEY_GEOJSON_PATH, 'utf-8'),
  )
  counters.total = geojson.features.length

  console.log(`[import:survey] Memuat ${counters.total} titik survei...`)
  console.log('[import:survey] Membangun cache Kelurahan...')
  const kelurahanCache = await buatCacheKelurahan()
  if (kelurahanCache.size === 0) {
    console.warn(
      '  ⚠ Cache Kelurahan KOSONG. Sudah jalankan `npx prisma db seed` (prisma/seed.ts)?',
    )
  }

  for (const feature of geojson.features) {
    const p = feature.properties
    const status = p['Status Kepelangganan']
    const responseCode = p['Response Code'] ?? 'UNKNOWN'

    try {
      switch (status) {
        case 'Pelanggan':
          await tanganiPelangganAktif(feature)
          break
        case 'Non Pelanggan':
          await tanganiNonPelanggan(feature, kelurahanCache)
          break
        case 'Eks Pelanggan':
          await tanganiEksPelanggan(feature, kelurahanCache)
          break
        default:
          counters.statusTidakDikenal++
          warnings.push({
            responseCode,
            status: status ?? null,
            alasan: "Nilai 'Status Kepelangganan' tidak dikenal/kosong",
          })
      }
    } catch (error: any) {
      // Jika ada error pada satu baris, catat ke warning dan LAKUKAN CONTINUE
      counters.statusTidakDikenal++ // atau buat counter khusus error
      warnings.push({
        responseCode,
        status,
        alasan: `Gagal memproses baris ini: ${error?.message || error}`,
      })
      console.error(
        ` ❌ Error pada Response Code [${responseCode}]:`,
        error?.message || error,
      )
    }
  }

  // Tulis log warning ke file supaya bisa direview manual — data lapangan
  // ini cukup kotor (lihat komentar di schema.prisma), jangan dibuang diam-diam.
  if (warnings.length > 0) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
    fs.writeFileSync(WARNING_LOG_PATH, JSON.stringify(warnings, null, 2))
  }

  console.log('\n========== RINGKASAN IMPORT ==========')
  console.log(`Total baris survei         : ${counters.total}`)
  console.log(`Pelanggan koordinat diupdate: ${counters.pelangganDiupdate}`)
  console.log(
    `Pelanggan tidak ditemukan   : ${counters.pelangganTidakDitemukan}`,
  )
  console.log(`PotensiPelanggan dibuat     : ${counters.potensiDibuat}`)
  console.log(
    `PotensiPelanggan dilewati   : ${counters.potensiDilewatiDuplikat} (sudah pernah diimport)`,
  )
  console.log(`Eks Pelanggan diproses      : ${counters.eksPelangganDiproses}`)
  console.log(
    `  - cocok ke Pelanggan ada  : ${counters.eksPelangganCocokKePelanggan}`,
  )
  console.log(
    `  - tanpa nomor valid       : ${counters.eksPelangganTanpaNomorValid} (lihat catatanSurveiAsli)`,
  )
  console.log(`Status tidak dikenal        : ${counters.statusTidakDikenal}`)
  if (warnings.length > 0) {
    console.log(
      `\n⚠ ${warnings.length} warning ditulis ke: ${WARNING_LOG_PATH}`,
    )
  }
  console.log('=======================================\n')
}

main()
  .catch((e) => {
    console.error('[import:survey] Gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
