// seed/utils.ts
// Helper bersama untuk semua seed script

import fs from 'fs'
import path from 'path'
import {
  GolonganTarif,
  KategoriPembacaan,
  KondisiCatat,
  StatusPelanggan,
  UkuranMeter,
} from '@/generated/prisma/client'

// ─── CSV PARSER ──────────────────────────────────────────────────────────────

/**
 * Parse satu baris CSV dengan separator `;`, quote-aware (RFC 4180).
 *
 * PENTING: tidak bisa pakai `line.split(';')` polos karena beberapa field
 * (terutama Nama dan Alamat) mengandung karakter `;` DI DALAM tanda kutip,
 * contoh nyata dari data lapdatameter:
 *   "MULYANA SOEMANTRI; SE"
 *   "STATSION SLT NO.24; 4/2 NO.24"
 *   "JL;KECUBUNG NO.18 B"
 * Naive split akan memecah field ini jadi 2 kolom, sehingga SEMUA kolom
 * setelahnya (termasuk Periode) bergeser satu posisi ke kiri. Ini terbukti
 * menyebabkan ~440 baris di file lapdatameter salah masuk periode (mis.
 * value Periode malah berisi teks alamat, atau angka pendek hasil parseInt
 * dari teks yang diawali angka seperti "4/2 NO.24" → 4).
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped quote ("" di dalam field ber-quote) → satu tanda kutip literal
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

/**
 * Baca file CSV dengan separator `;` dan kembalikan array of objects.
 * Otomatis strip whitespace dan tab dari setiap value.
 *
 * Quote-aware: field ber-quote yang mengandung `;` di dalamnya TIDAK akan
 * memecah kolom (lihat parseCsvLine di atas).
 *
 * Validasi: setiap baris yang jumlah kolomnya tidak cocok dengan header
 * akan di-warn ke console (bukan langsung throw, supaya seed tetap bisa
 * jalan) sehingga anomali ketahuan saat seeding, bukan setelah hitung
 * jumlah data meleset.
 */
export function readCsv(filePath: string): Record<string, string>[] {
  const abs = path.resolve(filePath)
  const raw = fs.readFileSync(abs, 'utf-8')
  const lines = raw
    .trim()
    .split('\n')
    .filter((l) => l.trim() !== '')
  const headers = parseCsvLine(lines[0], ';').map((h) =>
    h.trim().replace(/^"|"$/g, ''),
  )

  let mismatchCount = 0

  const rows = lines.slice(1).map((line: string, idx: number) => {
    const vals = parseCsvLine(line, ';')
    if (vals.length !== headers.length) {
      mismatchCount++
      if (mismatchCount <= 10) {
        console.warn(
          `  [readCsv] WARNING baris ${idx + 2}: jumlah kolom ${vals.length}, ` +
            `harusnya ${headers.length}. Kemungkinan ada quote tidak balance ` +
            `atau field rusak. Baris: ${line.slice(0, 150)}...`,
        )
      }
    }

    const obj: Record<string, string> = {}
    headers.forEach((h: string, i: number) => {
      obj[h] = (vals[i] ?? '').trim().replace(/^\t/, '').replace(/^"|"$/g, '')
    })
    return obj
  })

  if (mismatchCount > 0) {
    console.warn(
      `  [readCsv] Total ${mismatchCount} baris dengan jumlah kolom tidak cocok ` +
        `(dari ${lines.length - 1} baris). Periksa data ini secara manual.`,
    )
  }

  return rows
}

// ─── DATE PARSERS ─────────────────────────────────────────────────────────────

/**
 * Parse berbagai format tanggal yang ada di CSV:
 *   - "2026-05-01 07:42:26"  (ProgresCater tglcatat)
 *   - "2018-09-14 00:00:00"  (tglpasangmeter)
 *   - "4/8/2026"             (r-nomor, format M/D/YYYY)
 *   - "5/6/2026"
 * Kembalikan Date atau null jika kosong/invalid.
 */
export function parseDate(raw: string | undefined | null): Date | null {
  if (!raw || raw.trim() === '' || raw.trim() === 'NaN') return null
  const s = raw.trim()

  // Format M/D/YYYY dari r-nomor
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/').map(Number)
    return new Date(y, m - 1, d)
  }

  // Format YYYY-MM-DD (dengan atau tanpa jam)
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Konversi Excel date serial ke Date.
 * PBPK field tglaktif berisi nilai float seperti 46168.265
 * yang merupakan jumlah hari sejak 1900-01-00 (epoch Excel).
 *
 * Validasi: nilai 29230 (tahun ~1980) dan 31386 (tahun ~1985) adalah
 * tanggal pasang lama yang valid. Nilai ~46168 = 2026-05-01 (valid).
 * Nilai yang menghasilkan tahun < 1990 atau > 2050 dianggap placeholder.
 */
