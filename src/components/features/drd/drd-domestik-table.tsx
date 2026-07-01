// src/components/features/drd/drd-domestik-table.tsx
//
// Tabel breakdown golongan domestik (2A1–2A5) per bulan, konsumsi
// trpc.drd.domestik.perBulan.
//
// Struktur mengikuti pola robust laporan-harian-table.tsx:
//   - kolom pertama (Bulan) sticky supaya tetap kelihatan saat scroll
//     horizontal (tabel ini lebar karena tiap golongan punya 2 kolom).
//   - pemisah kolom sticky pakai box-shadow (STICKY_DIVIDER), bukan
//     border-right, biar tidak "putus" saat repaint ketika discroll.
//   - baris total pakai <TableFooter>, bukan <TableBody> kedua.
//   - label golongan & urutan kolom diambil langsung dari data.items[0]
//     (bukan konstanta terpisah), karena API selalu mengembalikan
//     5 golongan (2A1–2A5) dengan urutan tetap per baris bulan — jadi
//     tidak ada risiko label & data desync seperti sebelumnya.

'use client'

import { useState, Fragment } from 'react'
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

const formatAngka = (n: number) => n.toLocaleString('id-ID')

// Header tabel pakai warna biru solid independen dari token --primary
// project, sama seperti laporan-harian-table.tsx, supaya konsisten
// terlepas dari tema yang dipilih.
const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

// Kolom "Bulan" dikunci lebarnya PASTI (bukan cuma min-width) supaya
// offset sticky selalu akurat di semua ukuran layar/zoom.
const COL_BULAN_WIDTH = 'w-28 min-w-28 max-w-28'
const STICKY_DIVIDER = 'shadow-[2px_0_0_0_rgba(100,116,139,0.6)]'

interface DrdDomestikTableProps {
  tahunDefault?: number
}

export function DrdDomestikTable({
  tahunDefault = new Date().getFullYear(),
}: DrdDomestikTableProps) {
  const [tahun, setTahun] = useState(tahunDefault)
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.domestik.perBulan.queryOptions({ tahun }),
  )

  const tahunOptions = Array.from({ length: 5 }, (_, i) => tahunDefault - i)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Pelanggan Domestik
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

      {isLoading && <Skeleton className="h-96 w-full rounded-lg" />}

      {isError && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-destructive">
          Gagal memuat data DOMESTIK. Silakan coba lagi.
        </div>
      )}

      {!isLoading && !isError && (!data || data.items.length === 0) && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada data untuk tahun {tahun}.
        </div>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <DomestikMatrixTable data={data} tahun={tahun} />
      )}
    </div>
  )
}

type DrdDomestikData = NonNullable<
  ReturnType<
    typeof useQuery<{
      tahun: number
      items: {
        bulan: number
        namaBulan: string
        periode: number
        sudahAda: boolean
        jumlahHari: number
        golongan: {
          golKey: string
          kode: string
          sl: number
          totalM3: number
          m3PerSl: number
          drdPerHari: number
          drdPerBulan: number
        }[]
        total: {
          sl: number
          totalM3: number
          m3PerSl: number
          drdPerHari: number
          drdPerBulan: number
        }
      }[]
      summary: {
        totalM3Tahun: number
        totalDrdTahun: number
        slTerakhir: number
      } | null
    }>
  >['data']
>

