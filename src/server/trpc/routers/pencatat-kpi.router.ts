// src/server/trpc/routers/pencatat/pencatat-kpi.router.ts
//
// Data untuk KPI card per pencatat meter:
// progres target, akurasi, dan breakdown kondisi anomali per periode.

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Kelompok kondisi untuk card KPI (sesuai desain HTML) */
const KONDISI_KRITIS = [
  'METER_RUSAK',
  'METER_MATI_ADA_AIR',
  'LOS_METER',
  'DICABUT',
  'BMK_BMB',
] as const

const KONDISI_PERINGATAN = [
  'METER_TERBALIK',
  'METER_MUNDUR',
  'METER_DALAM_AIR',
  'TIDAK_ADA_AIR',
  'STAND_TEMPEL',
  'STAND_KONSUMEN',
  'REV_PENCATAT',
  'MUDA_KEMBALI',
  'TTB',
  'MTA',
  'DK',
  'MB',
] as const

const KONDISI_LAPANGAN = [
  'RUMAH_KOSONG',
  'TIDAK_DIPAKAI',
  'TERHALANG',
  'ADA_ANJING',
] as const

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const pencatatKpiRouter = router({
  /**
   * KPI satu pencatat untuk periode tertentu.
   * Dipakai oleh KPI card individual (modal / halaman detail).
   */
  byPencatat: protectedProcedure
    .input(
      z.object({
        pencatatId: z.string(),
        periode: z.number().int(),
        /** Target SL bulanan pencatat (default 2500, bisa dari config). */
        targetSl: z.number().int().default(2500),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { pencatatId, periode, targetSl } = input

      const [pencatat, laporan] = await Promise.all([
        ctx.prisma.pencatat.findUniqueOrThrow({
          where: { id: pencatatId },
          select: {
            id: true,
            namaLapangan: true,
            namaLengkap: true,
            nip: true,
            isAktif: true,
            user: { select: { image: true, email: true } },
          },
        }),
        ctx.prisma.laporanHarianPetugas.findMany({
          where: { pencatatId, periode },
          select: { kondisi: true, pemakaian: true },
        }),
      ])

      return buildKpiPayload({ pencatat, laporan, targetSl, periode })
    }),

  /**
   * KPI semua pencatat aktif untuk periode tertentu.
   * Dipakai oleh tabel ringkasan / leaderboard.
   */
  list: protectedProcedure
    .input(
      z.object({
        periode: z.number().int(),
        targetSl: z.number().int().default(2500),
        /** Filter hanya pencatat aktif (default true) */
        hanyaAktif: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { periode, targetSl, hanyaAktif } = input

      const pencatatList = await ctx.prisma.pencatat.findMany({
        where: hanyaAktif ? { isAktif: true } : undefined,
        select: {
          id: true,
          namaLapangan: true,
          namaLengkap: true,
          nip: true,
          isAktif: true,
          user: { select: { image: true, email: true } },
          laporanHarian: {
            where: { periode },
            select: { kondisi: true, pemakaian: true },
          },
        },
        orderBy: { namaLapangan: 'asc' },
      })

      return pencatatList.map(({ laporanHarian, ...pencatat }) =>
        buildKpiPayload({ pencatat, laporan: laporanHarian, targetSl, periode }),
      )
    }),
})

// ---------------------------------------------------------------------------
// Builder — pisah dari query agar bisa dipakai di keduanya
// ---------------------------------------------------------------------------

type PencatatInfo = {
  id: string
  namaLapangan: string
  namaLengkap: string | null
  nip: string | null
  isAktif: boolean
  user: { image: string | null; email: string } | null
}

type LaporanRow = { kondisi: string; pemakaian: number }

function buildKpiPayload({
  pencatat,
  laporan,
  targetSl,
  periode,
}: {
  pencatat: PencatatInfo
  laporan: LaporanRow[]
  targetSl: number
  periode: number
}) {
  const totalSl = laporan.length
  const normalSl = laporan.filter((r) => r.kondisi === 'NORMAL').length
  const anomaliSl = totalSl - normalSl
  const totalM3 = laporan.reduce((s, r) => s + r.pemakaian, 0)

  const akurasi =
    totalSl > 0 ? Math.round((normalSl / totalSl) * 1000) / 10 : 0
  const progres =
    targetSl > 0 ? Math.round((totalSl / targetSl) * 1000) / 10 : 0

  // Hitung breakdown per kondisi
  const kondisiCount = new Map<string, number>()
  for (const r of laporan) {
    kondisiCount.set(r.kondisi, (kondisiCount.get(r.kondisi) ?? 0) + 1)
  }

  const pickKondisi = (keys: readonly string[]) =>
    keys
      .map((k) => ({ kondisi: k, jumlah: kondisiCount.get(k) ?? 0 }))
      .filter((x) => x.jumlah > 0)

  return {
    pencatat,
    periode,
    targetSl,
    totalSl,
    normalSl,
    anomaliSl,
    totalM3,
    akurasi,   // persen, 1 desimal
    progres,   // persen vs target, 1 desimal
    breakdown: {
      kritis: pickKondisi(KONDISI_KRITIS),
      peringatan: pickKondisi(KONDISI_PERINGATAN),
      lapangan: pickKondisi(KONDISI_LAPANGAN),
    },
  }
}