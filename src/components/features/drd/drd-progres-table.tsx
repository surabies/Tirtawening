// src/components/features/drd/drd-progres-table.tsx
//
// Tabel historis bulanan SL & m³, konsumsi trpc.drd.progres.tren.
//
// Style mengikuti drd-domestik-table.tsx / drd-mutasi-table.tsx:
//   - HEADER_BG / HEADER_TEXT untuk semua header cell
//   - kolom Periode sticky kiri + STICKY_DIVIDER
//   - border-r per cell + border-collapse text-xs di <Table>
//   - wrapper overflow-hidden rounded-none border
//   - Δ SL / Δ m³: positif emerald, negatif destructive, null abu

'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Konstanta style ───────────────────────────────────────────────────────────

const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

const COL_PERIODE_WIDTH = 'w-36 min-w-36 max-w-36'
const STICKY_DIVIDER = 'shadow-[2px_0_0_0_rgba(100,116,139,0.6)]'

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAngka = (n: number) => n.toLocaleString('id-ID')

function formatSelisih(n: number | null): string {
  if (n === null) return '—'
  const abs = formatAngka(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

function selisihClass(n: number | null): string {
  if (n === null) return 'text-muted-foreground'
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (n < 0) return 'text-destructive'
  return ''
}

const NAMA_BULAN = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function formatPeriode(periode: number): string {
  return `${NAMA_BULAN[periode % 100]} ${Math.floor(periode / 100)}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DrdProgresTableProps {
  tahunMulai?: number
  tahunAkhir?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DrdProgresTable({
  tahunMulai = new Date().getFullYear() - 1,
  tahunAkhir = new Date().getFullYear(),
}: DrdProgresTableProps) {
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.progres.tren.queryOptions({ tahunMulai, tahunAkhir }),
  )

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Histori Bulanan SL &amp; m³
        </h3>
        {/* Tidak ada filter di sini — tahunMulai & tahunAkhir dikontrol dari parent */}
      </div>

      {/* ── Loading ── */}
      {isLoading && <Skeleton className="h-96 w-full rounded-lg" />}

      {/* ── Error ── */}
      {isError && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-destructive">
          Gagal memuat data histori. Silakan coba lagi.
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada data untuk rentang periode ini.
        </div>
      )}

      {/* ── Tabel ── */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-none border border-border">
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* Periode — sticky */}
                  <TableHead
                    className={cn(
                      'sticky left-0 z-20 border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      STICKY_DIVIDER,
                      COL_PERIODE_WIDTH,
                    )}
                  >
                    Periode
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Jumlah SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Total m³
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    m³/SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Δ SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Δ m³
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.periode} className="group">
                    {/* Periode — sticky */}
                    <TableCell
                      className={cn(
                        'sticky left-0 z-10 border-b border-slate-300 dark:border-slate-600 bg-card px-3 py-1.5 font-medium group-hover:bg-muted/40',
                        STICKY_DIVIDER,
                        COL_PERIODE_WIDTH,
                      )}
                    >
                      {formatPeriode(item.periode)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center font-semibold tabular-nums">
                      {formatAngka(item.jumlahSl)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center font-semibold tabular-nums">
                      {formatAngka(item.totalM3)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                      {item.m3PerSl}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums',
                        selisihClass(item.kenaikanSl),
                      )}
                    >
                      {formatSelisih(item.kenaikanSl)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'border-b border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums',
                        selisihClass(item.kenaikanM3),
                      )}
                    >
                      {formatSelisih(item.kenaikanM3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
