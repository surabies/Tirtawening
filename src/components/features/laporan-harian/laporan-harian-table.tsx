import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPeriodeOptions(bulanTerakhir = 12) {
  const BULAN = [
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
  const now = new Date()
  const opts: { value: number; label: string }[] = []
  for (let i = 0; i < bulanTerakhir; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyymm = d.getFullYear() * 100 + (d.getMonth() + 1)
    opts.push({
      value: yyyymm,
      label: `${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`,
    })
  }
  return opts
}

function formatPeriodeLabel(periode: number): string {
  const BULAN = [
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
  const month = periode % 100
  const year = Math.floor(periode / 100)
  return `${BULAN[month]} ${year}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanHarianMatrixTable() {
  const trpc = useTRPC()
  const periodeOptions = buildPeriodeOptions(12)
  const [periode, setPeriode] = useState<number>(periodeOptions[0].value)

  const { data, isLoading } = useQuery(
    trpc.laporanHarian.matrix.queryOptions({ periode }),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Laporan Periode Cater Per Tanggal
        </h3>

        <Select
          value={periode.toString()}
          onValueChange={(v) => setPeriode(parseInt(v))}
        >
          <SelectTrigger className="h-9 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-sm" />
      ) : !data || data.items.length === 0 ? (
        <div className="text-muted-foreground flex h-32 items-center justify-center rounded-sm border border-border text-sm">
          Belum ada data pencatatan untuk periode {formatPeriodeLabel(periode)}.
        </div>
      ) : (
        <MatrixTable data={data} />
      )}
    </div>
  )
}

// ── Matrix table itself ──────────────────────────────────────────────────────

type MatrixData = NonNullable<
  ReturnType<
    typeof useQuery<{
      periode: number
      jumlahHari: number
      hariInfo: { tanggal: number; isHariKerja: boolean }[]
      items: {
        pencatatId: string
        namaPetugas: string
        harian: number[]
        totalCatat: number
        target: number
        selisih: number
      }[]
      total: {
        harian: number[]
        totalCatat: number
        target: number
        selisih: number
      }
    }>
  >['data']
>

function MatrixTable({ data }: { data: MatrixData }) {
  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Baris judul kolom Tanggal */}
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-10 w-10 border-b border-r border-border bg-blue-600 px-2 py-2 text-center font-semibold text-white"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="sticky left-10 z-10 min-w-[140px] border-b border-r border-border bg-blue-600 px-3 py-2 text-left font-semibold text-white"
              >
                Nama Cater
              </th>
              <th
                colSpan={data.jumlahHari}
                className="border-b border-r border-border bg-blue-600 py-1.5 text-center font-semibold text-white"
              >
                Tanggal
              </th>
              <th
                rowSpan={2}
                className="min-w-[80px] border-b border-r border-border bg-blue-700 px-2 py-2 text-center font-semibold text-white"
              >
                Total Catat
              </th>
              <th
                rowSpan={2}
                className="min-w-[70px] border-b border-r border-border bg-blue-700 px-2 py-2 text-center font-semibold text-white"
              >
                Target
              </th>
              <th
                rowSpan={2}
                className="min-w-[70px] border-b border-border bg-blue-700 px-2 py-2 text-center font-semibold text-white"
              >
                Selisih
              </th>
            </tr>
            <tr>
              {data.hariInfo.map((h) => (
                <th
                  key={h.tanggal}
                  className={cn(
                    'min-w-[34px] border-b border-r border-border px-1 py-1.5 text-center font-semibold text-white',
                    h.isHariKerja ? 'bg-emerald-600' : 'bg-red-600',
                  )}
                >
                  {h.tanggal}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.items.map((row, idx) => (
              <tr key={row.pencatatId} className="hover:bg-muted/30">
                <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-2 py-1.5 text-center tabular-nums">
                  {idx + 1}
                </td>
                <td className="sticky left-10 z-10 border-b border-r border-border bg-card px-3 py-1.5 font-medium uppercase">
                  {row.namaPetugas}
                </td>
                {row.harian.map((value, i) => (
                  <td
                    key={i}
                    className={cn(
                      'border-b border-r border-border px-1 py-1.5 text-center tabular-nums',
                      value === 0 &&
                        data.hariInfo[i]?.isHariKerja &&
                        'bg-red-50 text-muted-foreground dark:bg-red-950/20',
                    )}
                  >
                    {value}
                  </td>
                ))}
                <td className="border-b border-r border-border px-2 py-1.5 text-center font-semibold tabular-nums">
                  {row.totalCatat.toLocaleString('id-ID')}
                </td>
                <td className="border-b border-r border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                  {row.target.toLocaleString('id-ID')}
                </td>
                <td
                  className={cn(
                    'border-b border-border px-2 py-1.5 text-center font-semibold tabular-nums',
                    row.selisih > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {row.selisih.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td
                colSpan={2}
                className="sticky left-0 z-10 border-r border-border bg-muted/80 px-3 py-1.5 text-center"
              >
                Total
              </td>
              {data.total.harian.map((value, i) => (
                <td
                  key={i}
                  className="border-r border-border px-1 py-1.5 text-center tabular-nums"
                >
                  {value.toLocaleString('id-ID')}
                </td>
              ))}
              <td className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {data.total.totalCatat.toLocaleString('id-ID')}
              </td>
              <td className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {data.total.target.toLocaleString('id-ID')}
              </td>
              <td className="px-2 py-1.5 text-center tabular-nums text-red-600 dark:text-red-400">
                {data.total.selisih.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
