// src/components/features/drd/drd-target-table.tsx
//
// Tabel target vs realisasi per bulan, konsumsi
// trpc.drd.target.targetVsRealisasi.
//
// Style mengikuti drd-domestik-table.tsx / drd-mutasi-table.tsx:
//   - HEADER_BG / HEADER_TEXT untuk semua header cell
//   - kolom Bulan sticky kiri + STICKY_DIVIDER + COL_BULAN_WIDTH
//   - border-r per cell + border-collapse text-xs di <Table>
//   - wrapper overflow-hidden rounded-none border
//   - <TableFooter> untuk baris Total (bukan <TableBody> kedua)
//   - Badge capaian: outline emerald ≥100%, outline destructive <100%
//   - Selisih m³: positif emerald, negatif destructive

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Konstanta style ───────────────────────────────────────────────────────────

const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

const COL_BULAN_WIDTH = 'w-28 min-w-28 max-w-28'
const STICKY_DIVIDER = 'shadow-[2px_0_0_0_rgba(100,116,139,0.6)]'

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAngka = (n: number) => n.toLocaleString('id-ID')

function formatSelisih(n: number): string {
  const abs = formatAngka(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return abs
}

// Badge capaian — outline style dengan warna eksplisit, bukan
// variant "default"/"destructive" yang bergantung pada --primary token
function CapaianBadge({ pct }: { pct: number }) {
  const tercapai = pct >= 100
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums',
        tercapai
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300',
      )}
    >
      {pct}%
    </span>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DrdTargetTableProps {
  tahunDefault?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DrdTargetTable({
  tahunDefault = new Date().getFullYear(),
}: DrdTargetTableProps) {
  const [tahun, setTahun] = useState(tahunDefault)
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.target.targetVsRealisasi.queryOptions({ tahun }),
  )

  const tahunOptions = Array.from({ length: 5 }, (_, i) => tahunDefault - i)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Target vs Realisasi per Bulan
        </h3>
        <Select
          value={String(tahun)}
          onValueChange={(v) => setTahun(Number(v))}
        >
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Pilih tahun" />
          </SelectTrigger>
          <SelectContent>
            {tahunOptions.map((t) => (
              <SelectItem key={t} value={String(t)}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Loading ── */}
      {isLoading && <Skeleton className="h-96 w-full rounded-lg" />}

      {/* ── Error ── */}
      {isError && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-destructive">
          Gagal memuat data target. Silakan coba lagi.
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada data untuk tahun {tahun}.
        </div>
      )}

      {/* ── Tabel ── */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-none border border-border">
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* Bulan — sticky */}
                  <TableHead
                    className={cn(
                      'sticky left-0 z-20 border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      STICKY_DIVIDER,
                      COL_BULAN_WIDTH,
                    )}
                  >
                    Bulan
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Target m³
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Real. SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Real. m³
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
                      'h-auto min-w-20 border-b border-r border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Selisih m³
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-18 border-b border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Capaian
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((item) => (
                  <TableRow
                    key={item.bulan}
                    className={cn(
                      'group',
                      !item.sudahAda && 'text-muted-foreground',
                    )}
                  >
                    {/* Bulan — sticky */}
                    <TableCell
                      className={cn(
                        'sticky left-0 z-10 truncate border-b border-slate-300 dark:border-slate-600 bg-card px-3 py-1.5 font-medium group-hover:bg-muted/40',
                        STICKY_DIVIDER,
                        COL_BULAN_WIDTH,
                        !item.sudahAda && 'text-muted-foreground',
                      )}
                    >
                      {item.namaBulan}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(item.target.m3)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(item.realisasi.sl)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-semibold tabular-nums">
                      {formatAngka(item.realisasi.m3)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                      {item.realisasi.m3PerSl}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-semibold tabular-nums',
                        item.selisih.m3 < 0
                          ? 'text-destructive'
                          : item.selisih.m3 > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : '',
                      )}
                    >
                      {formatSelisih(item.selisih.m3)}
                    </TableCell>
                    <TableCell className="border-b border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center">
                      {item.prosentase.m3 !== null ? (
                        <CapaianBadge pct={item.prosentase.m3} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {/* ── Footer / Total ── */}
              <TableFooter>
                <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
                  <TableCell
                    className={cn(
                      'sticky left-0 z-10 border-b border-slate-300 dark:border-slate-600 bg-muted px-3 py-1.5 text-left',
                      STICKY_DIVIDER,
                      COL_BULAN_WIDTH,
                    )}
                  >
                    Total {tahun}
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalTargetM3)}
                  </TableCell>
                  {/* SL tidak ada total — pakai sel kosong dengan border */}
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalRealisasiM3)}
                  </TableCell>
                  {/* m³/SL tidak ada total */}
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center text-muted-foreground">
                    —
                  </TableCell>
                  {/* Selisih tidak ada total */}
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center text-muted-foreground">
                    —
                  </TableCell>
                  {/* Capaian keseluruhan */}
                  <TableCell className="px-2 py-1.5 text-center">
                    {data.summary.capaianM3 !== null ? (
                      <CapaianBadge pct={data.summary.capaianM3} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