export function excelDateToJs(raw: string | undefined | null): Date | null {
  if (!raw || raw.trim() === '' || raw.trim() === '0') return null
  const n = parseFloat(raw)
  if (isNaN(n)) return null

  // Excel epoch: 1 Januari 1900 = serial 1
  // Bug Excel: menganggap 1900 adalah tahun kabisat, offset +1 hari
  const msPerDay = 86400000
  const excelEpoch = new Date(1899, 11, 30).getTime() // 30 Des 1899
  const result = new Date(excelEpoch + Math.floor(n) * msPerDay)

  const year = result.getFullYear()
  if (year < 1980 || year > 2050) return null // Placeholder / invalid
  return result
}

/**
 * Konversi thbl (YYYYMM integer) ke tanggal 1 bulan tersebut.
 * 202605 → 2026-05-01T00:00:00.000Z
 */
export function thblToDate(thbl: number | string): Date {
  const s = String(thbl)
  const year = parseInt(s.slice(0, 4))
  const month = parseInt(s.slice(4, 6))
  return new Date(year, month - 1, 1)
}

// ─── NORMALIZERS ─────────────────────────────────────────────────────────────

/**
 * Normalisasi nomor langganan: zero-pad ke 11 digit.
 * "209301892" → "00209301892"
 */
export function normalizeNolg(raw: string | number): string {
  return String(raw).trim().replace(/^\t/, '').padStart(11, '0')
}

/**
 * Normalisasi nama pencatat: UPPERCASE + trim.
 * "iwan", " IWAN ", "IWAN" → "IWAN"
 * "-" atau "" → null (petugas tidak diketahui)
 */
export function normalizePencatat(
  raw: string | undefined | null,
): string | null {
  if (!raw) return null
  const s = raw.trim().toUpperCase()
  if (s === '-' || s === '' || s === 'NULL') return null
  return s
}

/**
 * Normalisasi merk meter: UPPERCASE + trim spasi trailing.
 * "lin", "AQ ", "aq " → "LIN", "AQ", "AQ"
 */
export function normalizeMerk(raw: string | undefined | null): string | null {
  if (!raw || raw.trim() === '') return null
  return raw.trim().toUpperCase()
}

/**
 * Normalisasi notelp: buang leading zero ganda, karakter non-digit kecuali +
 * Jika hasilnya terlalu pendek atau "0"/"00000" → null
 */
export function normalizeNotelp(raw: string | undefined | null): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (s === '' || s === '0' || s === '00000' || s === '-' || s === '000')
    return null
  return s
}

// ─── ENUM MAPPERS ─────────────────────────────────────────────────────────────

/**
 * Map trp (ProgresCater) / kd_goltarif (PBPK) ke GolonganTarif enum.
 * Keduanya memakai kode yang sama: "2A3", "1A", "3B", dst.
 */
export function mapTarif(raw: string | undefined | null): GolonganTarif | null {
  if (!raw) return null
  const MAP: Record<string, GolonganTarif> = {
    '1A': GolonganTarif.GOL_1A,
    '1B': GolonganTarif.GOL_1B,
    '2A1': GolonganTarif.GOL_2A1,
    '2A2': GolonganTarif.GOL_2A2,
    '2A3': GolonganTarif.GOL_2A3,
    '2A4': GolonganTarif.GOL_2A4,
    '2A5': GolonganTarif.GOL_2A5,
    '2B': GolonganTarif.GOL_2B,
    '3A': GolonganTarif.GOL_3A,
    '3B': GolonganTarif.GOL_3B,
    '3C': GolonganTarif.GOL_3C,
    '4A': GolonganTarif.GOL_4A,
    '4B': GolonganTarif.GOL_4B,
  }
  return MAP[raw.trim()] ?? null
}

/**
 * Map mutasikode + mutasinama ke StatusPelanggan.
 * mutasikode=3 / "PELANGGAN AKTIF" → AKTIF
 * "tupsm" → TUTUP_SEMENTARA
 * "tupsp" → TUTUP_SPT
 */
export function mapStatusPelanggan(
  mutasikode: string | undefined | null,
  mutasinama: string | undefined | null,
): StatusPelanggan {
  const nama = (mutasinama ?? '').toLowerCase().trim()
  if (nama === 'tupsm') return StatusPelanggan.TUTUP_SEMENTARA
  if (nama === 'tupsp') return StatusPelanggan.TUTUP_SPT
  return StatusPelanggan.AKTIF
}

