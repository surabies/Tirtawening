// src/components/layout/navbar/navbar-filter.tsx
//
// NavbarFilter versi PDAM — tanpa range waktu, dengan:
// - Granularitas: Hari / Bulan / Tahun
// - Sheet Filters: Wilayah, Golongan Tarif, Status Pelanggan, Periode, Status Tagihan

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ClockIcon,
  FilterIcon,
  SparklesIcon,
  XIcon,
  ChevronDownIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ── Tipe ─────────────────────────────────────────────────────────────────────

export type GranularitasOption = 'hari' | 'minggu' | 'bulan' | 'tahun'

export interface PDAMFilter {
  wilayahDistId?: string
  golonganTarif?: GolonganTarif[]
  statusPelanggan?: StatusPelanggan[]
  statusTagihan?: StatusTagihan[]
  periode?: number // YYYYMM
}

// Enum dari schema Prisma — harus sinkron
type GolonganTarif =
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'K1'
  | 'K2'
  | 'K3'
  | 'I1'
  | 'I2'
  | 'I3'
  | 'S1'
  | 'S2'
  | 'S3'

type StatusPelanggan = 'AKTIF' | 'TUTUP_SEMENTARA' | 'TUTUP_SPT'

type StatusTagihan = 'BELUM_BAYAR' | 'SUDAH_BAYAR' | 'JATUH_TEMPO' | 'DIHAPUS'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface NavbarFilterProps {
  onGranularitasChange?: (g: GranularitasOption) => void
  onFilterChange?: (filter: PDAMFilter) => void
  /** Data wilayah dari tRPC — opsional, diisi dari halaman */
  wilayahOptions?: { id: string; nama: string }[]
}

// ── Konstanta ─────────────────────────────────────────────────────────────────

const GRANULARITAS_OPTIONS: { value: GranularitasOption; label: string }[] = [
  { value: 'hari', label: 'Hari' },
  { value: 'minggu', label: 'Minggu' },
  { value: 'bulan', label: 'Bulan' },
  { value: 'tahun', label: 'Tahun' },
]

const GOLONGAN_OPTIONS: { value: GolonganTarif; label: string }[] = [
  { value: 'R1', label: 'R1 — Rumah Tangga Kecil' },
  { value: 'R2', label: 'R2 — Rumah Tangga Menengah' },
  { value: 'R3', label: 'R3 — Rumah Tangga Besar' },
  { value: 'R4', label: 'R4 — Rumah Tangga Mewah' },
  { value: 'K1', label: 'K1 — Niaga Kecil' },
  { value: 'K2', label: 'K2 — Niaga Menengah' },
  { value: 'K3', label: 'K3 — Niaga Besar' },
  { value: 'I1', label: 'I1 — Industri Kecil' },
  { value: 'I2', label: 'I2 — Industri Menengah' },
  { value: 'I3', label: 'I3 — Industri Besar' },
  { value: 'S1', label: 'S1 — Sosial Umum' },
  { value: 'S2', label: 'S2 — Sosial Khusus' },
  { value: 'S3', label: 'S3 — Instansi Pemerintah' },
]

const STATUS_PELANGGAN_OPTIONS: { value: StatusPelanggan; label: string }[] = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'TUTUP_SEMENTARA', label: 'Tutup Sementara' },
  { value: 'TUTUP_SPT', label: 'Tutup SPT' },
]

const STATUS_TAGIHAN_OPTIONS: { value: StatusTagihan; label: string }[] = [
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'SUDAH_BAYAR', label: 'Sudah Bayar' },
  { value: 'JATUH_TEMPO', label: 'Jatuh Tempo' },
  { value: 'DIHAPUS', label: 'Dihapus' },
]

// ── Helper periode ────────────────────────────────────────────────────────────

const BULAN_LABEL = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function periodeLabel(yyyymm: number): string {
  const bulan = yyyymm % 100
  const tahun = Math.floor(yyyymm / 100)
  return `${BULAN_LABEL[bulan]} ${tahun}`
}

