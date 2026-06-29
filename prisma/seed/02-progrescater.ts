// seed/02-progrescater.ts
// Fase 2: Import ProgresCater — sumber master semua data pelanggan
//
// Urutan insert per baris CSV:
//   Zona (upsert jika belum ada) → Rute (upsert) → Kelurahan (upsert)
//   → Pelanggan (upsert) → Meter (upsert) → PembacaanMeter (upsert)
//   → Tagihan (upsert)
//
// Idempotent: semua pakai upsert dengan key bisnis, bukan id internal.

import { prisma } from './client'
import {
  readCsv,
  inBatches,
  log,
  normalizeNolg,
  normalizePencatat,
  normalizeMerk,
  normalizeNotelp,
  mapStatusPelanggan,
  mapKondisi,
  mapUkuranMeter,
  mapKategori,
  parseDate,
  thblToDate,
} from './utils'

export async function seedProgresCater(csvPath: string) {
  log('02-PROGRESCATER', `Baca file: ${csvPath}`)
  const rows = readCsv(csvPath)
  log('02-PROGRESCATER', `Total baris: ${rows.length}`)

  // Cache lookup FK agar tidak query DB berulang per baris
  const cacheWilSeksi = new Map<string, string>()
  const cacheSeksiCater = new Map<string, string>()
  const cacheRute = new Map<string, string>()
  const cacheZona = new Map<string, string>()
  const cacheKec = new Map<string, string>()
  const cacheKel = new Map<string, string>()
  const cacheTarif = new Map<string, string>()
  const cachePencatat = new Map<string, string | null>()

  // Preload semua referensi ke cache
  const allWilSeksi = await prisma.wilayahSeksi.findMany()
  const allSeksiCater = await prisma.seksiCater.findMany()
  const allRute = await prisma.rute.findMany()
  const allZona = await prisma.zona.findMany()
  const allKec = await prisma.kecamatan.findMany()
  const allKel = await prisma.kelurahan.findMany()
  const allTarif = await prisma.tarifGolongan.findMany()
  const allPencatat = await prisma.pencatat.findMany()

  allWilSeksi.forEach((r: (typeof allWilSeksi)[0]) =>
    cacheWilSeksi.set(r.kode, r.id),
  )
  allSeksiCater.forEach((r: (typeof allSeksiCater)[0]) =>
    cacheSeksiCater.set(r.kode, r.id),
  )
  allRute.forEach((r: (typeof allRute)[0]) => cacheRute.set(r.kode, r.id))
  allZona.forEach((r: (typeof allZona)[0]) => cacheZona.set(r.kode, r.id))
  allKec.forEach((r: (typeof allKec)[0]) => cacheKec.set(r.kode, r.id))
  allKel.forEach((r: (typeof allKel)[0]) => cacheKel.set(r.kode, r.id))
  allTarif.forEach((r: (typeof allTarif)[0]) =>
    cacheTarif.set(r.kodeAsli, r.id),
  )
  allPencatat.forEach((r: (typeof allPencatat)[0]) =>
    cachePencatat.set(r.namaLapangan, r.id),
  )

  let stats = { pelanggan: 0, meter: 0, pembacaan: 0, tagihan: 0, skip: 0 }

  await inBatches(rows, 500, async (batch: Record<string, string>[]) => {
    for (const row of batch) {
      const nolg = normalizeNolg(row['nolg'])
      if (!nolg || nolg === '00000000000') {
        stats.skip++
        continue
      }

      // ── Resolve FK wilayah ──────────────────────────────────────────────

      const zonaKode = row['zonakode']?.trim()
      if (zonaKode && !cacheZona.has(zonaKode)) {
        const wilSeksiId =
          cacheWilSeksi.get(row['wilseksikode']?.trim() ?? '') ?? null
        if (wilSeksiId) {
          const zona = await prisma.zona.upsert({
            where: { kode: zonaKode },
            update: {},
            create: {
              kode: zonaKode,
              nama: row['zonanama']?.trim() ?? zonaKode,
              wilayahSeksiId: wilSeksiId,
            },
          })
          cacheZona.set(zonaKode, zona.id)
        }
      }

      const ruteKode = row['rute_kode']?.trim()
      if (ruteKode && !cacheRute.has(ruteKode)) {
        const seksiId =
          cacheSeksiCater.get(row['caterseksikode']?.trim() ?? '') ?? null
        if (seksiId) {
          const rute = await prisma.rute.upsert({
            where: { kode: ruteKode },
            update: {},
            create: { kode: ruteKode, seksiCaterId: seksiId },
          })
          cacheRute.set(ruteKode, rute.id)
        }
      }

      const kelKode = row['kdkel']?.trim()
      if (kelKode && !cacheKel.has(kelKode)) {
        const kecId = cacheKec.get(row['kdkec']?.trim() ?? '') ?? null
        if (kecId) {
          const kel = await prisma.kelurahan.upsert({
            where: { kode: kelKode },
            update: {},
            create: {
              kode: kelKode,
              nama: row['namakel']?.trim() ?? kelKode,
              kecamatanId: kecId,
            },
          })
          cacheKel.set(kelKode, kel.id)
        }
      }

      const seksiCaterId =
        cacheSeksiCater.get(row['caterseksikode']?.trim() ?? '') ?? null
      const ruteId = cacheRute.get(ruteKode ?? '') ?? null
      const zonaId = cacheZona.get(zonaKode ?? '') ?? null
      const kecId = cacheKec.get(row['kdkec']?.trim() ?? '') ?? null
      const kelId = cacheKel.get(kelKode ?? '') ?? null
      const tarifId = cacheTarif.get(row['trp']?.trim() ?? '') ?? null

      const pencatatNama = normalizePencatat(row['pencatat'])
      const pencatatId = pencatatNama
        ? (cachePencatat.get(pencatatNama) ?? null)
        : null

      const isMBR = row['ismbr']?.trim().toLowerCase() === 't'
      const rt = row['rt'] ? String(row['rt']).padStart(3, '0') : null
      const rw = row['rw'] ? String(row['rw']).padStart(3, '0') : null
      const notelp = normalizeNotelp(row['notelp'])

      // ── Pelanggan ───────────────────────────────────────────────────────
      const pelanggan = await prisma.pelanggan.upsert({
        where: { nomorLangganan: nolg },
        update: {
          nama: row['nama']?.trim(),
          alamat: row['almt']?.trim(),
          rt,
          rw,
          notelp,
          isMBR,
          status: mapStatusPelanggan(row['mutasikode'], row['mutasinama']),
          tarifGolonganId: tarifId,
          seksiCaterId,
          ruteId,
          zonaId,
          kecamatanId: kecId,
          kelurahanId: kelId,
        },
        create: {
          nomorLangganan: nolg,
          nomorPersil: row['nprs']?.trim() ?? '',
          nama: row['nama']?.trim() ?? '',
          alamat: row['almt']?.trim() ?? '',
          rt,
          rw,
          notelp,
          isMBR,
          status: mapStatusPelanggan(row['mutasikode'], row['mutasinama']),
          tarifGolonganId: tarifId,
          seksiCaterId,
          ruteId,
          zonaId,
          kecamatanId: kecId,
          kelurahanId: kelId,
        },
      })
      stats.pelanggan++

      // ── Meter ───────────────────────────────────────────────────────────
      const nometer = row['nometer']?.trim()
      if (!nometer || nometer === '') {
        stats.skip++
        continue
      }

      const existingMeter = await prisma.meter.findFirst({
        where: { pelangganId: pelanggan.id, isAktif: true },
      })

      let meterId: string

      if (existingMeter) {
        if (existingMeter.nomorMeter !== nometer) {
          await prisma.meter.update({
            where: { id: existingMeter.id },
            data: { isAktif: false },
          })
          const meter = await prisma.meter.create({
            data: {
              nomorMeter: nometer,
              nomorSegel: row['nosegelmeter']
                ? String(row['nosegelmeter']).trim()
                : null,
              merkKode: normalizeMerk(row['kd_merkmeter']),
              ukuran: mapUkuranMeter(row['ukmeter']),
              tanggalPasang: parseDate(row['tglpasangmeter']),
              umurTahun: row['umurmeterthn']
                ? parseInt(row['umurmeterthn'])
                : null,
              umurBulan: row['umurmeterbln']
                ? parseInt(row['umurmeterbln'])
                : null,
              isAktif: true,
              pelangganId: pelanggan.id,
            },
          })
          meterId = meter.id
        } else {
          await prisma.meter.update({
            where: { id: existingMeter.id },
            data: {
              nomorSegel: row['nosegelmeter']
                ? String(row['nosegelmeter']).trim()
                : null,
              merkKode: normalizeMerk(row['kd_merkmeter']),
              ukuran: mapUkuranMeter(row['ukmeter']),
              tanggalPasang: parseDate(row['tglpasangmeter']),
              umurTahun: row['umurmeterthn']
                ? parseInt(row['umurmeterthn'])
                : null,
              umurBulan: row['umurmeterbln']
                ? parseInt(row['umurmeterbln'])
                : null,
            },
          })
          meterId = existingMeter.id
        }
      } else {
        const meter = await prisma.meter.create({
          data: {
            nomorMeter: nometer,
            nomorSegel: row['nosegelmeter']
              ? String(row['nosegelmeter']).trim()
              : null,
            merkKode: normalizeMerk(row['kd_merkmeter']),
            ukuran: mapUkuranMeter(row['ukmeter']),
            tanggalPasang: parseDate(row['tglpasangmeter']),
            umurTahun: row['umurmeterthn']
              ? parseInt(row['umurmeterthn'])
              : null,
            umurBulan: row['umurmeterbln']
              ? parseInt(row['umurmeterbln'])
              : null,
            isAktif: true,
            pelangganId: pelanggan.id,
          },
        })
        meterId = meter.id
      }
      stats.meter++

      // ── PembacaanMeter ──────────────────────────────────────────────────
      const thbl = parseInt(row['thbl'])
      const periode = thblToDate(thbl)

      const pembacaan = await prisma.pembacaanMeter.upsert({
        where: { meterId_periode: { meterId, periode } },
        update: {
          standLalu: parseInt(row['stml']) || 0,
          standAkhir: parseInt(row['stma']) || 0,
          pemakaianM3: parseInt(row['pakai_drd']) || 0,
          blokTarif: parseInt(row['blok_m3']) || 1,
          pemakaianLalu: row['pakailalu'] ? parseInt(row['pakailalu']) : null,
          blokTarifLalu: row['blok_m3lalu']
            ? parseInt(row['blok_m3lalu'])
            : null,
          kondisi: mapKondisi(row['ketcatat']),
          kategori: mapKategori(row['kategorialnama']),
          pencatatId,
          tanggalCatat: parseDate(row['tglcatat']),
        },
        create: {
          meterId,
          periode,
          standLalu: parseInt(row['stml']) || 0,
          standAkhir: parseInt(row['stma']) || 0,
          pemakaianM3: parseInt(row['pakai_drd']) || 0,
          blokTarif: parseInt(row['blok_m3']) || 1,
          pemakaianLalu: row['pakailalu'] ? parseInt(row['pakailalu']) : null,
          blokTarifLalu: row['blok_m3lalu']
            ? parseInt(row['blok_m3lalu'])
            : null,
          kondisi: mapKondisi(row['ketcatat']),
          kategori: mapKategori(row['kategorialnama']),
          pencatatId,
          tanggalCatat: parseDate(row['tglcatat']),
        },
      })
      stats.pembacaan++

      // ── Tagihan ─────────────────────────────────────────────────────────
      const jmlHargaAir = parseInt(row['jmlhargaair']) || 0
      const beaBeban = parseInt(row['beabeban']) || 7000
      const beaAdmin = parseInt(row['beaadmin']) || 10000
      const airKotor = parseInt(row['airkotor']) || 11100
      const lainLain = parseInt(row['lainlain']) || 0
      const totalTagihan = parseInt(row['tjtg']) || 0

      const tagnunggak =
        row['tagnunggak'] &&
        row['tagnunggak'] !== '' &&
        !isNaN(Number(row['tagnunggak']))
          ? BigInt(Math.round(parseFloat(row['tagnunggak'])))
          : null
      const jmlRekNunggak =
        row['jmlreknunggak'] && row['jmlreknunggak'] !== ''
          ? parseInt(row['jmlreknunggak'])
          : null

      const jatuhTempo = new Date(periode)
      jatuhTempo.setDate(20)

      await prisma.tagihan.upsert({
        where: { pembacaanId: pembacaan.id },
        update: {
          jmlHargaAir,
          beaBeban,
          beaAdmin,
          airKotor,
          lainLain,
          totalTagihan,
          jumlahRekTunggak: jmlRekNunggak,
          nominalTunggak: tagnunggak,
        },
        create: {
          pelangganId: pelanggan.id,
          pembacaanId: pembacaan.id,
          periode,
          pemakaianM3: parseInt(row['pakai_drd']) || 0,
          jmlHargaAir,
          beaBeban,
          beaAdmin,
          airKotor,
          lainLain,
          totalTagihan,
          jumlahRekTunggak: jmlRekNunggak,
          nominalTunggak: tagnunggak,
          tanggalJatuhTempo: jatuhTempo,
        },
      })
      stats.tagihan++
    }
  })

  log(
    '02-PROGRESCATER',
    `✓ Pelanggan: ${stats.pelanggan}, Meter: ${stats.meter}, Pembacaan: ${stats.pembacaan}, Tagihan: ${stats.tagihan}, Skip: ${stats.skip}`,
  )
}