/**
 * Map ketcatat (ProgresCater) / Nm_Kel (lapdatameter) ke KondisiCatat.
 * Inkonsistensi case ditangani dengan normalize lowercase.
 */
export function mapKondisi(raw: string | undefined | null): KondisiCatat {
  if (!raw) return KondisiCatat.NORMAL
  const MAP: Record<string, KondisiCatat> = {
    normal: KondisiCatat.NORMAL,
    'tidak dipakai': KondisiCatat.TIDAK_DIPAKAI,
    'rumah kosong': KondisiCatat.RUMAH_KOSONG,
    'rmh/tanah ksg': KondisiCatat.RUMAH_KOSONG,
    'stand tempel': KondisiCatat.STAND_TEMPEL,
    'stand-tempel': KondisiCatat.STAND_TEMPEL,
    'stand-konsumen': KondisiCatat.STAND_KONSUMEN,
    'stand konsumen': KondisiCatat.STAND_KONSUMEN,
    'meter rusak': KondisiCatat.METER_RUSAK,
    'mati ada air': KondisiCatat.METER_MATI_ADA_AIR,
    'meter mati air ada': KondisiCatat.METER_MATI_ADA_AIR,
    'meter mundur': KondisiCatat.METER_MUNDUR,
    'meter terbalik': KondisiCatat.METER_TERBALIK,
    'meter dalam air': KondisiCatat.METER_DALAM_AIR,
    'los meter': KondisiCatat.LOS_METER,
    'bmk/bmb': KondisiCatat.BMK_BMB,
    ttb: KondisiCatat.TTB,
    mta: KondisiCatat.MTA,
    terhalang: KondisiCatat.TERHALANG,
    'tidak ada air': KondisiCatat.TIDAK_ADA_AIR,
    'ada anjing': KondisiCatat.ADA_ANJING,
    dk: KondisiCatat.DK,
    mb: KondisiCatat.MB,
    'muda kembali': KondisiCatat.MUDA_KEMBALI,
    'rev.pencatat': KondisiCatat.REV_PENCATAT,
    'rev pencatat': KondisiCatat.REV_PENCATAT,
    dicabut: KondisiCatat.DICABUT,
  }
  return MAP[raw.trim().toLowerCase()] ?? KondisiCatat.NORMAL
}

/**
 * Map ukmeter (ProgresCater) / kd_ukmeter (PBPK) ke UkuranMeter.
 * PBPK memakai "A" untuk 1/2 inci.
 */
export function mapUkuranMeter(raw: string | undefined | null): UkuranMeter {
  if (!raw) return UkuranMeter.INCH_HALF
  const MAP: Record<string, UkuranMeter> = {
    '1/2': UkuranMeter.INCH_HALF,
    a: UkuranMeter.INCH_HALF,
    '1': UkuranMeter.INCH_1,
    '1 1/2': UkuranMeter.INCH_1_HALF,
    '2': UkuranMeter.INCH_2,
    '3': UkuranMeter.INCH_3,
    '4': UkuranMeter.INCH_4,
  }
  return MAP[raw.trim().toLowerCase()] ?? UkuranMeter.INCH_HALF
}

/**
 * Map kategorialnama ke KategoriPembacaan.
 */
export function mapKategori(raw: string | undefined | null): KategoriPembacaan {
  if (!raw) return KategoriPembacaan.ONSITE
  return raw.trim().toUpperCase() === 'OFFSITE'
    ? KategoriPembacaan.OFFSITE
    : KategoriPembacaan.ONSITE
}

// ─── BATCH HELPER ─────────────────────────────────────────────────────────────

/**
 * Jalankan fungsi `fn` secara batch untuk menghindari memory overflow
 * dan koneksi DB yang terlalu besar.
 */
export async function inBatches<T>(
  items: T[],
  batchSize: number,
  fn: (batch: T[], batchIndex: number, totalBatches: number) => Promise<void>,
): Promise<void> {
  const total = items.length
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchIndex = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(total / batchSize)
    process.stdout.write(
      `  batch ${batchIndex}/${totalBatches} (${i + batch.length}/${total})\r`,
    )
    await fn(batch, batchIndex, totalBatches)
  }
  process.stdout.write('\n')
}

// ─── PROGRESS LOGGER ──────────────────────────────────────────────────────────

export function log(phase: string, msg: string) {
  console.log(`[${phase}] ${msg}`)
}
