// src/server/trpc/routers/drd/drd-pemakaian.router.ts
//
// Sheet "PEMAKAIAN PER GOL TARIP WP": SL, m³, DRD/hari, DRD/bulan
// per golongan tarif untuk satu periode.
//
// Strategi JOIN (2 round-trip):
//   1. Query LaporanHarianPetugas → ambil nomorLangganan + pemakaian
//   2. Query Pelanggan (nomorLangganan IN [...]) → dapatkan tarifGolongan.kode
//   3. Query Tagihan (pelangganId IN [...], periode) → DRD/hari & DRD/bulan
//   4. Merge di memori → group by golongan tarif
//
// PERBAIKAN: kode golongan (Pelanggan.tarifGolongan.kode) bertipe enum
// GolonganTarif (bukan String) sesuai tarif.prisma, jadi GOL_ORDER &
// GOL_LABEL sekarang memakai tipe enum tersebut alih-alih string biasa.

import { z } from 'zod'
import { GolonganTarif } from '@/generated/prisma/client'
import { router, protectedProcedure } from '../init'

// Jumlah hari dalam bulan untuk periode yyyymm
function getJumlahHari(periode: number): number {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month, 0).getDate()
}

// Konversi periode Int (yyyymm) ke DateTime awal bulan untuk query Tagihan
function periodeToDate(periode: number): Date {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month - 1, 1)
}

// Konversi periode Int ke akhir bulan (untuk range query Tagihan)
function periodeToDateEnd(periode: number): Date {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month, 0, 23, 59, 59)
}

// Label display per golongan sesuai Excel
const GOL_LABEL: Record<GolonganTarif, { jenis: string; kode: string }> = {
  GOL_1A: { jenis: 'Sosial Umum', kode: '1A' },
  GOL_1B: { jenis: 'Sosial Khusus', kode: '1B' },
  GOL_2A1: { jenis: 'Rumah Tangga', kode: '2A1' },
  GOL_2A2: { jenis: 'Rumah Tangga', kode: '2A2' },
  GOL_2A3: { jenis: 'Rumah Tangga', kode: '2A3' },
  GOL_2A4: { jenis: 'Rumah Tangga', kode: '2A4' },
  GOL_2A5: { jenis: 'Rumah Tangga', kode: '2A5' },
  GOL_2B: { jenis: 'Instansi Pemerintah', kode: '2B' },
  GOL_3A: { jenis: 'Niaga Kecil', kode: '3A' },
  GOL_3B: { jenis: 'Niaga Besar', kode: '3B' },
  GOL_3C: { jenis: 'Niaga', kode: '3C' },
  GOL_4A: { jenis: 'Industri Kecil', kode: '4A' },
  GOL_4B: { jenis: 'Industri Besar', kode: '4B' },
}

// Urutan tampilan sesuai Excel
const GOL_ORDER: GolonganTarif[] = [
  GolonganTarif.GOL_1A,
  GolonganTarif.GOL_1B,
  GolonganTarif.GOL_2A1,
  GolonganTarif.GOL_2A2,
  GolonganTarif.GOL_2A3,
  GolonganTarif.GOL_2A4,
  GolonganTarif.GOL_2A5,
  GolonganTarif.GOL_2B,
  GolonganTarif.GOL_3A,
  GolonganTarif.GOL_3B,
  GolonganTarif.GOL_3C,
  GolonganTarif.GOL_4A,
  GolonganTarif.GOL_4B,
]

