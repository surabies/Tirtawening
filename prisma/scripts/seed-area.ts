// ============================================================
// prisma/seed.ts
// Seed data referensi/master — dijalankan via `npx prisma db seed`
//
// STRATEGI BARU:
// Script ini HANYA akan melakukan UPDATE kolom `area` pada data
// Kecamatan dan Kelurahan yang SUDAH ADA di database berdasarkan
// pencocokan NAMA (Case Insensitive).
// Jika nama di GeoJSON tidak ditemukan di database, data akan di-SKIP.
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

const AREA_GEOJSON_PATH = path.join(
  process.cwd(),
  'data',
  'Area_layanan_Wilayah_5.geojson',
)

type GeoJSONFeature = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: unknown }
}
type GeoJSONFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

async function seedWilayahKecamatanKelurahan() {
  if (!fs.existsSync(AREA_GEOJSON_PATH)) {
    throw new Error(
      `File tidak ditemukan: ${AREA_GEOJSON_PATH}\n` +
        `Letakkan Area_layanan_Wilayah_5.geojson di folder 'data/' pada root project.`,
    )
  }

  const raw = fs.readFileSync(AREA_GEOJSON_PATH, 'utf-8')
  const geojson: GeoJSONFeatureCollection = JSON.parse(raw)

  console.log(
    `\n[seed:wilayah] Membaca ${geojson.features.length} kelurahan dari geojson...`,
  )

  const kecamatanIdSet = new Set<string>()
  let okCount = 0
  let skipCount = 0

  for (const feature of geojson.features) {
    const p = feature.properties as Record<string, any>

    // Kita abaikan KODE dari GeoJSON, kita fokus pada NAMA
    const namaKec = String(p.KECAMATAN ?? '').trim()
    const namaKel = String(p.DESA_KELUR ?? p.DESA ?? '').trim()

    if (!namaKec || !namaKel) {
      console.warn(`  ⚠ Lewati feature tanpa nama wilayah yang jelas.`)
      skipCount++
      continue
    }

    try {
      // 1. Cari Data Kecamatan di DB berdasarkan NAMA
      const masterKec = await prisma.kecamatan.findFirst({
        where: { nama: { equals: namaKec, mode: 'insensitive' } },
      })

      if (!masterKec) {
        console.warn(`  ⚠ Kecamatan '${namaKec}' tidak ada di DB Master. Skip.`)
        skipCount++
        continue
      }

      // Simpan ID kecamatan yang valid untuk proses ST_Union nanti
      kecamatanIdSet.add(masterKec.id)

      // 2. Cari Data Kelurahan di DB berdasarkan NAMA dan ID Kecamatan
      const masterKel = await prisma.kelurahan.findFirst({
        where: {
          nama: { equals: namaKel, mode: 'insensitive' },
          kecamatanId: masterKec.id,
        },
      })

      if (!masterKel) {
        console.warn(
          `  ⚠ Kelurahan '${namaKel}' (Kec. ${namaKec}) tidak ada di DB Master. Skip.`,
        )
        skipCount++
        continue
      }

      // 3. JIKA KETEMU: Update kolom area Kelurahan via raw SQL
      // Menggunakan ST_MakeValid untuk mencegah TopologyException
      await prisma.$executeRaw`
        UPDATE "Kelurahan"
        SET area = ST_MakeValid(ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(
          feature.geometry,
        )}), 4326)))
        WHERE id = ${masterKel.id}
      `

      console.log(`  ✓ Update Area: ${namaKec} / ${namaKel}`)
      okCount++
    } catch (e) {
      console.error(`  ✗ Gagal proses ${namaKec} / ${namaKel}:`, e)
      skipCount++
    }
  }

  console.log(
    `\n[seed:wilayah] Menghitung batas ${kecamatanIdSet.size} kecamatan via ST_Union dari kelurahan anggotanya...`,
  )

  // 4. Update area Kecamatan berdasarkan Kelurahan yang barusan di-update
  for (const kecamatanId of kecamatanIdSet) {
    await prisma.$executeRaw`
      UPDATE "Kecamatan" k
      SET area = (
        SELECT ST_Multi(ST_Union(ST_MakeValid(kel.area)))
        FROM "Kelurahan" kel
        WHERE kel."kecamatanId" = ${kecamatanId} AND kel.area IS NOT NULL
      )
      WHERE k.id = ${kecamatanId}
    `
  }

  console.log(
    `[seed:wilayah] Selesai. Berhasil Update: ${okCount}, Di-skip/Gagal: ${skipCount}.\n`,
  )
}

async function main() {
  await seedWilayahKecamatanKelurahan()
}

main()
  .catch((e) => {
    console.error('[seed] Gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
