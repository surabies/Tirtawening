// src/server/trpc/routers/drd/drd-domestik.router.ts
//
// Sheet "DOMESTIK": SL, m³, m³/SL, DRD/hari, DRD/bulan untuk golongan
// domestik (1A, 2A1–2A5, 3A, 3B, 3C) per bulan dalam satu tahun.
//
// Strategi sama seperti drd-pemakaian.router.ts (join manual di memori),
// tapi di-filter hanya golongan domestik dan disusun per bulan (seperti
// drd-target.router.ts) alih-alih per golongan pada satu periode saja.
//
// Alur:
//   1. Ambil LaporanHarianPetugas untuk seluruh periode dalam tahun.
//   2. Lookup golongan tarif per nolg via Pelanggan, filter hanya 2A1–2A5.
//   3. Ambil Tagihan untuk pelanggan domestik pada rentang tahun → DRD.
//   4. Group per periode (bulan) × golongan.

import { z } from 'zod'
import { GolonganTarif } from '@/generated/prisma/client'
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

// Golongan yang termasuk kategori DOMESTIK sesuai sheet Excel
const GOL_DOMESTIK_ORDER: GolonganTarif[] = [
  GolonganTarif.GOL_1A,
  GolonganTarif.GOL_2A1,
  GolonganTarif.GOL_2A2,
  GolonganTarif.GOL_2A3,
  GolonganTarif.GOL_2A4,
  GolonganTarif.GOL_2A5,
  GolonganTarif.GOL_3A,
  GolonganTarif.GOL_3B,
  GolonganTarif.GOL_3C,
]

const GOL_LABEL: Record<GolonganTarif, string> = {
  GOL_1A: '1A',
  GOL_1B: '1B',
  GOL_2A1: '2A1',
  GOL_2A2: '2A2',
  GOL_2A3: '2A3',
  GOL_2A4: '2A4',
  GOL_2A5: '2A5',
  GOL_2B: '2B',
  GOL_3A: '3A',
  GOL_3B: '3B',
  GOL_3C: '3C',
  GOL_4A: '4A',
  GOL_4B: '4B',
}

function getJumlahHari(periode: number): number {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month, 0).getDate()
}

function periodeToDate(periode: number): Date {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month - 1, 1)
}

function periodeToDateEnd(periode: number): Date {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month, 0, 23, 59, 59)
}