export const drdPemakaianRouter = router({
  /**
   * Breakdown pemakaian per golongan tarif untuk satu periode.
   * Mengembalikan SL, m³, m³/SL, DRD/hari, DRD/bulan per golongan.
   */
  perGolongan: protectedProcedure
    .input(
      z.object({
        periode: z.number().int(), // yyyymm
      }),
    )
    .query(async ({ ctx, input }) => {
      const { periode } = input
      const jumlahHari = getJumlahHari(periode)
      const periodeDate = periodeToDate(periode)
      const periodeDateEnd = periodeToDateEnd(periode)

      // ── 1. Ambil semua pencatatan periode ini ──────────────────────────────
      const pencatatan = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { periode },
        select: { nomorLangganan: true, pemakaian: true },
      })

      if (pencatatan.length === 0) {
        return { periode, jumlahHari, items: [], total: null }
      }

      const nolgs = [...new Set(pencatatan.map((r) => r.nomorLangganan))]

      // ── 2. Lookup golongan tarif per nolg via Pelanggan ───────────────────
      const pelangganList = await ctx.prisma.pelanggan.findMany({
        where: { nomorLangganan: { in: nolgs } },
        select: {
          nomorLangganan: true,
          id: true,
          tarifGolongan: { select: { kode: true } },
        },
      })

      const nolgToGol = new Map<string, GolonganTarif>()
      const nolgToPelangganId = new Map<string, string>()
      for (const p of pelangganList) {
        const kode = p.tarifGolongan?.kode ?? null
        if (kode) nolgToGol.set(p.nomorLangganan, kode)
        nolgToPelangganId.set(p.nomorLangganan, p.id)
      }

      // ── 3. Ambil tagihan periode ini untuk DRD ────────────────────────────
      const pelangganIds = [...new Set(pelangganList.map((p) => p.id))]

      const tagihan = await ctx.prisma.tagihan.findMany({
        where: {
          pelangganId: { in: pelangganIds },
          periode: { gte: periodeDate, lte: periodeDateEnd },
        },
        select: {
          pelangganId: true,
          totalTagihan: true,
        },
      })

      // DRD bulan per pelanggan (ambil satu tagihan per pelanggan per periode)
      const drdByPelanggan = new Map<string, number>()
      for (const t of tagihan) {
        // Kalau ada duplikat (seharusnya tidak), ambil yang terakhir
        drdByPelanggan.set(t.pelangganId, t.totalTagihan)
      }

      // ── 4. Group pencatatan by golongan tarif ─────────────────────────────
      type GolData = {
        sl: Set<string>
        totalM3: number
        totalDrd: number
      }
      const golMap = new Map<GolonganTarif | 'UNKNOWN', GolData>()

      for (const row of pencatatan) {
        const gol = nolgToGol.get(row.nomorLangganan) ?? 'UNKNOWN'
        const pelId = nolgToPelangganId.get(row.nomorLangganan)
        const drd = pelId ? (drdByPelanggan.get(pelId) ?? 0) : 0

        let entry = golMap.get(gol)
        if (!entry) {
          entry = { sl: new Set(), totalM3: 0, totalDrd: 0 }
          golMap.set(gol, entry)
        }
        // SL dihitung unik per nolg
        if (!entry.sl.has(row.nomorLangganan)) {
          entry.sl.add(row.nomorLangganan)
          entry.totalDrd += drd // DRD per pelanggan, bukan per baris
        }
        entry.totalM3 += row.pemakaian
      }

      // ── 5. Susun output sesuai urutan Excel ───────────────────────────────
      const items = GOL_ORDER.map((golKey) => {
        const label = GOL_LABEL[golKey]
        const data = golMap.get(golKey)
        const sl = data?.sl.size ?? 0
        const totalM3 = data?.totalM3 ?? 0
        const totalDrd = data?.totalDrd ?? 0
        const m3PerSl = sl > 0 ? totalM3 / sl : 0
        const drdPerHari = jumlahHari > 0 ? totalDrd / jumlahHari : 0
        const drdPerBulan = totalDrd

        return {
          golKey,
          jenis: label?.jenis ?? golKey,
          kode: label?.kode ?? golKey,
          sl,
          totalM3,
          m3PerSl: Math.round(m3PerSl * 1000) / 1000,
          drdPerHari: Math.round(drdPerHari),
          drdPerBulan,
        }
      })

      // ── 6. Baris total ────────────────────────────────────────────────────
      const totalSl = items.reduce((s, i) => s + i.sl, 0)
      const totalM3 = items.reduce((s, i) => s + i.totalM3, 0)
      const totalDrdBulan = items.reduce((s, i) => s + i.drdPerBulan, 0)

      return {
        periode,
        jumlahHari,
        items,
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
    }),
})
