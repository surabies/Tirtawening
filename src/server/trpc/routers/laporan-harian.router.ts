// src/server/trpc/routers/laporan-harian.router.ts
//
// Router untuk halaman "Laporan Periode Cater Per Tanggal" — format matrix
// (baris = petugas, kolom = tanggal 1-31, sesuai laporan Excel existing).

import { z } from 'zod'
import { router, protectedProcedure } from '../init'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Mendapatkan periode berjalan dalam format YYYYMM (Int).
 * @returns number contoh: 202606
 */
function getPeriodeBerjalan(): number {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

/**
 * Menghitung jumlah hari dalam satu bulan berdasarkan periode YYYYMM.
 * @param periode number (YYYYMM)
 */
function getJumlahHari(periode: number): number {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  // Tanggal 0 dari bulan berikutnya akan mengembalikan hari terakhir bulan ini
  return new Date(year, month, 0).getDate()
}

/**
 * ROBUST: Menghitung 1 bulan sebelum periode yang dipilih (format YYYYMM).
 * Menangani secara aman pergantian tahun (Januari ke Desember tahun lalu).
 * @param periode number (YYYYMM)
 */
function getPeriodeSebelumnya(periode: number): number {
  const year = Math.floor(periode / 100)
  const month = periode % 100

  // Jika bulan Januari (01), maka bulan sebelumnya adalah Desember (12) tahun lalu
  if (month === 1) {
    return (year - 1) * 100 + 12
  }
  return year * 100 + (month - 1)
}

/**
 * Ambil daftar libur nasional untuk bulan tertentu dari API publik
 * (api-harilibur.vercel.app, bersumber dari kalenderbali.com/tanggalan.com).
 *
 * PENTING soal keandalan:
 * - API eksternal bisa down/lambat/berubah sewaktu-waktu. Fungsi ini TIDAK
 *   PERNAH melempar error - kalau fetch gagal/timeout/format tak terduga,
 *   kembalikan Map kosong supaya laporan tetap bisa dibuka (cuma tanpa
 *   highlight libur nasional, bukan halaman error).
 * - Di-cache in-memory per (tahun, bulan) selama proses server berjalan,
 *   supaya tidak fetch ulang ke API eksternal setiap kali laporan dibuka.
 *   Cache ini hilang saat server restart - itu cukup karena data libur
 *   nasional jarang berubah dalam waktu singkat.
 *
 * @returns Map dengan key "YYYY-MM-DD" -> nama libur
 */
const liburNasionalCache = new Map<string, Map<string, string>>()

async function fetchLiburNasional(
  year: number,
  month: number,
): Promise<Map<string, string>> {
  const cacheKey = `${year}-${month}`
  const cached = liburNasionalCache.get(cacheKey)
  if (cached) return cached

  const result = new Map<string, string>()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3 detik, jangan sampai nge-block render laporan

    const res = await fetch(
      `https://api-harilibur.vercel.app/api?month=${month}&year=${year}`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    if (!res.ok) {
      // API balas non-200 (mis. rate limit) -> jangan anggap fatal, cache
      // kosong supaya tidak fetch berulang-ulang di request berikutnya.
      liburNasionalCache.set(cacheKey, result)
      return result
    }

    const data: unknown = await res.json()

    // Validasi bentuk respons sebelum dipakai - API publik bisa berubah
    // formatnya kapan saja tanpa pemberitahuan.
    if (Array.isArray(data)) {
      for (const item of data) {
        if (
          item &&
          typeof item === 'object' &&
          'holiday_date' in item &&
          typeof (item as Record<string, unknown>).holiday_date === 'string'
        ) {
          const holidayDate = (item as Record<string, unknown>)
            .holiday_date as string
          const holidayName =
            typeof (item as Record<string, unknown>).holiday_name === 'string'
              ? ((item as Record<string, unknown>).holiday_name as string)
              : 'Libur Nasional'
          result.set(holidayDate, holidayName)
        }
      }
    }
  } catch {
    // Network error, timeout (AbortError), JSON parse error, dll - semua
    // ditelan di sini. Laporan tetap jalan tanpa data libur nasional.
  }

  liburNasionalCache.set(cacheKey, result)
  return result
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PetugasRow = {
  pencatatId: string
  namaPetugas: string
  harian: number[] // index 0 = tanggal 1, dst.
  totalCatat: number
  target: number // Diambil dari total pencatatan unik periode sebelumnya
  selisih: number // Kekurangan target (target - totalCatat)
}

// ── Router ────────────────────────────────────────────────────────────────────

export const laporanHarianRouter = router({
  /**
   * Matrix progres pencatatan: baris = petugas, kolom = tanggal 1-31.
   * Nilai sel = jumlah SL yang dicatat petugas tsb pada tanggal itu,
   * dibatasi ke periode (bulan) yang dipilih.
   *
   * ROBUST FIX: Target per petugas dihitung secara akurat berdasarkan
   * jumlah SL unik yang berhasil dicatat pada 1 periode (bulan) SEBELUMNYA.
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
      const periodeLalu = getPeriodeSebelumnya(periode) // <-- Mengunci periode bulan lalu

      // ── 0. Debug & Audit Log Database ───────────────────────────────────────
      const totalDiDbUntukPeriode = await ctx.prisma.laporanHarianPetugas.count(
        {
          where: { periode },
        },
      )
      const totalTanggalCatatNull = await ctx.prisma.laporanHarianPetugas.count(
        {
          where: { periode, tanggalCatat: null },
        },
      )

      // ── 1. Ambil Data Realisasi Pencatatan Periode Terpilih ──────────────────
      const rowsPeriodeIni = await ctx.prisma.laporanHarianPetugas.findMany({
        where: {
          periode,
          tanggalCatat: { not: null },
        },
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

      // ── 2. Hitung Target Berdasarkan Data Historis Bulan Lalu ────────────────
      // Menggunakan query ber-DISTINCT agar 1 pelanggan yang dicatat berulang kali
      // oleh petugas yang sama di bulan lalu hanya dihitung sebagai 1 Target SL.
      const pencatatanBulanLalu =
        await ctx.prisma.laporanHarianPetugas.findMany({
          where: {
            pencatatId: { not: null },
            periode: periodeLalu, // <-- Membatasi data hanya berbasis performa bulan lalu
          },
          select: { pencatatId: true, nomorLangganan: true },
          distinct: ['pencatatId', 'nomorLangganan'],
        })

      // Mapping data pencatatan bulan lalu ke Map agar pencarian target O(1) sewaktu looping matrix
      const targetByPencatat = new Map<string, number>()
      for (const row of pencatatanBulanLalu) {
        if (!row.pencatatId) continue
        targetByPencatat.set(
          row.pencatatId,
          (targetByPencatat.get(row.pencatatId) ?? 0) + 1,
        )
      }

      // ── 3. Penyusunan Struktur Matrix Data ──────────────────────────────────
      const matrixMap = new Map<string, PetugasRow>()

      for (const row of rowsPeriodeIni) {
        // Data tanpa ID pencatat dikelompokkan ke 'unknown' agar tidak hilang dari rekap
        const pencatatId = row.pencatatId ?? 'unknown'
        const namaPetugas =
          row.pencatat?.namaLengkap ??
          row.pencatat?.namaLapangan ??
          'Tidak Diketahui'

        const tanggal = row.tanggalCatat!.getDate() // Mengambil angka tanggal (1-31)

        // Proteksi: Jika ada bad data yang tanggalnya tidak valid dengan kalender bulan berjalan
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
            target: targetByPencatat.get(pencatatId) ?? 0, // Ambil target real bulan lalu
            selisih: 0,
          }
          matrixMap.set(pencatatId, entry)
        }

        entry.harian[tanggal - 1] += 1
        entry.totalCatat += 1
      }

      // Hitung kekurangan/selisih target mengikuti standar visual laporan excel eksisting
      for (const entry of matrixMap.values()) {
        entry.selisih = entry.target - entry.totalCatat
      }

      // Sorting Alphabetical nama petugas, namun 'unknown' dipaksa baris paling bawah
      const items = Array.from(matrixMap.values()).sort((a, b) => {
        if (a.pencatatId === 'unknown') return 1
        if (b.pencatatId === 'unknown') return -1
        return a.namaPetugas.localeCompare(b.namaPetugas)
      })

      // ── 4. Kalkulasi Baris Total Gendong (Footer Row) ───────────────────────
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

      // ── 5. Pemetaan Informasi Hari Kerja (Siklus Kalender) ──────────────────
      const year = Math.floor(periode / 100)
      const month = periode % 100

      // Ambil daftar libur nasional untuk bulan ini (lihat fetchLiburNasional
      // di bawah). Kalau API gagal/timeout, kembalikan Map kosong supaya
      // laporan tetap bisa dibuka tanpa override libur nasional - bukan error.
      const liburNasionalMap = await fetchLiburNasional(year, month)

      const hariInfo = Array.from({ length: jumlahHari }, (_, i) => {
        const tanggal = i + 1
        const date = new Date(year, month - 1, tanggal)
        const dayOfWeek = date.getDay() // 0 = Minggu, 6 = Sabtu

        // FIX: sebelumnya cuma mengecek `dayOfWeek === 0` (Minggu), sehingga
        // Sabtu (dayOfWeek === 6) lolos dan salah dianggap hari kerja. Sabtu
        // dan Minggu keduanya akhir pekan/libur.
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(tanggal).padStart(2, '0')}`
        const liburNasional = liburNasionalMap.get(dateKey)

        return {
          tanggal,
          isHariKerja: !isWeekend && !liburNasional,
          isWeekend,
          liburNasional: liburNasional ?? null, // nama libur, kalau ada (mis. "Hari Raya Nyepi")
        }
      })

      return {
        periode,
        periodeTargetAcuan: periodeLalu, // Memberi tahu frontend bulan apa yang jadi acuan target
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
        },
      }
    }),
})
