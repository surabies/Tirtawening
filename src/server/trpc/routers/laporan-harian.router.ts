// src/server/trpc/routers/laporan-harian.router.ts
//
// Router untuk halaman "Laporan Periode Cater Per Tanggal" — format matrix
// (baris = petugas, kolom = tanggal 1-31, sesuai laporan Excel existing).

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** periode berjalan dalam format yyyymm. */
function getPeriodeBerjalan(): number {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

/** Jumlah hari dalam bulan untuk periode yyyymm. */
function getJumlahHari(periode: number): number {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month, 0).getDate()
}

// ── Router ────────────────────────────────────────────────────────────────────

export const laporanHarianRouter = router({
  /**
   * Matrix progres pencatatan: baris = petugas, kolom = tanggal 1-31.
   * Nilai sel = jumlah SL yang dicatat petugas tsb pada tanggal itu,
   * dibatasi ke periode (bulan) yang dipilih.
   *
   * Target per petugas = jumlah SL unik yang PERNAH dicatat petugas itu
   * sepanjang histori data (lintas semua periode) — bukan cuma bulan ini.
   */
  matrix: protectedProcedure
    .input(
      z.object({
        periode: z.number().int().optional(), // yyyymm, default bulan berjalan
      }),
    )
    .query(async ({ ctx, input }) => {
      const periode = input.periode ?? getPeriodeBerjalan()
      const jumlahHari = getJumlahHari(periode)

      // ── 0. Debug: hitung total baris periode ini di DB, terlepas filter ──────
      const totalDiDbUntukPeriode = await ctx.prisma.laporanHarianPetugas.count(
        { where: { periode } },
      )
      const totalTanggalCatatNull = await ctx.prisma.laporanHarianPetugas.count(
        { where: { periode, tanggalCatat: null } },
      )

      // ── 1. Ambil semua baris pencatatan untuk periode terpilih ──────────────
      const rowsPeriodeIni = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { periode, tanggalCatat: { not: null } },
        select: {
          pencatatId: true,
          tanggalCatat: true,
          nomorLangganan: true,
          pencatat: {
            select: { id: true, namaLapangan: true, namaLengkap: true },
          },
        },
      })

      let dikecualikanTanggalDiLuarRentang = 0

      // ── 2. Ambil daftar SL unik per petugas SEPANJANG HISTORI (untuk target) ─
      // distinct nomorLangganan per pencatatId, lintas semua periode.
      const semuaPencatatan = await ctx.prisma.laporanHarianPetugas.findMany({
        where: { pencatatId: { not: null } },
        select: { pencatatId: true, nomorLangganan: true },
        distinct: ['pencatatId', 'nomorLangganan'],
      })

      const targetByPencatat = new Map<string, number>()
      for (const row of semuaPencatatan) {
        if (!row.pencatatId) continue
        targetByPencatat.set(
          row.pencatatId,
          (targetByPencatat.get(row.pencatatId) ?? 0) + 1,
        )
      }

      // ── 3. Susun matrix: pencatatId → { namaPetugas, harian: number[31] } ────
      type PetugasRow = {
        pencatatId: string
        namaPetugas: string
        harian: number[] // index 0 = tanggal 1, dst.
        totalCatat: number
        target: number
        selisih: number
      }

      const matrixMap = new Map<string, PetugasRow>()

      for (const row of rowsPeriodeIni) {
        // Baris tanpa pencatat diketahui dikelompokkan terpisah sebagai
        // "Tidak Diketahui" agar tidak hilang dari laporan.
        const pencatatId = row.pencatatId ?? 'unknown'
        const namaPetugas =
          row.pencatat?.namaLengkap ??
          row.pencatat?.namaLapangan ??
          'Tidak Diketahui'

        const tanggal = row.tanggalCatat!.getDate() // 1-31
        if (tanggal < 1 || tanggal > jumlahHari) {
          dikecualikanTanggalDiLuarRentang++
          continue
        }

        let entry = matrixMap.get(pencatatId)
        if (!entry) {
          entry = {
            pencatatId,
            namaPetugas,
            harian: Array(jumlahHari).fill(0),
            totalCatat: 0,
            target: targetByPencatat.get(pencatatId) ?? 0,
            selisih: 0,
          }
          matrixMap.set(pencatatId, entry)
        }

        entry.harian[tanggal - 1] += 1
        entry.totalCatat += 1
      }

      // Selisih = target - totalCatat (mengikuti contoh Excel: target lebih
      // besar dari total catat → selisih positif/kekurangan).
      for (const entry of matrixMap.values()) {
        entry.selisih = entry.target - entry.totalCatat
      }

      // Urutkan nama petugas A-Z, "Tidak Diketahui" selalu di akhir.
      const items = Array.from(matrixMap.values()).sort((a, b) => {
        if (a.pencatatId === 'unknown') return 1
        if (b.pencatatId === 'unknown') return -1
        return a.namaPetugas.localeCompare(b.namaPetugas)
      })

      // ── 4. Baris Total (sum per kolom + sum total/target/selisih) ───────────
      const totalHarian = Array(jumlahHari).fill(0)
      let totalCatatSum = 0
      let targetSum = 0

      for (const item of items) {
        item.harian.forEach((v, i) => {
          totalHarian[i] += v
        })
        totalCatatSum += item.totalCatat
        targetSum += item.target
      }

      // ── 5. Info hari kerja (Senin-Sabtu = kerja, Minggu = libur) ─────────────
      const year = Math.floor(periode / 100)
      const month = periode % 100
      const hariInfo = Array.from({ length: jumlahHari }, (_, i) => {
        const date = new Date(year, month - 1, i + 1)
        const isMinggu = date.getDay() === 0
        return { tanggal: i + 1, isHariKerja: !isMinggu }
      })

      return {
        periode,
        jumlahHari,
        hariInfo,
        items,
        total: {
          harian: totalHarian,
          totalCatat: totalCatatSum,
          target: targetSum,
          selisih: targetSum - totalCatatSum,
        },
        debug: {
          totalDiDbUntukPeriode,
          totalTanggalCatatNull,
          dikecualikanTanggalDiLuarRentang,
          totalTerhitungDiMatrix: totalCatatSum,
          // totalDiDbUntukPeriode harus = totalTanggalCatatNull +
          // dikecualikanTanggalDiLuarRentang + totalTerhitungDiMatrix
        },
      }
    }),
})