function currentPeriode(): number {
  const now = new Date()
  return now.getFullYear() * 100 + (now.getMonth() + 1)
}

function periodeOptions(): number[] {
  const cur = currentPeriode()
  return Array.from({ length: 12 }, (_, i) => {
    let m = (cur % 100) - i
    let y = Math.floor(cur / 100)
    while (m <= 0) {
      m += 12
      y -= 1
    }
    return y * 100 + m
  })
}

// ── FilterPill dengan forwardRef ──────────────────────────────────────────────

const FilterPill = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode
    active?: boolean
  }
>(({ icon, children, className, active, ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant={active ? 'default' : 'outline'}
    size="sm"
    className={cn(
      'flex shrink-0 items-center gap-2 font-medium transition-colors',
      active && 'border-foreground',
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </Button>
))
FilterPill.displayName = 'FilterPill'

// ── Komponen utama ────────────────────────────────────────────────────────────

export function NavbarFilter({
  onGranularitasChange,
  onFilterChange,
  wilayahOptions = [],
}: NavbarFilterProps) {
  const [granularitas, setGranularitas] = useState<GranularitasOption>('bulan')
  const [filterOpen, setFilterOpen] = useState(false)

  // State filter aktif
  const [filter, setFilterState] = useState<PDAMFilter>({})

  // Hitung jumlah filter aktif untuk badge
  const activeFilterCount = [
    filter.wilayahDistId,
    filter.golonganTarif?.length,
    filter.statusPelanggan?.length,
    filter.statusTagihan?.length,
    filter.periode,
  ].filter(Boolean).length

  function updateFilter(partial: Partial<PDAMFilter>) {
    const next = { ...filter, ...partial }
    setFilterState(next)
    onFilterChange?.(next)
  }

  function toggleArray<T>(arr: T[] | undefined, val: T): T[] {
    if (!arr) return [val]
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  function resetFilter() {
    setFilterState({})
    onFilterChange?.({})
  }

  return (
    <>
      <div className="flex flex-1 items-center gap-1.5 p-2">
        {/* ── Granularitas ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterPill icon={<ClockIcon className="h-3.5 w-3.5" />}>
              {
                GRANULARITAS_OPTIONS.find((g) => g.value === granularitas)
                  ?.label
              }
              <ChevronDownIcon className="h-3 w-3 opacity-50" />
            </FilterPill>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Tampilkan per</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {GRANULARITAS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => {
                  setGranularitas(opt.value)
                  onGranularitasChange?.(opt.value)
                }}
                className={cn(granularitas === opt.value && 'font-medium')}
              >
                <span
                  className={cn(
                    'mr-2 h-1.5 w-1.5 rounded-full shrink-0',
                    granularitas === opt.value
                      ? 'bg-foreground'
                      : 'bg-transparent',
                  )}
                />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Periode ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterPill
              icon={<SparklesIcon className="h-3.5 w-3.5" />}
              active={!!filter.periode}
            >
              {filter.periode ? periodeLabel(filter.periode) : 'Periode'}
              <ChevronDownIcon className="h-3 w-3 opacity-50" />
            </FilterPill>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Pilih Periode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => updateFilter({ periode: undefined })}
              className={cn(!filter.periode && 'font-medium')}
            >
              <span
                className={cn(
                  'mr-2 h-1.5 w-1.5 rounded-full shrink-0',
                  !filter.periode ? 'bg-foreground' : 'bg-transparent',
                )}
              />
              Semua periode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {periodeOptions().map((p) => (
              <DropdownMenuItem
                key={p}
                onSelect={() => updateFilter({ periode: p })}
                className={cn(filter.periode === p && 'font-medium')}
              >
                <span
                  className={cn(
                    'mr-2 h-1.5 w-1.5 rounded-full shrink-0',
                    filter.periode === p ? 'bg-foreground' : 'bg-transparent',
                  )}
                />
                {periodeLabel(p)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Filter popover ── */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <FilterPill
              icon={<FilterIcon className="h-3.5 w-3.5" />}
              active={activeFilterCount > 0}
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </FilterPill>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-80 p-0 flex flex-col gap-0 max-h-[min(480px,calc(100vh-80px))] overflow-hidden shadow-lg"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
              <p className="text-sm font-semibold">Filter</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilter}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset semua
                </button>
              )}
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
              {/* ── Wilayah ── */}
              {wilayahOptions.length > 0 && (
                <FilterSection title="Wilayah">
                  <div className="flex flex-wrap gap-1.5">
                    {wilayahOptions.map((w) => (
                      <OptionChip
                        key={w.id}
                        active={filter.wilayahDistId === w.id}
                        onClick={() =>
                          updateFilter({
                            wilayahDistId:
                              filter.wilayahDistId === w.id ? undefined : w.id,
                          })
                        }
                      >
                        {w.nama}
                      </OptionChip>
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* ── Golongan Tarif ── */}
              <FilterSection title="Golongan Tarif">
                <div className="flex flex-wrap gap-1.5">
                  {GOLONGAN_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      active={
                        filter.golonganTarif?.includes(opt.value) ?? false
                      }
                      onClick={() =>
                        updateFilter({
                          golonganTarif: toggleArray(
                            filter.golonganTarif,
                            opt.value,
                          ),
                        })
                      }
                    >
                      {opt.value}
                    </OptionChip>
                  ))}
                </div>
              </FilterSection>

              {/* ── Status Pelanggan ── */}
              <FilterSection title="Status Pelanggan">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_PELANGGAN_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      active={
                        filter.statusPelanggan?.includes(opt.value) ?? false
                      }
                      onClick={() =>
                        updateFilter({
                          statusPelanggan: toggleArray(
                            filter.statusPelanggan,
                            opt.value,
                          ),
                        })
                      }
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </FilterSection>

              {/* ── Status Tagihan ── */}
              <FilterSection title="Status Tagihan">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_TAGIHAN_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      active={
                        filter.statusTagihan?.includes(opt.value) ?? false
                      }
                      onClick={() =>
                        updateFilter({
                          statusTagihan: toggleArray(
                            filter.statusTagihan,
                            opt.value,
                          ),
                        })
                      }
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border p-3">
              <Button
                className="w-full"
                size="sm"
                onClick={() => setFilterOpen(false)}
              >
                Terapkan Filter
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset — hanya tampil kalau ada filter aktif */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilter}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="h-3 w-3" />
            Reset
          </button>
        )}

        <div className="flex-1" />

        {/* Badge filter aktif di kanan */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1 flex-wrap max-w-xs">
            {filter.golonganTarif?.map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 cursor-pointer"
                onClick={() =>
                  updateFilter({
                    golonganTarif: toggleArray(filter.golonganTarif, g),
                  })
                }
              >
                {g} <XIcon className="ml-1 h-2.5 w-2.5" />
              </Badge>
            ))}
            {filter.statusPelanggan?.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 cursor-pointer"
                onClick={() =>
                  updateFilter({
                    statusPelanggan: toggleArray(filter.statusPelanggan, s),
                  })
                }
              >
                {STATUS_PELANGGAN_OPTIONS.find((o) => o.value === s)?.label}
                <XIcon className="ml-1 h-2.5 w-2.5" />
              </Badge>
            ))}
            {filter.statusTagihan?.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 cursor-pointer"
                onClick={() =>
                  updateFilter({
                    statusTagihan: toggleArray(filter.statusTagihan, s),
                  })
                }
              >
                {STATUS_TAGIHAN_OPTIONS.find((o) => o.value === s)?.label}
                <XIcon className="ml-1 h-2.5 w-2.5" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-komponen ──────────────────────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

function OptionChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'bg-foreground text-background border-foreground font-medium'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
