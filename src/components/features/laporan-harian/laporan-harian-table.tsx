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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  KATEGORI_STYLES,
  resolveKategoriTanggal,
  resolveLabelTanggal,
} from './laporan-harian-kategori'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function buildPeriodeOptions(bulanTerakhir = 12) {
  const now = new Date()
  const opts: { value: number; label: string }[] = []
  for (let i = 0; i < bulanTerakhir; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyymm = d.getFullYear() * 100 + (d.getMonth() + 1)
    opts.push({
      value: yyyymm,
      label: `${NAMA_BULAN[d.getMonth() + 1]} ${d.getFullYear()}`,
    })
  }
  return opts
}

function formatPeriodeLabel(periode: number): string {
  const month = periode % 100
  const year = Math.floor(periode / 100)
  return `${NAMA_BULAN[month]} ${year}`
}

function formatAngka(n: number): string {
  return n.toLocaleString('id-ID')
}

// ── KPI Calculator ────────────────────────────────────────────────────────────

type KpiData = {
  totalCatat: number
  totalTarget: number
  persenCapai: number
  totalHariKerja: number
  hariKerjaTerlewat: number
  hariKerjaSisa: number
  rataRataHarian: number
  proyeksiAkhirBulan: number
  isOnTrack: boolean
  isPeriodeBerjalan: boolean
}

type MatrixData = {
  periode: number
  jumlahHari: number
  hariInfo: {
    tanggal: number
    isHariKerja: boolean
    isWeekend: boolean
    liburNasional: string | null
  }[]
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
}

type PaceStatus = 'on-track' | 'at-risk' | 'behind' | 'selesai'

function hitungKpi(data: MatrixData, periode: number): KpiData {
  const now = new Date()
  const year = Math.floor(periode / 100)
  const month = periode % 100

  const isPeriodeBerjalan =
    now.getFullYear() === year && now.getMonth() + 1 === month

  let totalHariKerja = 0
  let hariKerjaTerlewat = 0
  const hariIni = now.getDate()

  for (const h of data.hariInfo) {
    if (h.isHariKerja) {
      totalHariKerja++
      if (!isPeriodeBerjalan || h.tanggal <= hariIni) {
        hariKerjaTerlewat++
      }
    }
  }

  const hariKerjaSisa = totalHariKerja - hariKerjaTerlewat
  const totalCatat = data.total.totalCatat
  const totalTarget = data.total.target
  const rataRataHarian =
    hariKerjaTerlewat > 0 ? totalCatat / hariKerjaTerlewat : 0
  const proyeksiAkhirBulan = Math.round(
    totalCatat + rataRataHarian * hariKerjaSisa,
  )
  const persenCapai =
    totalTarget > 0 ? Math.min((totalCatat / totalTarget) * 100, 100) : 0
  const isOnTrack = proyeksiAkhirBulan >= totalTarget * 0.98

  return {
    totalCatat,
    totalTarget,
    persenCapai,
    totalHariKerja,
    hariKerjaTerlewat,
    hariKerjaSisa,
    rataRataHarian,
    proyeksiAkhirBulan,
    isOnTrack,
    isPeriodeBerjalan,
  }
}

function hitungPacePertugas(
  row: MatrixData['items'][number],
  kpi: KpiData,
): {
  status: PaceStatus
  persen: number
  proyeksi: number
  rataRata: number
} {
  const persen =
    row.target > 0 ? Math.min((row.totalCatat / row.target) * 100, 100) : 0

  if (row.target === 0 || row.totalCatat >= row.target) {
    return {
      status: 'selesai',
      persen: 100,
      proyeksi: row.totalCatat,
      rataRata: 0,
    }
  }

  const rataRata =
    kpi.hariKerjaTerlewat > 0 ? row.totalCatat / kpi.hariKerjaTerlewat : 0
  const proyeksi = Math.round(row.totalCatat + rataRata * kpi.hariKerjaSisa)

  const rasioProyeksi = row.target > 0 ? proyeksi / row.target : 0
  let status: PaceStatus
  if (rasioProyeksi >= 0.98) status = 'on-track'
  else if (rasioProyeksi >= 0.9) status = 'at-risk'
  else status = 'behind'

  return { status, persen, proyeksi, rataRata }
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

        <div className="flex items-center gap-3">
          <KategoriLegend />
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
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada data pencatatan untuk periode {formatPeriodeLabel(periode)}.
        </div>
      ) : (
        <>
          <SummaryCards data={data} periode={periode} />
          <MatrixTable data={data} periode={periode} />
        </>
      )}
    </div>
  )
}

// ── Legend kategori ───────────────────────────────────────────────────────────

