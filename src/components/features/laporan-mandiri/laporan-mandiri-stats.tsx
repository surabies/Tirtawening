import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, CheckCircle, XCircle, Zap } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type StatsData = {
  total: number
  menunggu: number
  diverifikasi: number
  ditolak: number
  digunakan: number
}

type Props = {
  data?: StatsData
  isLoading?: boolean
}

// ── Metric Card ───────────────────────────────────────────────────────────────

type MetricCardProps = {
  label: string
  value: number
  total: number
  icon: React.ReactNode
  valueClass: string // e.g. "text-amber-600 dark:text-amber-400"
  barClass: string // e.g. "bg-amber-500"
  bgClass: string // e.g. "bg-amber-100 dark:bg-amber-950"
}

function MetricCard({
  label,
  value,
  total,
  icon,
  valueClass,
  barClass,
  bgClass,
}: MetricCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <Card className="relative overflow-hidden border shadow-none rounded-sm">
      {/* 1. MENGUBAH PADDING: px-4 untuk kanan-kiri tetap aman, py-3 untuk menipiskan atas-bawah */}
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Icon - Sedikit dikecilkan padding internalnya dari p-2 ke p-1.5 */}
          <div className={`rounded-sm p-1.5 ${bgClass}`}>{icon}</div>

          {/* Value block — right aligned */}
          <div className="text-right">
            <p
              className={`text-2xl font-bold tabular-nums leading-none ${valueClass}`}
            >
              {value.toLocaleString('id-ID')}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
              {pct}%
            </p>
          </div>
        </div>

        {/* 2. MENGURANGI MARGIN LABEL: mt-3 diganti ke mt-2 agar lebih merapat ke atas */}
        <p className="text-muted-foreground mt-2 text-[11px] font-semibold uppercase tracking-widest">
          {label}
        </p>

        {/* 3. MENGURANGI MARGIN PROGRESS BAR: mt-2 diganti ke mt-1.5 */}
        <div className="bg-muted mt-1.5 h-1 w-full overflow-hidden rounded-sm">
          <div
            className={`h-full rounded-sm transition-all duration-700 ${barClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
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
            <Skeleton className="ml-auto h-7 w-10" />
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-20" />
        <Skeleton className="mt-2 h-1 w-full" />
      </CardContent>
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LaporanMandiriStats({ data, isLoading }: Props) {
  const cards = useMemo(() => {
    if (!data) return []
    return [
      {
        label: 'Menunggu',
        value: data.menunggu,
        total: data.total,
        icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        valueClass: 'text-amber-600 dark:text-amber-400',
        barClass: 'bg-amber-500',
        bgClass: 'bg-amber-100 dark:bg-amber-950',
      },
      {
        label: 'Diverifikasi',
        value: data.diverifikasi,
        total: data.total,
        icon: (
          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ),
        valueClass: 'text-blue-600 dark:text-blue-400',
        barClass: 'bg-blue-500',
        bgClass: 'bg-blue-100 dark:bg-blue-950',
      },
      {
        label: 'Ditolak',
        value: data.ditolak,
        total: data.total,
        icon: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
        valueClass: 'text-red-600 dark:text-red-400',
        barClass: 'bg-red-500',
        bgClass: 'bg-red-100 dark:bg-red-950',
      },
      {
        label: 'Digunakan',
        value: data.digunakan,
        total: data.total,
        icon: (
          <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ),
        valueClass: 'text-emerald-600 dark:text-emerald-400',
        barClass: 'bg-emerald-500',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950',
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
