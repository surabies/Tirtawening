import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Gauge, Droplet, History, Droplets } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type StatsData = {
  periodeBerjalan: number
  periodeLalu: number
  jumlahSlTercatat: number
  totalM3Tercatat: number
  jumlahSlLalu: number
  totalM3Lalu: number
}

type Props = {
  data?: StatsData
  isLoading?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriode(periode: number): string {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

/** Selisih % dibanding nilai sebelumnya. Null jika pembanding 0 (hindari div/0). */
function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

// ── Metric Card ───────────────────────────────────────────────────────────────

type MetricCardProps = {
  label: string
  value: number
  suffix?: string
  delta: number | null
  icon: React.ReactNode
  valueClass: string
  bgClass: string
}

function MetricCard({
  label,
  value,
  suffix,
  delta,
  icon,
  valueClass,
  bgClass,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden border shadow-none rounded-sm">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className={`rounded-sm p-1.5 ${bgClass}`}>{icon}</div>

          <div className="text-right">
            <p
              className={`text-2xl font-bold tabular-nums leading-none ${valueClass}`}
            >
              {value.toLocaleString('id-ID')}
              {suffix && (
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {suffix}
                </span>
              )}
            </p>
            {delta !== null && (
              <p
                className={`mt-0.5 text-xs tabular-nums ${
                  delta >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {delta}% vs bulan lalu
              </p>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mt-2 text-[11px] font-semibold uppercase tracking-widest">
          {label}
        </p>
      </CardContent>
    </Card>
  )
}

function MetricCardSkeleton() {
  return (
    <Card className="border shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-9 rounded-sm" />
          <div className="space-y-1 text-right">
            <Skeleton className="ml-auto h-7 w-16" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LaporanHarianStats({ data, isLoading }: Props) {
  const cards = useMemo(() => {
    if (!data) return []

    const deltaSl = calcDelta(data.jumlahSlTercatat, data.jumlahSlLalu)
    const deltaM3 = calcDelta(data.totalM3Tercatat, data.totalM3Lalu)

    return [
      {
        label: `SL Tercatat — ${formatPeriode(data.periodeBerjalan)}`,
        value: data.jumlahSlTercatat,
        delta: deltaSl,
        icon: <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        valueClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950',
      },
      {
        label: `Total m³ Tercatat — ${formatPeriode(data.periodeBerjalan)}`,
        value: data.totalM3Tercatat,
        suffix: 'm³',
        delta: deltaM3,
        icon: <Droplet className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />,
        valueClass: 'text-cyan-600 dark:text-cyan-400',
        bgClass: 'bg-cyan-100 dark:bg-cyan-950',
      },
      {
        label: `SL Tercatat — ${formatPeriode(data.periodeLalu)}`,
        value: data.jumlahSlLalu,
        delta: null,
        icon: (
          <History className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ),
        valueClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
      },
      {
        label: `Total m³ Tercatat — ${formatPeriode(data.periodeLalu)}`,
        value: data.totalM3Lalu,
        suffix: 'm³',
        delta: null,
        icon: (
          <Droplets className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ),
        valueClass: 'text-slate-600 dark:text-slate-400',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
      },
    ]
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  )
}
