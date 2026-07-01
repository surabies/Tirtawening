// src/components/features/drd/drd-pemakaian-table.tsx
//
// Tabel breakdown SL, m³, DRD per golongan tarif untuk satu periode,
// konsumsi trpc.drd.pemakaian.perGolongan.
//
// Style mengikuti drd-domestik-table.tsx / drd-mutasi-table.tsx:
//   - HEADER_BG / HEADER_TEXT (hsl var biru) untuk semua header cell
//   - kolom Golongan sticky kiri + STICKY_DIVIDER
//   - border-r per cell + border-collapse text-xs di <Table>
//   - wrapper overflow-hidden rounded-none border
//   - <TableFooter> untuk baris Total (bukan <TableBody> kedua)
//   - loading: Skeleton satu blok, error & empty: centered box dengan border

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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ── Konstanta style ───────────────────────────────────────────────────────────

const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

// Kolom "Golongan" + "Jenis Tarif" tidak di-sticky (tabel tidak terlalu lebar)
// tapi tetap pakai fixed width supaya layout stabil.
const COL_GOL_WIDTH = 'w-20 min-w-20'
const COL_JENIS_WIDTH = 'w-36 min-w-36'
const STICKY_DIVIDER = 'shadow-[2px_0_0_0_rgba(100,116,139,0.6)]'

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAngka = (n: number) => n.toLocaleString('id-ID')

function periodeSekarang() {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

function periodeToInputValue(periode: number) {
  const tahun = Math.floor(periode / 100)
  const bulan = String(periode % 100).padStart(2, '0')
  return `${tahun}-${bulan}`
}

function inputValueToPeriode(value: string) {
  const [tahun, bulan] = value.split('-')
  return Number(tahun) * 100 + Number(bulan)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DrdPemakaianTableProps {
  periodeDefault?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DrdPemakaianTable({
  periodeDefault = periodeSekarang(),
}: DrdPemakaianTableProps) {
  const [periode, setPeriode] = useState(periodeDefault)
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.pemakaian.perGolongan.queryOptions({ periode }),
  )

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Pemakaian per Golongan Tarif
        </h3>
        <Input
          type="month"
          className="h-9 w-40 text-sm"
          value={periodeToInputValue(periode)}
          onChange={(e) => setPeriode(inputValueToPeriode(e.target.value))}
        />
      </div>

      {/* ── Loading ── */}
      {isLoading && <Skeleton className="h-96 w-full rounded-lg" />}

      {/* ── Error ── */}
      {isError && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-destructive">
          Gagal memuat data pemakaian. Silakan coba lagi.
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada pencatatan untuk periode ini.
        </div>
      )}

      {/* ── Tabel ── */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-none border border-border">
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {/* Golongan — sticky */}
                  <TableHead
                    className={cn(
                      'sticky left-0 z-20 border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      STICKY_DIVIDER,
                      COL_GOL_WIDTH,
                    )}
                  >
                    Gol.
                  </TableHead>
                  {/* Jenis Tarif */}
                  <TableHead
                    className={cn(
                      'border-b border-r border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      COL_JENIS_WIDTH,
                    )}
                  >
                    Jenis Tarif
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    m³
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center font-semibold',
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
                    DRD/Hari
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-20 border-b border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    DRD/Bulan
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.golKey} className="group">
                    {/* Golongan — sticky */}
                    <TableCell
                      className={cn(
                        'sticky left-0 z-10 border-b border-slate-300 dark:border-slate-600 bg-card px-3 py-1.5 font-semibold tabular-nums group-hover:bg-muted/40',
                        STICKY_DIVIDER,
                        COL_GOL_WIDTH,
                      )}
                    >
                      {item.kode}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-3 py-1.5 text-left">
                      {item.jenis}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(item.sl)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(item.totalM3)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {item.m3PerSl}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                      {formatAngka(item.drdPerHari)}
                    </TableCell>
                    <TableCell className="border-b border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-semibold tabular-nums">
                      {formatAngka(item.drdPerBulan)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {/* ── Footer / Total ── */}
              {data.total && (
                <TableFooter>
                  <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
                    <TableCell
                      colSpan={2}
                      className={cn(
                        'sticky left-0 z-10 border-b border-slate-300 dark:border-slate-600 bg-muted px-3 py-1.5 text-left',
                        STICKY_DIVIDER,
                      )}
                    >
                      Total
                    </TableCell>
                    <TableCell className="border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(data.total.sl)}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(data.total.totalM3)}
                    </TableCell>
                    <TableCell className="border-r border-slate-200 dark:border-slate-700 px-2 py-1.5 text-center tabular-nums">
                      {data.total.m3PerSl}
                    </TableCell>
                    <TableCell className="border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(data.total.drdPerHari)}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(data.total.drdPerBulan)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
