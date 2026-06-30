// seed/03-lapdatameter.ts
// Fase 3: Import laporan harian petugas
//
// Catatan penting:
// - nomorLangganan disimpan sebagai string (bukan FK langsung) karena
//   30 baris merujuk pelanggan yang belum ada di ProgresCater (PBPK baru / dicabut)
// - @@unique([nomorLangganan, periode]) mencegah duplikat saat re-run
// - kd_petugas "-" → pencatatId = null

import { prisma } from './client'
import {
  readCsv,
  inBatches,
  log,
  normalizeNolg,
  normalizePencatat,
  mapKondisi,
  mapKategori,
  parseDate,
} from './utils'

export async function seedLapdatameter(csvPath: string) {
  log('03-LAPDATAMETER', `Baca file: ${csvPath}`)
  const rows = readCsv(csvPath)
  log('03-LAPDATAMETER', `Total baris: ${rows.length}`)

  const allPencatat = await prisma.pencatat.findMany()
  const cachePencatat = new Map(allPencatat.map((p) => [p.namaLapangan, p.id]))

  let stats = { inserted: 0, updated: 0, skip: 0 }

  // Gunakan batch yang lebih kecil jika masih timeout, tapi ini sudah jauh lebih efisien
  await inBatches(rows, 500, async (batch) => {
    for (const row of batch) {
      const nolg = normalizeNolg(row['No Pel'])
      const periode = parseInt(row['Periode'])
      if (!nolg || nolg === '00000000000' || !periode || isNaN(periode)) {
        stats.skip++
        continue
      }

      // kd_petugas kadang "-" (kosong) padahal kolom "Nama Petugas" tetap
      // terisi nama valid (terbukti 26 baris di data lapdatameter punya
      // kd_petugas="-" tapi Nama Petugas="AGUS"/"DIDIN"/dst). Fallback ke
      // "Nama Petugas" supaya baris ini tidak salah nyasar jadi "tidak
      // diketahui" padahal sebenarnya petugasnya diketahui.
      const pencatatNama =
        normalizePencatat(row['kd_petugas']) ??
        normalizePencatat(row['Nama Petugas'])
      const pencatatId = pencatatNama
        ? (cachePencatat.get(pencatatNama) ?? null)
        : null

      // Strategi: Upsert langsung ke DB
      // Ini jauh lebih cepat daripada findUnique diikuti update/create terpisah
      await prisma.laporanHarianPetugas.upsert({
        where: {
          nomorLangganan_periode: { nomorLangganan: nolg, periode },
        },
        update: {
          standAwal: parseInt(row['St AWAL']) || 0,
          standAkhir: parseInt(row['St Akhir']) || 0,
          pemakaian: parseInt(row['Pakai']) || 0,
          pemakaianLalu: row['Pakai Lau'] ? parseInt(row['Pakai Lau']) : null,
          persentase: row['persentase'] ? parseInt(row['persentase']) : null,
          kondisi: mapKondisi(row['Nm_Kel']),
          kategori: mapKategori(row['Zona Wil']),
          nomorMeter: row['kd_wm']?.trim() || null,
          pencatatId,
          tanggalCatat: parseDate(row['tgl_catat']),
          tanggalUpload: parseDate(row['tgl_upload']),
        },
        create: {
          nomorLangganan: nolg,
          periode,
          standAwal: parseInt(row['St AWAL']) || 0,
          standAkhir: parseInt(row['St Akhir']) || 0,
          pemakaian: parseInt(row['Pakai']) || 0,
          pemakaianLalu: row['Pakai Lau'] ? parseInt(row['Pakai Lau']) : null,
          persentase: row['persentase'] ? parseInt(row['persentase']) : null,
          kondisi: mapKondisi(row['Nm_Kel']),
          kategori: mapKategori(row['Zona Wil']),
          nomorMeter: row['kd_wm']?.trim() || null,
          pencatatId,
          tanggalCatat: parseDate(row['tgl_catat']),
          tanggalUpload: parseDate(row['tgl_upload']),
        },
      })

      // Catatan: upsert tidak mudah menghitung inserted/updated secara manual
      stats.inserted++
    }
  })

  log('03-LAPDATAMETER', `Selesai memproses batch data.`)
}
