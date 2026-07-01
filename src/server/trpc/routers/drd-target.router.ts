// src/server/trpc/routers/drd/drd-target.router.ts
//
// Sheet "TARGET WP 5": target vs realisasi SL & m³ per bulan dalam satu tahun.
// Sumber: TargetKinerja (target) + LaporanHarianPetugas (realisasi).

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

export const drdTargetRouter = router({
  /**
   * Perbandingan target vs realisasi untuk setiap bulan dalam satu tahun.
   * Realisasi dihitung dari LaporanHarianPetugas per periode.
   * Target diambil dari TargetKinerja.
   */
  targetVsRealisasi: protectedProcedure
    .input(
      z.object({
        tahun: z.number().int().min(2020).default(new Date().getFullYear()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tahun } = input

      // ── 1. Ambil target dari TargetKinerja untuk tahun ini ─────────────────
      const targets = await ctx.prisma.targetKinerja.findMany({
        where: { tahun },
      })

      // Mapping bulan → target (bulan null = target tahunan keseluruhan)
      const targetByBulan = new Map<number | null, (typeof targets)[0]>()
      for (const t of targets) {
        targetByBulan.set(t.bulan, t)
      }

      // ── 2. Ambil realisasi per bulan dari LaporanHarianPetugas ─────────────
      const periodeMin = tahun * 100 + 1
      const periodeMax = tahun * 100 + 12

      const rows = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { periode: { gte: periodeMin, lte: periodeMax } },
        select: { periode: true, nomorLangganan: true, pemakaian: true },
      })

      // Group by periode (bulan)
      const realisasiMap = new Map<
        number,
        { sl: Set<string>; totalM3: number }
      >()

      for (const row of rows) {
        let entry = realisasiMap.get(row.periode)
        if (!entry) {
          entry = { sl: new Set(), totalM3: 0 }
          realisasiMap.set(row.periode, entry)
        }
        entry.sl.add(row.nomorLangganan)
        entry.totalM3 += row.pemakaian
      }

      // ── 3. Susun 12 bulan dengan target & realisasi ─────────────────────────
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

      const items = Array.from({ length: 12 }, (_, i) => {
        const bulan = i + 1
        const periode = tahun * 100 + bulan
        const realisasi = realisasiMap.get(periode)
        const target = targetByBulan.get(bulan) ?? targetByBulan.get(null)

        const realisasiSl = realisasi?.sl.size ?? 0
        const realisasiM3 = realisasi?.totalM3 ?? 0
        const targetSl = 0 // TargetKinerja tidak menyimpan target SL per bulan
        const targetM3 = target ? Number(target.targetKubikasi) : 0

        const selisihSl = realisasiSl - targetSl
        const selisihM3 = realisasiM3 - targetM3
        const prosentaseSl =
          targetSl > 0 ? (realisasiSl / targetSl) * 100 : null
        const prosentaseM3 =
          targetM3 > 0 ? (realisasiM3 / targetM3) * 100 : null

        return {
          bulan,
          namaBulan: NAMA_BULAN[bulan],
          periode,
          sudahAda: !!realisasi,
          target: {
            sl: targetSl,
            m3: targetM3,
          },
          realisasi: {
            sl: realisasiSl,
            m3: realisasiM3,
            m3PerSl:
              realisasiSl > 0
                ? Math.round((realisasiM3 / realisasiSl) * 1000) / 1000
                : 0,
          },
          selisih: { sl: selisihSl, m3: selisihM3 },
          prosentase: {
            sl:
              prosentaseSl !== null
                ? Math.round(prosentaseSl * 100) / 100
                : null,
            m3:
              prosentaseM3 !== null
                ? Math.round(prosentaseM3 * 100) / 100
                : null,
          },
        }
      })

      // ── 4. Jumlah & capaian keseluruhan ────────────────────────────────────
      const totalRealisasiM3 = items.reduce((s, i) => s + i.realisasi.m3, 0)
      const totalTargetM3 = items.reduce((s, i) => s + i.target.m3, 0)
      const capaianM3 =
        totalTargetM3 > 0 ? (totalRealisasiM3 / totalTargetM3) * 100 : null

      return {
        tahun,
        items,
        summary: {
          totalRealisasiM3,
          totalTargetM3,
          capaianM3:
            capaianM3 !== null ? Math.round(capaianM3 * 100) / 100 : null,
        },
      }
    }),
})
