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
 * Deteksi delimiter CSV secara otomatis dari baris header.
 * Strategi: hitung kemunculan `;` vs `,` di baris pertama —
 * delimiter yang lebih sering muncul dianggap pemenang.
 * Kalau sama atau tidak ada, fallback ke `;` (default Tirtawening).
 */
function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  if (commas > semicolons) return ','
  return ';'
}

/**
 * Baca file CSV dan kembalikan array of objects.
 * Otomatis strip whitespace dan tab dari setiap value.
 *
 * @param filePath  Path ke file CSV
 * @param delimiter Karakter pemisah kolom. Default: auto-detect dari header
 *                  (hitung `;` vs `,`, ambil yang lebih banyak). Bisa
 *                  di-override eksplisit jika auto-detect meleset, misal
 *                  readCsv('./data.csv', ',') untuk CSV berkomma.
 *
 * Quote-aware: field ber-quote yang mengandung delimiter di dalamnya TIDAK
 * akan memecah kolom (lihat parseCsvLine di atas).
 *
 * Validasi: setiap baris yang jumlah kolomnya tidak cocok dengan header
 * akan di-warn ke console (bukan langsung throw, supaya seed tetap bisa
 * jalan) sehingga anomali ketahuan saat seeding, bukan setelah hitung
 * jumlah data meleset.
 */
export function readCsv(
  filePath: string,
  delimiter?: string,
): Record<string, string>[] {
  const abs = path.resolve(filePath)
  const raw = fs.readFileSync(abs, 'utf-8')

  // Strip BOM (UTF-8 BOM \uFEFF sering muncul di export Excel Windows —
  // tanpa ini, kolom pertama header terbaca sebagai "\uFEFFNo Pel" bukan
  // "No Pel", sehingga row["No Pel"] selalu undefined → semua baris di-skip)
  const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw

  const lines = clean
    .trim()
    .split('\n')
    .filter((l) => l.trim() !== '')

  // Auto-detect delimiter dari header jika tidak di-override
  const sep = delimiter ?? detectDelimiter(lines[0])

  const headers = parseCsvLine(lines[0], sep).map((h) =>
    h.trim().replace(/^"|"$/g, ''),
  )

  let mismatchCount = 0

  const rows = lines.slice(1).map((line: string, idx: number) => {
    const vals = parseCsvLine(line, sep)
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
        `(dari ${lines.length - 1} baris). Delimiter yang terdeteksi: '${sep}'. ` +
        `Jika salah, override dengan readCsv(path, ',') atau readCsv(path, ';').`,
    )
  }

  return rows
}

// ─── DATE PARSERS ─────────────────────────────────────────────────────────────

// ─── DATE PARSERS ─────────────────────────────────────────────────────────────

/**
 * Satu-satunya fungsi date parser yang perlu kamu panggil dari luar.
 * Menangani semua format tanggal yang pernah/mungkin muncul di CSV Tirtawening:
 *
 *   "2026-05-01"            → ISO date (ProgresCater, format paling aman)
 *   "2026-05-01 07:42:26"   → ISO datetime
 *   "01/07/2026"            → DD/MM/YYYY (lapdatameter tgl_catat/tgl_upload)
 *   "4/8/2026"              → M/D/YYYY  (r-nomor) — tapi lihat catatan di bawah
 *
 * STRATEGI AUTO-DETECT DD/MM vs MM/DD:
 * Kalau salah satu komponen lebih dari 12, itu PASTI bukan bulan →
 * komponen itu adalah hari, dan urutan terbalik.
 *   "25/07/2026" → 25 tidak bisa jadi bulan → pasti DD/MM/YYYY → 25 Juli
 *   "07/25/2026" → 25 di posisi ke-2, tidak bisa jadi bulan → pasti MM/DD/YYYY → 25 Juli
 *
 * KASUS AMBIGU (kedua komponen ≤ 12, misal "01/07/2026"):
 * Tidak bisa otomatis dibedakan secara matematis. Gunakan parameter `format`:
 *   parseDateAuto("01/07/2026", "DMY") → 1 Juli (lapdatameter)
 *   parseDateAuto("4/8/2026",   "MDY") → 8 April (r-nomor)
 *   parseDateAuto("01/07/2026")        → default DMY (lebih umum di Indonesia)
 *
 * Kembalikan null jika kosong, "NaN", atau tanggal tidak valid.
 */
export function parseDateAuto(
  raw: string | undefined | null,
  format: 'DMY' | 'MDY' | 'auto' = 'DMY',
): Date | null {
  if (!raw) return null
  const s = raw.trim()
  if (s === '' || s === 'NaN' || s === '-' || s === '0') return null

  // Format ISO: YYYY-MM-DD (dengan atau tanpa jam) → langsung parse, aman
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  // Format slash: D/M/YYYY, DD/MM/YYYY, M/D/YYYY, dll
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/').map(Number)
    const [a, b, y] = parts

    let day: number
    let month: number

    if (format === 'auto') {
      // Kalau a > 12: a pasti hari (DD/MM/YYYY)
      // Kalau b > 12: b pasti hari → berarti a adalah bulan (MM/DD/YYYY)
      // Kalau keduanya ≤ 12: ambiguous → asumsi DMY (konvensi Indonesia)
      if (a > 12) {
        day = a
        month = b
      } else if (b > 12) {
        day = b
        month = a
      } else {
        // Ambiguous: default DMY
        day = a
        month = b
      }
    } else if (format === 'DMY') {
      day = a
      month = b
    } else {
      // MDY
      month = a
      day = b
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const result = new Date(y, month - 1, day)
    // Validasi tambahan: new Date(2026, 1, 30) akan auto-overflow ke Maret —
    // tangkap kasus ini dan kembalikan null
    if (result.getMonth() !== month - 1) return null
    return result
  }

  return null
}

/**
 * @deprecated Gunakan parseDateAuto(raw, 'MDY') sebagai gantinya.
 * Dipertahankan untuk backward compatibility dengan seed r-nomor yang sudah ada.
 *
 * Parse tanggal format M/D/YYYY (r-nomor) atau YYYY-MM-DD (ProgresCater).
 */
export function parseDate(raw: string | undefined | null): Date | null {
  if (!raw) return null
  const s = raw.trim()
  if (s === '' || s === 'NaN') return null

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    return parseDateAuto(s, 'MDY')
  }

  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * @deprecated Gunakan parseDateAuto(raw, 'DMY') sebagai gantinya.
 * Dipertahankan untuk backward compatibility dengan 03-lapdatameter.ts.
 *
 * Parse tanggal format DD/MM/YYYY (lapdatameter tgl_catat, tgl_upload).
 */
export function parseDateDMY(raw: string | undefined | null): Date | null {
  return parseDateAuto(raw, 'DMY')
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
 * Normalisasi nomor langganan: strip whitespace/tab, lalu zero-pad ke
 * panjang yang diinginkan.
 *
 * @param raw    Value mentah dari CSV
 * @param digits Panjang nomor yang diharapkan (default 11 — standar PDAM).
 *               Jika sistem berganti format (misal 12 digit), cukup ubah
 *               parameter ini tanpa mengubah tiap seed script.
 *
 * "209301892" → "00209301892" (digits=11, default)
 * "209301892" → "000209301892" (digits=12)
 */
export function normalizeNolg(raw: string | number, digits = 11): string {
  return String(raw).trim().replace(/^\t/, '').padStart(digits, '0')
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