function DomestikMatrixTable({
  data,
  tahun,
}: {
  data: DrdDomestikData
  tahun: number
}) {
  const golonganLabel = data.items[0]!.golongan.map((g) => g.kode)

  // Total tahunan per golongan (dijumlah manual di sini karena API cuma
  // kasih total per bulan, bukan total tahunan per golongan).
  const totalPerGolongan = golonganLabel.map((_, idx) => {
    const sl = data.items.reduce((s, i) => s + i.golongan[idx]!.sl, 0)
    const m3 = data.items.reduce((s, i) => s + i.golongan[idx]!.totalM3, 0)
    return { sl, m3 }
  })

  // DRD/Hari tahunan = total DRD setahun dibagi total hari kalender
  // sepanjang tahun tersebut (bukan cuma bulan yang sudah ada datanya),
  // konsisten dengan cara drdPerHari dihitung per bulan di router.
  const totalHariTahun = data.items.reduce((s, i) => s + i.jumlahHari, 0)
  const totalDrdPerHariTahun =
    totalHariTahun > 0 && data.summary
      ? Math.round(data.summary.totalDrdTahun / totalHariTahun)
      : 0

  return (
    <div className="overflow-hidden rounded-none border border-border">
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className={cn(
                  'sticky left-0 z-20 h-auto border-b border-slate-300 dark:border-slate-600 px-3 py-2 text-left font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  STICKY_DIVIDER,
                  COL_BULAN_WIDTH,
                )}
              >
                Bulan
              </TableHead>
              {golonganLabel.map((label) => (
                <TableHead
                  key={label}
                  colSpan={2}
                  className={cn(
                    'h-auto border-b border-r border-slate-300 dark:border-slate-600 py-1.5 text-center font-semibold',
                    HEADER_BG,
                    HEADER_TEXT,
                  )}
                >
                  {label}
                </TableHead>
              ))}
              <TableHead
                colSpan={4}
                className={cn(
                  'h-auto border-b border-slate-300 dark:border-slate-600 py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Total
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {golonganLabel.map((label) => (
                <Fragment key={label}>
                  <TableHead
                    className={cn(
                      'h-auto min-w-14 border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    SL
                  </TableHead>
                  <TableHead
                    className={cn(
                      'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
                      HEADER_BG,
                      HEADER_TEXT,
                    )}
                  >
                    M³
                  </TableHead>
                </Fragment>
              ))}
              <TableHead
                className={cn(
                  'h-auto min-w-14 border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                SL
              </TableHead>
              <TableHead
                className={cn(
                  'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                M³
              </TableHead>
              <TableHead
                className={cn(
                  'h-auto min-w-16 border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                DRD/Hari
              </TableHead>
              <TableHead
                className={cn(
                  'h-auto min-w-20 border-b border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold',
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
              <TableRow
                key={item.bulan}
                className={cn(
                  'group',
                  !item.sudahAda && 'text-muted-foreground',
                )}
              >
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
                {item.golongan.map((g) => (
                  <Fragment key={g.golKey}>
                    <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(g.sl)}
                    </TableCell>
                    <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(g.totalM3)}
                    </TableCell>
                  </Fragment>
                ))}
                <TableCell className="border-b border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center font-semibold tabular-nums">
                  {formatAngka(item.total.sl)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold tabular-nums">
                  {formatAngka(item.total.totalM3)}
                </TableCell>
                <TableCell className="border-b border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums text-muted-foreground">
                  {formatAngka(item.total.drdPerHari)}
                </TableCell>
                <TableCell className="border-b border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center font-semibold tabular-nums">
                  {formatAngka(item.total.drdPerBulan)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          {data.summary && (
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
                {totalPerGolongan.map((t, idx) => (
                  <Fragment key={golonganLabel[idx]}>
                    <TableCell className="border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(t.sl)}
                    </TableCell>
                    <TableCell className="border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                      {formatAngka(t.m3)}
                    </TableCell>
                  </Fragment>
                ))}
                <TableCell className="border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center tabular-nums">
                  {formatAngka(data.summary.slTerakhir)}
                </TableCell>
                <TableCell className="border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                  {formatAngka(data.summary.totalM3Tahun)}
                </TableCell>
                <TableCell className="border-r border-slate-300 dark:border-slate-600 px-1 py-1.5 text-center tabular-nums">
                  {formatAngka(totalDrdPerHariTahun)}
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center tabular-nums">
                  {formatAngka(data.summary.totalDrdTahun)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}
