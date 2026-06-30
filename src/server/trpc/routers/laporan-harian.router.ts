// src/server/routers/laporan-harian.router.ts
//
// Router untuk halaman "Laporan Harian Pencatatan".
// - stats: 4 metric card (SL & m3 tercatat periode berjalan, vs periode lalu)
// - progress: tabel progres pencatatan per petugas per hari (semua data,
//   tanpa filter periode — sesuai kebutuhan monitoring harian)

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** periode berjalan dalam format yyyymm (sama seperti LaporanMandiri). */
function getPeriodeBerjalan(): number {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

/** periode bulan sebelumnya dalam format yyyymm. */
function getPeriodeLalu(periodeBerjalan: number): number {
  const year = Math.floor(periodeBerjalan / 100)
  const month = periodeBerjalan % 100
  if (month === 1) return (year - 1) * 100 + 12
  return year * 100 + (month - 1)
}

// ── Router ────────────────────────────────────────────────────────────────────

export const laporanHarianRouter = router({
  /**
   * 4 metric card:
   * - Jumlah SL Tercatat & Total m3 Tercatat → periode berjalan
   * - Jumlah SL Lalu & Total m3 Lalu → periode bulan sebelumnya
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const periodeBerjalan = getPeriodeBerjalan()
    const periodeLalu = getPeriodeLalu(periodeBerjalan)

    const [tercatatAgg, laluAgg] = await Promise.all([
      ctx.prisma.laporanHarianPetugas.aggregate({
        where: { periode: periodeBerjalan },
        _count: { _all: true },
        _sum: { pemakaian: true },
      }),
      ctx.prisma.laporanHarianPetugas.aggregate({
        where: { periode: periodeLalu },
        _count: { _all: true },
        _sum: { pemakaian: true },
      }),
    ])

    return {
      periodeBerjalan,
      periodeLalu,
      jumlahSlTercatat: tercatatAgg._count._all,
      totalM3Tercatat: tercatatAgg._sum.pemakaian ?? 0,
      jumlahSlLalu: laluAgg._count._all,
      totalM3Lalu: laluAgg._sum.pemakaian ?? 0,
    }
  }),

  /**
   * Tabel progres pencatatan per petugas per hari.
   * Tanpa filter periode/tanggal — menampilkan seluruh data,
   * di-group berdasarkan (pencatatId, tanggalCatat).
   *
   * Catatan: group-by tanggal dilakukan di level aplikasi (bukan Prisma
   * groupBy langsung) karena tanggalCatat adalah DateTime — perlu
   * dinormalisasi ke "hari" (tanpa jam) sebelum di-group.
   */
  progress: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Ambil semua baris yang punya tanggalCatat (baris tanpa tanggalCatat
      // tidak bisa di-group per hari, jadi dikecualikan dari tabel progres).
      const rows = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { tanggalCatat: { not: null } },
        select: {
          pencatatId: true,
          tanggalCatat: true,
          pemakaian: true,
          pencatat: {
            select: { id: true, namaLapangan: true, namaLengkap: true },
          },
        },
      })

      // Group by (pencatatId, tanggal-tanpa-jam)
      type GroupKey = string
      const groups = new Map<
        GroupKey,
        {
          pencatatId: string | null
          namaPetugas: string
          tanggal: string // yyyy-mm-dd
          jumlahSl: number
          totalM3: number
        }
      >()

      for (const row of rows) {
        const tgl = row.tanggalCatat!.toISOString().slice(0, 10) // yyyy-mm-dd
        const key = `${row.pencatatId ?? 'unknown'}__${tgl}`

        const namaPetugas =
          row.pencatat?.namaLengkap ??
          row.pencatat?.namaLapangan ??
          'Tidak diketahui'

        const existing = groups.get(key)
        if (existing) {
          existing.jumlahSl += 1
          existing.totalM3 += row.pemakaian
        } else {
          groups.set(key, {
            pencatatId: row.pencatatId,
            namaPetugas,
            tanggal: tgl,
            jumlahSl: 1,
            totalM3: row.pemakaian,
          })
        }
      }

      // Urutkan: tanggal terbaru dulu, lalu nama petugas A-Z
      const sorted = Array.from(groups.values()).sort((a, b) => {
        if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal)
        return a.namaPetugas.localeCompare(b.namaPetugas)
      })

      // Pagination manual (karena grouping dilakukan di aplikasi)
      const total = sorted.length
      const totalPages = Math.max(1, Math.ceil(total / input.limit))
      const start = (input.page - 1) * input.limit
      const items = sorted.slice(start, start + input.limit)

      return { items, total, totalPages, page: input.page }
    }),
})