function KategoriLegend() {
  return (
    <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
      {Object.values(KATEGORI_STYLES).map((k) => (
        <span key={k.label} className="flex items-center gap-1.5">
          <span
            className={cn('size-2.5 rounded-full', k.headerClassName)}
            aria-hidden
          />
          {k.label}
        </span>
      ))}
    </div>
  )
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({
  data,
  periode,
}: {
  data: MatrixData
  periode: number
}) {
  const kpi = hitungKpi(data, periode)

  const cards = [
    {
      label: 'Total Tercatat',
      value: formatAngka(kpi.totalCatat),
      sub: `dari ${formatAngka(kpi.totalTarget)} target`,
      color: 'text-foreground',
    },
    {
      label: 'Pencapaian',
      value: `${kpi.persenCapai.toFixed(1)}%`,
      sub: kpi.isPeriodeBerjalan
        ? `rata-rata ${Math.round(kpi.rataRataHarian)}/hari kerja`
        : 'periode selesai',
      color:
        kpi.persenCapai >= 95
          ? 'text-emerald-600 dark:text-emerald-400'
          : kpi.persenCapai >= 80
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-destructive',
    },
    {
      label: 'Sisa Hari Kerja',
      value: kpi.isPeriodeBerjalan ? `${kpi.hariKerjaSisa} hari` : '—',
      sub: kpi.isPeriodeBerjalan
        ? `dari ${kpi.totalHariKerja} hari kerja bulan ini`
        : `total ${kpi.totalHariKerja} hari kerja`,
      color: 'text-foreground',
    },
    {
      label: kpi.isPeriodeBerjalan ? 'Proyeksi Akhir Bulan' : 'Realisasi Akhir',
      value: kpi.isPeriodeBerjalan
        ? formatAngka(kpi.proyeksiAkhirBulan)
        : formatAngka(kpi.totalCatat),
      sub: kpi.isPeriodeBerjalan
        ? kpi.isOnTrack
          ? '✓ Diperkirakan selesai tepat waktu'
          : `⚠ Kurang ~${formatAngka(kpi.totalTarget - kpi.proyeksiAkhirBulan)} dari target`
        : kpi.totalCatat >= kpi.totalTarget
          ? '✓ Target tercapai'
          : `✗ Kurang ${formatAngka(kpi.totalTarget - kpi.totalCatat)} dari target`,
      color: kpi.isPeriodeBerjalan
        ? kpi.isOnTrack
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-destructive'
        : kpi.totalCatat >= kpi.totalTarget
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-destructive',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
        >
          <span className="text-xs text-muted-foreground">{card.label}</span>
          <span className={cn('text-xl font-bold tabular-nums', card.color)}>
            {card.value}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Matrix table itself ──────────────────────────────────────────────────────

function MatrixTable({ data, periode }: { data: MatrixData; periode: number }) {
  const COL_NO_WIDTH = 'w-9 min-w-9 max-w-9'
  const COL_NAMA_WIDTH = 'w-[136px] min-w-[136px] max-w-[136px]'
  const COL_NAMA_LEFT = 'left-9'
  const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
  const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'
  const STICKY_DIVIDER = 'shadow-[2px_0_0_0_hsl(var(--border))]'

  const kpi = hitungKpi(data, periode)

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className={cn(
                  'sticky left-0 z-20 h-auto border-b border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  STICKY_DIVIDER,
                  COL_NO_WIDTH,
                )}
              >
                No
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'sticky z-20 h-auto border-b border-border px-3 py-2 text-left font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  STICKY_DIVIDER,
                  COL_NAMA_WIDTH,
                  COL_NAMA_LEFT,
                )}
              >
                Nama Cater
              </TableHead>
              <TableHead
                colSpan={data.jumlahHari}
                className={cn(
                  'h-auto border-b border-r border-border py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                )}
              >
                Tanggal
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-20 border-b border-r border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Total Catat
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-17.5 border-b border-r border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Target
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-30 border-b border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Progres
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {data.hariInfo.map((h) => {
                const kategori = resolveKategoriTanggal(
                  periode,
                  h.tanggal,
                  h.isHariKerja,
                  h.liburNasional,
                )
                const style = KATEGORI_STYLES[kategori]
                const label = resolveLabelTanggal(kategori, h.liburNasional)
                return (
                  <TableHead
                    key={h.tanggal}
                    title={label}
                    className={cn(
                      'h-auto min-w-8.5 border-b border-r border-border px-1 py-1.5 text-center font-semibold',
                      style.headerClassName,
                      style.headerTextClassName,
                    )}
                  >
                    {h.tanggal}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.items.map((row, idx) => {
              const pace = hitungPacePertugas(row, kpi)
              return (
                <TableRow key={row.pencatatId} className="group">
                  <TableCell
                    className={cn(
                      'sticky left-0 z-10 truncate border-b border-border bg-card px-2 py-1.5 text-center tabular-nums group-hover:bg-muted/40',
                      STICKY_DIVIDER,
                      COL_NO_WIDTH,
                    )}
                  >
                    {idx + 1}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'sticky z-10 truncate border-b border-border bg-card px-3 py-1.5 font-medium uppercase group-hover:bg-muted/40',
                      STICKY_DIVIDER,
                      COL_NAMA_WIDTH,
                      COL_NAMA_LEFT,
                    )}
                    title={row.namaPetugas}
                  >
                    {row.namaPetugas}
                  </TableCell>
                  {row.harian.map((value, i) => {
                    const hari = data.hariInfo[i]
                    const isKosongDiHariKerja = value === 0 && hari?.isHariKerja
                    return (
                      <TableCell
                        key={i}
                        className={cn(
                          'border-b border-r border-border px-1 py-1.5 text-center tabular-nums',
                          isKosongDiHariKerja
                            ? 'bg-destructive/10 text-muted-foreground'
                            : 'text-foreground',
                        )}
                      >
                        {value}
                      </TableCell>
                    )
                  })}
                  <TableCell className="border-b border-r border-border px-2 py-1.5 text-center font-semibold tabular-nums">
                    {formatAngka(row.totalCatat)}
                  </TableCell>
                  <TableCell className="border-b border-r border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                    {formatAngka(row.target)}
                  </TableCell>

                  <TableCell className="border-b border-border px-2 py-1.5">
                    <PaceCell
                      pace={pace}
                      isPeriodeBerjalan={kpi.isPeriodeBerjalan}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>

          <TableFooter>
            <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
              <TableCell
                className={cn(
                  'sticky left-0 z-10 border-b border-border bg-muted px-2 py-1.5 text-center',
                  STICKY_DIVIDER,
                  COL_NO_WIDTH,
                )}
                aria-hidden
              />
              <TableCell
                className={cn(
                  'sticky z-10 border-b border-border bg-muted px-3 py-1.5 text-left',
                  STICKY_DIVIDER,
                  COL_NAMA_WIDTH,
                  COL_NAMA_LEFT,
                )}
              >
                Total
              </TableCell>
              {data.total.harian.map((value, i) => (
                <TableCell
                  key={i}
                  className="border-r border-border px-1 py-1.5 text-center tabular-nums"
                >
                  {formatAngka(value)}
                </TableCell>
              ))}
              <TableCell className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {formatAngka(data.total.totalCatat)}
              </TableCell>
              <TableCell className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {formatAngka(data.total.target)}
              </TableCell>
              <TableCell className="border-border px-2 py-1.5">
                <PaceCell
                  pace={hitungPacePertugas(
                    {
                      pencatatId: '_total',
                      namaPetugas: 'Total',
                      harian: data.total.harian,
                      totalCatat: data.total.totalCatat,
                      target: data.total.target,
                      selisih: data.total.selisih,
                    },
                    kpi,
                  )}
                  isPeriodeBerjalan={kpi.isPeriodeBerjalan}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

// ── Pace Cell ─────────────────────────────────────────────────────────────────

const PACE_CONFIG: Record<
  PaceStatus,
  { label: string; barColor: string; badgeClass: string }
> = {
  'on-track': {
    label: 'On Track',
    barColor: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  'at-risk': {
    label: 'At Risk',
    barColor: 'bg-amber-500',
    badgeClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  behind: {
    label: 'Behind',
    barColor: 'bg-destructive',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
  selesai: {
    label: 'Selesai',
    barColor: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
}

function PaceCell({
  pace,
  isPeriodeBerjalan,
}: {
  pace: ReturnType<typeof hitungPacePertugas>
  isPeriodeBerjalan: boolean
}) {
  const cfg = PACE_CONFIG[pace.status]

  const tooltipText = isPeriodeBerjalan
    ? `Proyeksi akhir bulan: ${formatAngka(pace.proyeksi)} | Rata-rata: ${Math.round(pace.rataRata)}/hari kerja`
    : undefined

  return (
    <div className="flex min-w-27.5 flex-col gap-1" title={tooltipText}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', cfg.barColor)}
          style={{ width: `${pace.persen}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="tabular-nums text-muted-foreground">
          {pace.persen.toFixed(0)}%
        </span>
        {isPeriodeBerjalan && (
          <span
            className={cn(
              'rounded px-1 py-0.5 text-[10px] font-semibold leading-none',
              cfg.badgeClass,
            )}
          >
            {cfg.label}
          </span>
        )}
      </div>
    </div>
  )
}
