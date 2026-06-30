/**
 * Config kategori tanggal untuk tabel Laporan Harian Pencatatan.
 *
 * SOAL SABTU/MINGGU & LIBUR NASIONAL - keduanya OTOMATIS dari backend:
 * - Sabtu/Minggu: backend menghitung lewat `date.getDay()` (0=Minggu,
 *   6=Sabtu), otomatis menyesuaikan tanggal berapa yang jatuh weekend tiap
 *   bulan tanpa perlu diisi manual.
 * - Libur nasional: backend fetch dari API publik kalender libur Indonesia
 *   (lihat fetchLiburNasional di laporan-harian.router.ts), jadi tanggal
 *   merah nasional (Lebaran, Natal, dll) otomatis terdeteksi dan warnanya
 *   berubah sendiri tanpa perlu update kode setiap tahun.
 *
 * File ini cuma untuk PENGECUALIAN yang TIDAK bisa dideteksi otomatis:
 * cuti bersama internal perusahaan, lembur weekend, atau koreksi manual
 * kalau API libur nasional eksternal kebetulan salah/belum update.
 *
 * Cara pakai:
 * 1. Tambah/ubah entry di `KATEGORI_TANGGAL_OVERRIDE` HANYA untuk
 *    pengecualian di luar yang sudah otomatis (format key: "YYYYMM-DD").
 * 2. Tanggal yang tidak di-override otomatis ikut hasil dari backend lewat
 *    `resolveKategoriTanggal` di bawah.
 * 3. Untuk nambah jenis kategori baru (mis. "cuti-bersama"), tinggal
 *    tambahkan entry baru di `KATEGORI_STYLES` - tidak perlu ubah file lain.
 */

export type KategoriTanggal = 'kerja' | 'libur' | 'lembur' | 'setengah-hari'

export interface KategoriStyle {
  /** Label singkat untuk tooltip/legend */
  label: string
  /** Warna background header kolom tanggal (pakai token tema, bukan hex) */
  headerClassName: string
  /** Warna teks header kolom tanggal */
  headerTextClassName: string
}

/**
 * Definisi visual tiap kategori. Semua warna pakai CSS variable / token
 * Tailwind yang theme-aware (otomatis menyesuaikan light/dark mode),
 * BUKAN warna hardcode seperti `bg-blue-600`.
 *
 * Variable `--kategori-*` didefinisikan di `laporan-harian-theme.css`
 * supaya bisa di-override per-tema tanpa ubah komponen React.
 */
export const KATEGORI_STYLES: Record<KategoriTanggal, KategoriStyle> = {
  kerja: {
    label: 'Hari kerja',
    headerClassName: 'bg-[hsl(var(--kategori-kerja))]',
    headerTextClassName: 'text-[hsl(var(--kategori-kerja-foreground))]',
  },
  libur: {
    label: 'Libur / Minggu',
    headerClassName: 'bg-[hsl(var(--kategori-libur))]',
    headerTextClassName: 'text-[hsl(var(--kategori-libur-foreground))]',
  },
  lembur: {
    label: 'Lembur',
    headerClassName: 'bg-[hsl(var(--kategori-lembur))]',
    headerTextClassName: 'text-[hsl(var(--kategori-lembur-foreground))]',
  },
  'setengah-hari': {
    label: 'Setengah hari',
    headerClassName: 'bg-[hsl(var(--kategori-setengah-hari))]',
    headerTextClassName: 'text-[hsl(var(--kategori-setengah-hari-foreground))]',
  },
}

/**
 * Override manual per tanggal. Key format: "YYYYMM-DD", contoh "202602-15".
 *
 * HANYA isi ini untuk PENGECUALIAN di luar yang sudah otomatis dari backend
 * (Sabtu/Minggu dan libur nasional publik):
 *   - Cuti bersama internal perusahaan yang jatuh di hari kerja biasa
 *   - Hari kerja yang ternyata diliburkan mendadak di luar kalender resmi
 *   - Sabtu/Minggu yang ternyata masuk lembur
 *   - Koreksi manual kalau API libur nasional eksternal kebetulan keliru
 *
 * JANGAN isi Sabtu/Minggu atau libur nasional di sini - keduanya sudah
 * otomatis benar dari backend, tidak perlu diulang manual.
 */
export const KATEGORI_TANGGAL_OVERRIDE: Record<string, KategoriTanggal> = {
  // ── Contoh: libur nasional / cuti bersama 2026 ──
  // '202601-01': 'libur', // Tahun Baru
  // '202602-17': 'libur', // Isra Mikraj (contoh)
  // ── Contoh: lembur weekend ──
  // '202602-21': 'lembur', // Sabtu lembur deadline akhir bulan
}

/**
 * Resolve kategori final untuk satu sel tanggal, dengan prioritas:
 * 1. Override manual dari KATEGORI_TANGGAL_OVERRIDE (kalau ada) - untuk
 *    pengecualian yang tidak tertangkap otomatis dari backend.
 * 2. liburNasional dari backend (kalau ada) - backend sudah fetch dari API
 *    libur nasional publik, jadi tanggal merah otomatis terdeteksi tanpa
 *    perlu diisi manual satu-satu.
 * 3. Default dari flag isHariKerja (mencakup weekend) yang dihitung backend.
 *
 * @param liburNasional nama libur nasional dari backend, null kalau tidak ada
 */
export function resolveKategoriTanggal(
  periode: number,
  tanggal: number,
  isHariKerja: boolean,
  liburNasional?: string | null,
): KategoriTanggal {
  const key = `${periode}-${String(tanggal).padStart(2, '0')}`
  const override = KATEGORI_TANGGAL_OVERRIDE[key]
  if (override) return override
  if (liburNasional) return 'libur'
  return isHariKerja ? 'kerja' : 'libur'
}

/**
 * Label tooltip untuk satu sel tanggal. Kalau backend mendeteksi libur
 * nasional, tampilkan nama liburnya (mis. "Hari Raya Idul Adha") supaya
 * lebih informatif daripada cuma "Libur / Minggu" generik.
 */
export function resolveLabelTanggal(
  kategori: KategoriTanggal,
  liburNasional?: string | null,
): string {
  if (liburNasional) return liburNasional
  return KATEGORI_STYLES[kategori].label
}
