// seed/05-rnomor.ts
// Fase 5: Import r-nomor — riwayat pemutusan TSM dan SPT
//
// Catatan:
// - 19 nolg di r-nomor tidak ada di ProgresCater → normal (sudah dicabut sebelum closing)
//   Script tetap membuat record Pemutusan, hanya update status Pelanggan jika ada.
// - Format tanggal M/D/YYYY (mis. "4/8/2026") → diparse via parseDate()

import { prisma } from './client'
import { JenisPemutusan, StatusPelanggan } from '@/generated/prisma/client'
import { readCsv, log, normalizeNolg, parseDate } from './utils'

export async function seedRNomor(csvPath: string) {
  log('05-RNOMOR', `Baca file: ${csvPath}`)
  const rows = readCsv(csvPath)
  log('05-RNOMOR', `Total baris: ${rows.length}`)

  let stats = { tsm: 0, spt: 0, noMatch: 0, skip: 0 }

  for (const row of rows) {
    const nolg = normalizeNolg(row['nomor_pelanggan'])
    const jenis = row['jenis_pemutusan']?.trim().toUpperCase() as 'TSM' | 'SPT'
    const periode = parseInt(row['periode'])

    if (!nolg || !jenis || isNaN(periode)) {
      stats.skip++
      continue
    }
    if (jenis !== 'TSM' && jenis !== 'SPT') {
      stats.skip++
      continue
    }

    const pelanggan = await prisma.pelanggan.findUnique({
      where: { nomorLangganan: nolg },
    })

    if (pelanggan) {
      const statusBaru =
        jenis === 'TSM'
          ? StatusPelanggan.TUTUP_SEMENTARA
          : StatusPelanggan.TUTUP_SPT

      await prisma.pelanggan.update({
        where: { id: pelanggan.id },
        data: { status: statusBaru },
      })
    } else {
      log(
        '05-RNOMOR',
        `ℹ Pelanggan ${nolg} tidak ditemukan (sudah dicabut sebelum closing) — tetap insert Pemutusan`,
      )
      stats.noMatch++
    }

    if (!pelanggan) {
      continue
    }

    const existing = await prisma.pemutusan.findFirst({
      where: {
        pelangganId: pelanggan.id,
        jenis: jenis === 'TSM' ? JenisPemutusan.TSM : JenisPemutusan.SPT,
        periode,
      },
    })
    if (existing) {
      continue
    }

    if (jenis === 'TSM') {
      await prisma.pemutusan.create({
        data: {
          pelangganId: pelanggan.id,
          jenis: JenisPemutusan.TSM,
          periode,
          nomorSurat: row['no_surat']?.trim() || null,
          tanggalPermohonan: parseDate(row['tgl_permohonan']),
          tanggalCabut: parseDate(row['tgl_cabut']),
        },
      })
      stats.tsm++
    } else {
      await prisma.pemutusan.create({
        data: {
          pelangganId: pelanggan.id,
          jenis: JenisPemutusan.SPT,
          periode,
          nomorSPT: row['no_spt']?.trim() || null,
          tanggalSPT: parseDate(row['tgl_spt']),
          tanggalTutup: parseDate(row['tgl_tutup']),
          tanggalCabut: parseDate(row['tgl_cabut']),
        },
      })
      stats.spt++
    }
  }

  log(
    '05-RNOMOR',
    `✓ TSM: ${stats.tsm}, SPT: ${stats.spt}, Tidak ditemukan: ${stats.noMatch}, Skip: ${stats.skip}`,
  )
}
