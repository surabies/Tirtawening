'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { PencatatKpiCard } from './pencatat-kpi-card'
import { Skeleton } from '@/components/ui/skeleton'

const PERIODE = new Date().getFullYear() * 100 + (new Date().getMonth() + 1)
const TARGET_SL = 2500

export function PencatatKpiGrid() {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.pencatatKpi.list.queryOptions({ periode: PERIODE, targetSl: TARGET_SL }),
  )

  if (isError) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive">Gagal memuat data KPI pencatat.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Tidak ada data pencatat untuk periode ini.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((kpi) => (
        <PencatatKpiCard key={kpi.pencatat.id} data={kpi} />
      ))}
    </div>
  )
}