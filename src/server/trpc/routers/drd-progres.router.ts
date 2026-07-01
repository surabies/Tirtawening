// src/server/trpc/routers/drd/drd-progres.router.ts
//
// Sheet "PROGRES WP 5": tren SL & m³ per bulan lintas tahun.
// Sumber: LaporanHarianPetugas GROUP BY periode.

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

export const drdProgresRouter = router({
  /**
   * Tren bulanan SL tercatat & total m³ untuk rentang tahun tertentu.
   * Setiap baris = 1 periode (yyyymm), berisi jumlah SL unik dan total m³.
   */
  tren: protectedProcedure
    .input(
      z.object({
        tahunMulai: z.number().int().min(2020).default(2023),
        tahunAkhir: z
          .number()
          .int()
          .max(2030)
          .default(new Date().getFullYear()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const periodeMin = input.tahunMulai * 100 + 1
      const periodeMax = input.tahunAkhir * 100 + 12

      // Ambil semua baris dalam rentang periode, lalu group di aplikasi.
      // Prisma groupBy tidak tersedia untuk Int aggregate lintas periode secara
      // langsung dengan filter range — lebih aman groupBy manual.
      const rows = await ctx.prisma.laporanHarianPetugas.findMany({
        where: {
          periode: { gte: periodeMin, lte: periodeMax },
        },
        select: {
          periode: true,
          nomorLangganan: true,
          pemakaian: true,
        },
      })

      // Group by periode
      const periodeMap = new Map<number, { sl: Set<string>; totalM3: number }>()

      for (const row of rows) {
        let entry = periodeMap.get(row.periode)
        if (!entry) {
          entry = { sl: new Set(), totalM3: 0 }
          periodeMap.set(row.periode, entry)
        }
        entry.sl.add(row.nomorLangganan)
        entry.totalM3 += row.pemakaian
      }

      // Bangun array terurut per periode
      const items = Array.from(periodeMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([periode, { sl, totalM3 }], idx, arr) => {
          const jumlahSl = sl.size
          const m3PerSl = jumlahSl > 0 ? totalM3 / jumlahSl : 0

          // Kenaikan/penurunan vs bulan sebelumnya
          const prev = idx > 0 ? arr[idx - 1][1] : null
          const kenaikanSl = prev ? jumlahSl - prev.sl.size : null
          const kenaikanM3 = prev ? totalM3 - prev.totalM3 : null

          return {
            periode,
            jumlahSl,
            totalM3,
            m3PerSl: Math.round(m3PerSl * 1000) / 1000,
            kenaikanSl,
            kenaikanM3,
          }
        })

      return { items }
    }),
})
