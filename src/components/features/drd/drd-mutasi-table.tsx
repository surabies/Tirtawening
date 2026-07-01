// src/components/features/drd/drd-mutasi-table.tsx
//
// Tabel mutasi pelanggan (PB, PK, PS) per bulan dalam satu tahun,
// konsumsi trpc.drd.mutasi.perBulan.
//
// Style mengikuti drd-domestik-table.tsx:
//   - HEADER_BG / HEADER_TEXT (hsl var biru) untuk header baris
//   - kolom Bulan sticky kiri + STICKY_DIVIDER (box-shadow, bukan border)
//   - COL_BULAN_WIDTH fixed supaya offset sticky akurat
//   - border-r per cell untuk grid vertikal
//   - border-collapse + text-xs di <Table>
//   - baris Total pakai <TableFooter>, bukan <TableBody> kedua
//   - loading: Skeleton satu blok tinggi
//   - error & empty: centered box dengan border

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

// ── Konstanta style (identik dengan drd-domestik-table.tsx) ──────────────────

const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

const COL_BULAN_WIDTH = 'w-28 min-w-28 max-w-28'
const STICKY_DIVIDER = 'shadow-[2px_0_0_0_rgba(100,116,139,0.6)]'

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAngka = (n: number) => n.toLocaleString('id-ID')

function formatSelisih(n: number): string {
  const abs = formatAngka(Math.abs(n))
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}` // minus tipografi (−), bukan tanda kurang (-)
  return abs
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DrdMutasiTableProps {
  tahunDefault?: number
  targetPerBulan?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DrdMutasiTable({
  tahunDefault = new Date().getFullYear(),
  targetPerBulan = 15,
}: DrdMutasiTableProps) {
  const [tahun, setTahun] = useState(tahunDefault)
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.mutasi.perBulan.queryOptions({ tahun, targetPerBulan }),
  )

  const tahunOptions = Array.from({ length: 5 }, (_, i) => tahunDefault - i)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Mutasi Pelanggan per Bulan
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
          Gagal memuat data mutasi. Silakan coba lagi.
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
                {/* ── Baris header 1: grup kolom ── */}
                <TableRow className="hover:bg-transparent">
                  {/* Bulan — sticky, rowSpan 2 */}
                  <TableHead
                    rowSpan={2}
                    className={cn(
                      'sticky left-0 z-20 border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left align-middle font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      STICKY_DIVIDER,
                      COL_BULAN_WIDTH,
                    )}
                  >
                    Bulan
                  </TableHead>

                  {/* Target — rowSpan 2 */}
                  <TableHead
                    rowSpan={2}
                    className={cn(
                      'border-b border-r border-slate-300 dark:border-slate-600 px-2 py-2 text-center align-middle font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Target
                  </TableHead>

                  {/* Penambahan — colSpan 3 */}
                  <TableHead
                    colSpan={3}
                    className={cn(
                      'border-b border-r border-slate-300 dark:border-slate-600 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Penambahan
                  </TableHead>

                  {/* Pengurangan — colSpan 1 */}
                  <TableHead
                    className={cn(
                      'border-b border-r border-slate-300 dark:border-slate-600 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Pengurangan
                  </TableHead>

                  {/* Netto — rowSpan 2 */}
                  <TableHead
                    rowSpan={2}
                    className={cn(
                      'border-b border-slate-300 dark:border-slate-600 px-2 py-2 text-center align-middle font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    Netto
                  </TableHead>
                </TableRow>

                {/* ── Baris header 2: sub-kolom ── */}
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    className={cn(
                      'h-auto min-w-14 border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    PB
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-14 border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    PK
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    Jumlah
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-14 border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                      'opacity-90',
                    )}
                  >
                    PS
                  </TableHead>
                </TableRow>
              </TableHeader>

              {/* ── Body ── */}
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

                    {/* Target */}
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums">
                      {formatAngka(item.target)}
                    </TableCell>

                    {/* PB */}
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(item.penambahan.pb)}
                    </TableCell>

                    {/* PK */}
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(item.penambahan.pk)}
                    </TableCell>

                    {/* Jumlah Penambahan */}
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold tabular-nums">
                      {formatAngka(item.penambahan.jumlah)}
                    </TableCell>

                    {/* PS */}
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums text-muted-foreground">
                      {formatAngka(item.pengurangan.ps)}
                    </TableCell>

                    {/* Netto */}
                    <TableCell
                      className={cn(
                        'border-b border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center font-semibold tabular-nums',
                        item.jumlahMutasi < 0
                          ? 'text-destructive'
                          : item.jumlahMutasi > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : '',
                      )}
                    >
                      {formatSelisih(item.jumlahMutasi)}
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
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-2 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalTarget)}
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalPb)}
                  </TableCell>
                  <TableCell className="border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalPk)}
                  </TableCell>
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalPenambahan)}
                  </TableCell>
                  <TableCell className="border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                    {formatAngka(data.summary.totalPengurangan)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'px-2 py-1.5 text-center tabular-nums',
                      data.summary.nettMutasi < 0
                        ? 'text-destructive'
                        : data.summary.nettMutasi > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : '',
                    )}
                  >
                    {formatSelisih(data.summary.nettMutasi)}
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
