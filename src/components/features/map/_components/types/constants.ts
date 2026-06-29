import type { PelangganStatusCounts } from "./types"

// ── Tampilan peta ────────────────────────────────────────────────────────
/** Titik tengah peta saat pertama dimuat (area Bandung). */
export const MAP_DEFAULT_CENTER: [number, number] = [107.6191, -6.9175]
export const MAP_DEFAULT_ZOOM = 13

/** Konfigurasi visual cluster titik pelanggan di peta. */
export const PELANGGAN_CLUSTER_CONFIG: {
  pointColor: string
  clusterColors: string[]
  clusterThresholds: number[]
  clusterRadius: number
} = {
  pointColor: "#0ea5e9",
  clusterColors: ["#22c55e", "#f97316", "#ef4444"],
  clusterThresholds: [40, 120],
  clusterRadius: 70,
}

/** Ekspresi warna isi titik berdasarkan status pelanggan */
export const POINT_COLOR_EXPRESSION = [
  "match",
  ["get", "status"],
  "AKTIF",
  "#10b981", // Hijau
  "POTENSIAL",
  "#0ea5e9", // Biru
  "EKS_PELANGGAN",
  "#8b5cf6", // Ungu

  // Karena tidak ada "TUTUP_SPT" atau "TUTUP_SEMENTARA" di atas,
  // mereka akan jatuh ke default warna Abu-abu.
  "#94a3b8", // Default (Abu-abu)
] as const
/** Ekspresi warna bingkai berdasarkan rute pelanggan */
export const POINT_STROKE_EXPRESSION = [
  "match",
  ["get", "kode_rute"],
  "R01",
  "#a855f7",
  "R02",
  "#ec4899",
  "R03",
  "#3b82f6",
  "#ffffff", // default putih
] as const
// ── Layer GeoJSON wilayah ────────────────────────────────────────────────
export const WILAYAH_SOURCE_ID = "wilayah-geojson-source"
export const WILAYAH_FILL_LAYER_ID = "wilayah-geojson-fill"
export const WILAYAH_OUTLINE_LAYER_ID = "wilayah-geojson-outline"

// ── Status pelanggan ─────────────────────────────────────────────────────
/** Urutan tampil status pelanggan di overlay statistik. */
export const STATUS_ORDER: (keyof PelangganStatusCounts)[] = [
  "AKTIF",
  "TUTUP_SEMENTARA",
  "TUTUP_SPT",
  "CABUT_PERMANEN",
]

/** Warna dot per status — satu sumber kebenaran untuk overlay & popup. */
export const STATUS_DOT_COLOR: Record<keyof PelangganStatusCounts, string> = {
  AKTIF: "bg-emerald-500",
  TUTUP_SEMENTARA: "bg-amber-500",
  TUTUP_SPT: "bg-orange-500",
  CABUT_PERMANEN: "bg-red-500",
}

/** Fallback warna dot jika status tidak terdaftar di atas. */
export const STATUS_DOT_COLOR_FALLBACK = "bg-slate-400"

/** Ambil kelas warna dot Tailwind untuk sebuah status pelanggan. */
export function getStatusDotColor(status: string): string {
  return (
    STATUS_DOT_COLOR[status as keyof PelangganStatusCounts] ??
    STATUS_DOT_COLOR_FALLBACK
  )
}
// ── Konstanta tampilan untuk panel detail peta ──────────────────────────────
// Disatukan di sini supaya warna/label status & legenda mudah diubah tanpa
// perlu menyentuh logika komponen.

/** Warna badge status pelanggan di kartu Detail Pelanggan. */
export const PELANGGAN_STATUS_BADGE: Record<string, string> = {
  AKTIF: "bg-green-500/10 text-green-700 border-green-500/30",
  TUTUP_SEMENTARA: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  TUTUP_SPT: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  CABUT_PERMANEN: "bg-red-500/10 text-red-700 border-red-500/30",
}

/** Fallback warna badge jika status pelanggan tidak terdaftar di atas. */
export const PELANGGAN_STATUS_BADGE_FALLBACK =
  "bg-slate-500/10 text-slate-700 border-slate-500/30"

/** Item legenda: titik warna status pelanggan. */
export const LEGEND_STATUS_ITEMS: { color: string; label: string }[] = [
  { color: "bg-green-500", label: "Aktif" },
  { color: "bg-red-500", label: "Potensial" },
  { color: "bg-amber-500", label: "Eks Peanggan" },
  // { color: "bg-orange-500", label: "Tutup SPT" },
]

/** Item legenda: warna isi (fill) batas wilayah kecamatan. */
export const LEGEND_KECAMATAN_ITEMS: { color: string; label: string }[] = [
  {
    color: "bg-blue-500/10 border-blue-500/40 dark:border-blue-500/60",
    label: "Regol",
  },
  {
    color: "bg-violet-500/10 border-violet-500/40 dark:border-violet-500/60",
    label: "Lengkong",
  },
  {
    color: "bg-emerald-500/10 border-emerald-500/40 dark:border-emerald-500/60",
    label: "Andir",
  },
  {
    color: "bg-amber-500/10 border-amber-500/40 dark:border-amber-500/60",
    label: "Cicendo",
  },
  {
    color: "bg-red-500/10 border-red-500/40 dark:border-red-500/60",
    label: "Astanaanyar",
  },
  {
    color: "bg-cyan-500/10 border-cyan-500/40 dark:border-cyan-500/60",
    label: "Sumur Bandung",
  },
]
