// src/server/trpc/routers/drd/drd-mutasi.router.ts
//
// Sheet "PENAMBAHAN SL": mutasi pelanggan bulanan (PB, PK, PS).
// Sumber: MutasiPelanggan (PB & PK) + StatusPelanggan history (PS/pemutusan).
//
// Catatan: MutasiPelanggan hanya punya jenis PB dan PK.
// Pemutusan (PS) dihitung dari Pelanggan dengan status TUTUP_SEMENTARA/TUTUP_SPT
// yang updatedAt jatuh di bulan tersebut — ini pendekatan proxy karena tidak ada
// model MutasiPemutusan terpisah di skema saat ini.

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

const NAMA_BULAN = [
  '',
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
]

export const drdMutasiRouter = router({
  /**
   * Rekap mutasi pelanggan per bulan dalam satu tahun.
   * Penambahan: PB (Pasang Baru), PK (Perubahan/Koreksi)
   * Pengurangan: PS (Pemutusan Sementara via model Pemutusan)
   */
  perBulan: protectedProcedure
    .input(
      z.object({
        tahun: z.number().int().min(2020).default(new Date().getFullYear()),
        targetPerBulan: z.number().int().default(15),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tahun, targetPerBulan } = input

      // ── 1. Ambil semua mutasi tahun ini ───────────────────────────────────
      const periodeMin = tahun * 100 + 1
      const periodeMax = tahun * 100 + 12

      const mutasi = await ctx.prisma.mutasiPelanggan.findMany({
        where: { periode: { gte: periodeMin, lte: periodeMax } },
        select: { jenis: true, periode: true },
      })

      // Group mutasi by bulan & jenis
      const mutasiMap = new Map<number, { PB: number; PK: number }>()

      for (const m of mutasi) {
        const bulan = m.periode % 100
        if (!mutasiMap.has(bulan)) {
          mutasiMap.set(bulan, { PB: 0, PK: 0 })
        }
        const entry = mutasiMap.get(bulan)!
        if (m.jenis === 'PB') entry.PB++
        else if (m.jenis === 'PK') entry.PK++
      }

      // ── 2. Ambil pemutusan (PS) dari model Pemutusan via Pelanggan ─────────
      // Pendekatan: query Pemutusan yang createdAt dalam tahun ini.
      // Karena model Pemutusan belum di-upload, kita skip PS untuk sementara
      // dan kembalikan 0 — mudah diextend nanti dengan query Pemutusan asli.
      const psMap = new Map<number, number>()
      // TODO: extend dengan ctx.prisma.pemutusan.findMany(...)
      // setelah skema Pemutusan dikonfirmasi

      // ── 3. Susun 12 bulan ─────────────────────────────────────────────────
      const items = Array.from({ length: 12 }, (_, i) => {
        const bulan = i + 1
        const m = mutasiMap.get(bulan) ?? { PB: 0, PK: 0 }
        const ps = psMap.get(bulan) ?? 0
        const totalPenambahan = m.PB + m.PK
        const totalPengurangan = ps
        const jumlahMutasi = totalPenambahan - totalPengurangan

        return {
          bulan,
          namaBulan: NAMA_BULAN[bulan],
          target: targetPerBulan,
          penambahan: {
            pb: m.PB,
            pk: m.PK,
            jumlah: totalPenambahan,
          },
          pengurangan: {
            ps,
            jumlah: totalPengurangan,
          },
          jumlahMutasi,
          sudahAda: mutasiMap.has(bulan),
        }
      })

      // ── 4. Summary ────────────────────────────────────────────────────────
      const totalPb = items.reduce((s, i) => s + i.penambahan.pb, 0)
      const totalPk = items.reduce((s, i) => s + i.penambahan.pk, 0)
      const totalPs = items.reduce((s, i) => s + i.pengurangan.ps, 0)
      const totalPenambahan = totalPb + totalPk
      const totalPengurangan = totalPs
      const totalTarget = targetPerBulan * 12

      return {
        tahun,
        items,
        summary: {
          totalTarget,
          totalPb,
          totalPk,
          totalPenambahan,
          totalPs,
          totalPengurangan,
          nettMutasi: totalPenambahan - totalPengurangan,
        },
      }
    }),
})
