import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { type StatusLaporanMandiri } from './types'
import { type LaporanMandiriRow } from './columns'
import { LaporanMandiriExport } from './laporan-mandiri-export'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Filters = {
  search: string
  status: StatusLaporanMandiri | 'SEMUA'
  periode: number | undefined
}

type Props = {
  filters: Filters
  onFiltersChange: (f: Filters) => void
  periodeOptions: { value: number; label: string }[]
  totalRows: number
  isLoading?: boolean
  /**
   * Semua baris HASIL FILTER (bukan cuma 1 halaman tabel, dan bukan cuma
   * baris yang ke-checked) — dipakai oleh tombol Export di sebelah
   * filter Periode. Kalau cuma baris halaman aktif yang dikirim, hasil
   * export jadi cuma sebagian data tanpa ada error apa pun.
   */
  rows: LaporanMandiriRow[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: StatusLaporanMandiri | 'SEMUA'
  label: string
}[] = [
  { value: 'SEMUA', label: 'Semua Status' },
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'DIVERIFIKASI', label: 'Diverifikasi' },
  { value: 'DITOLAK', label: 'Ditolak' },
  { value: 'DIGUNAKAN', label: 'Digunakan' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanMandiriToolbar({
  filters,
  onFiltersChange,
  periodeOptions,
  totalRows,
  isLoading,
  rows,
}: Props) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'SEMUA' ||
    filters.periode !== undefined

  function reset() {
    onFiltersChange({ search: '', status: 'SEMUA', periode: undefined })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-6">
      {/* left: search + filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-[260px]">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            placeholder="No. langganan / nama…"
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="h-9 pl-8 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* divider icon */}
        <SlidersHorizontal className="text-muted-foreground/50 hidden h-3.5 w-3.5 sm:block" />

        {/* status filter */}
        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              status: v as StatusLaporanMandiri | 'SEMUA',
            })
          }
        >
          <SelectTrigger className="h-9 w-[148px] text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* periode filter */}
        <Select
          value={filters.periode?.toString() ?? 'SEMUA'}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              periode: v === 'SEMUA' ? undefined : parseInt(v),
            })
          }
        >
          <SelectTrigger className="h-9 w-[130px] text-sm">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua Periode</SelectItem>
            {periodeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* export — di sebelah filter Periode */}
        <LaporanMandiriExport
          rows={rows}
          periode={filters.periode}
          disabled={isLoading}
          size="sm"
        />

        {/* reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-muted-foreground h-9 gap-1 px-2 text-xs hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* right: total count */}
      <p className="text-muted-foreground shrink-0 text-sm tabular-nums">
        {isLoading ? (
          <span className="bg-muted inline-block h-4 w-20 animate-pulse rounded" />
        ) : (
          <>
            <span className="text-foreground font-semibold">
              {totalRows.toLocaleString('id-ID')}
            </span>{' '}
            laporan
          </>
        )}
      </p>
    </div>
  )
}
