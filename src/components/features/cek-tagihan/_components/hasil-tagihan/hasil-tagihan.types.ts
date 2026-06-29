import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/server/trpc/router'

// ─── Domain Types ───────────────────────────────────────────────────────────

type RouterOutput = inferRouterOutputs<AppRouter>
// Mengambil tipe data array dari cekTagihan
export type CekTagihanResult = RouterOutput['tagihan']['cekTagihan']

export interface HasilTagihanProps {
  // Pastikan data boleh undefined/null untuk handle state loading/empty
  data?: CekTagihanResult | null
}

// ─── Status Config ───────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'BELUM_BAYAR'
  | 'SUDAH_BAYAR'
  | 'JATUH_TEMPO'
  | 'CICILAN'

export interface StatusConfig {
  label: string
  badgeClass: string
  dotClass: string
  textClass: string
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  BELUM_BAYAR: {
    label: 'Belum Lunas',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-700 dark:text-amber-400',
  },
  SUDAH_BAYAR: {
    label: 'Lunas',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  JATUH_TEMPO: {
    label: 'Jatuh Tempo',
    badgeClass:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700 dark:text-red-400',
  },
  CICILAN: {
    label: 'Cicilan',
    badgeClass:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
}

export const DEFAULT_STATUS: StatusConfig = STATUS_CONFIG['SUDAH_BAYAR']

// ─── Utilities ───────────────────────────────────────────────────────────────

export function formatRupiah(
  value: number | bigint | null | undefined,
): string {
  if (value === null || value === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(value))
}

/**
 * Mendapatkan status aktif dari daftar tagihan.
 * Menggunakan pendekatan defensive programming.
 */
export function getActiveStatus(
  tagihan?: CekTagihanResult | null,
): StatusConfig {
  // 1. Jika data tidak ada, return default
  if (!tagihan || !Array.isArray(tagihan) || tagihan.length === 0) {
    return DEFAULT_STATUS
  }

  // 2. Prioritaskan tagihan yang belum bayar sebagai status "aktif"
  const activeTagihan = tagihan.find((t) => t.status !== 'SUDAH_BAYAR')

  // 3. Jika ada tagihan belum lunas, gunakan statusnya, jika tidak gunakan tagihan terbaru
  const statusKey = activeTagihan?.status ?? tagihan[0]?.status ?? 'SUDAH_BAYAR'

  return STATUS_CONFIG[statusKey] ?? DEFAULT_STATUS
}