export const drdDomestikRouter = router({
  /**
   * Breakdown bulanan (12 bulan) golongan domestik (2A1–2A5): SL, m³,
   * m³/SL, DRD/hari, DRD/bulan — sesuai sheet "DOMESTIK".
   */
  perBulan: protectedProcedure
    .input(
      z.object({
        tahun: z.number().int().min(2020).default(new Date().getFullYear()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tahun } = input
      const periodeMin = tahun * 100 + 1
      const periodeMax = tahun * 100 + 12

      // ── 1. Ambil semua pencatatan tahun ini ────────────────────────────────
      const pencatatan = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { periode: { gte: periodeMin, lte: periodeMax } },
        select: { periode: true, nomorLangganan: true, pemakaian: true },
      })

      if (pencatatan.length === 0) {
        return { tahun, items: [], summary: null }
      }

      const nolgs = [...new Set(pencatatan.map((r) => r.nomorLangganan))]

      // ── 2. Lookup golongan tarif per nolg, filter hanya domestik ──────────
      const pelangganList = await ctx.prisma.pelanggan.findMany({
        where: {
          nomorLangganan: { in: nolgs },
          tarifGolongan: { kode: { in: GOL_DOMESTIK_ORDER } },
        },
        select: {
          nomorLangganan: true,
          id: true,
          tarifGolongan: { select: { kode: true } },
        },
      })

      const nolgToGol = new Map<string, string>()
      const nolgToPelangganId = new Map<string, string>()
      for (const p of pelangganList) {
        const kode = p.tarifGolongan?.kode ?? null
        if (kode) nolgToGol.set(p.nomorLangganan, kode)
        nolgToPelangganId.set(p.nomorLangganan, p.id)
      }

      if (pelangganList.length === 0) {
        return { tahun, items: [], summary: null }
      }

      // ── 3. Ambil tagihan setahun untuk pelanggan domestik → DRD ────────────
      const pelangganIds = [...new Set(pelangganList.map((p) => p.id))]
      const tahunAwal = periodeToDate(periodeMin)
      const tahunAkhir = periodeToDateEnd(periodeMax)

      const tagihan = await ctx.prisma.tagihan.findMany({
        where: {
          pelangganId: { in: pelangganIds },
          periode: { gte: tahunAwal, lte: tahunAkhir },
        },
        select: { pelangganId: true, periode: true, totalTagihan: true },
      })

      // Map DRD per (periode yyyymm)-(pelangganId), ambil satu tagihan terakhir
      const drdMap = new Map<string, number>()
      for (const t of tagihan) {
        const y = t.periode.getFullYear()
        const m = t.periode.getMonth() + 1
        const periode = y * 100 + m
        drdMap.set(`${periode}-${t.pelangganId}`, t.totalTagihan)
      }

      // ── 4. Group per periode (bulan) × golongan ────────────────────────────
      type GolData = { sl: Set<string>; totalM3: number; totalDrd: number }
      const bulanMap = new Map<number, Map<string, GolData>>()

      for (const row of pencatatan) {
        const gol = nolgToGol.get(row.nomorLangganan)
        if (!gol) continue // bukan pelanggan domestik, skip

        const bulan = row.periode % 100
        let golMap = bulanMap.get(bulan)
        if (!golMap) {
          golMap = new Map()
          bulanMap.set(bulan, golMap)
        }

        let entry = golMap.get(gol)
        if (!entry) {
          entry = { sl: new Set(), totalM3: 0, totalDrd: 0 }
          golMap.set(gol, entry)
        }

        const pelId = nolgToPelangganId.get(row.nomorLangganan)
        if (!entry.sl.has(row.nomorLangganan)) {
          entry.sl.add(row.nomorLangganan)
          const drd = pelId ? (drdMap.get(`${row.periode}-${pelId}`) ?? 0) : 0
          entry.totalDrd += drd
        }
        entry.totalM3 += row.pemakaian
      }

      // ── 5. Susun 12 bulan, tiap bulan berisi breakdown per golongan ───────
      const items = Array.from({ length: 12 }, (_, i) => {
        const bulan = i + 1
        const periode = tahun * 100 + bulan
        const jumlahHari = getJumlahHari(periode)
        const golMap = bulanMap.get(bulan)

        const golongan = GOL_DOMESTIK_ORDER.map((golKey) => {
          const data = golMap?.get(golKey)
          const sl = data?.sl.size ?? 0
          const totalM3 = data?.totalM3 ?? 0
          const totalDrd = data?.totalDrd ?? 0
          const m3PerSl = sl > 0 ? totalM3 / sl : 0
          const drdPerHari = jumlahHari > 0 ? totalDrd / jumlahHari : 0

          return {
            golKey,
            kode: GOL_LABEL[golKey],
            sl,
            totalM3,
            m3PerSl: Math.round(m3PerSl * 1000) / 1000,
            drdPerHari: Math.round(drdPerHari),
            drdPerBulan: totalDrd,
          }
        })

        const totalSl = golongan.reduce((s, g) => s + g.sl, 0)
        const totalM3 = golongan.reduce((s, g) => s + g.totalM3, 0)
        const totalDrdBulan = golongan.reduce((s, g) => s + g.drdPerBulan, 0)

        return {
          bulan,
          namaBulan: NAMA_BULAN[bulan],
          periode,
          sudahAda: bulanMap.has(bulan),
          jumlahHari,
          golongan,
          total: {
            sl: totalSl,
            totalM3,
            m3PerSl:
              totalSl > 0 ? Math.round((totalM3 / totalSl) * 1000) / 1000 : 0,
            drdPerHari:
              jumlahHari > 0 ? Math.round(totalDrdBulan / jumlahHari) : 0,
            drdPerBulan: totalDrdBulan,
          },
        }
      })

      // ── 6. Summary tahunan ───────────────────────────────────────────────
      const totalM3Tahun = items.reduce((s, i) => s + i.total.totalM3, 0)
      const totalDrdTahun = items.reduce((s, i) => s + i.total.drdPerBulan, 0)
      const bulanTerakhirAda = [...items].reverse().find((i) => i.sudahAda)

      return {
        tahun,
        items,
        summary: {
          totalM3Tahun,
          totalDrdTahun,
          slTerakhir: bulanTerakhirAda?.total.sl ?? 0,
        },
      }
    }),
})
