// src/components/features/drd/drd-target-card.tsx
//
// Card ringkasan target vs realisasi tahunan, konsumsi
// trpc.drd.target.targetVsRealisasi.

'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

const formatAngka = (n: number) => new Intl.NumberFormat('id-ID').format(n)

interface DrdTargetCardProps {
  tahun?: number
}

export function DrdTargetCard({
  tahun = new Date().getFullYear(),
}: DrdTargetCardProps) {
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.target.targetVsRealisasi.queryOptions({ tahun }),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target vs Realisasi m³ — {tahun}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Gagal memuat data TARGET WP 5.
          </p>
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Realisasi</p>
                <p className="text-2xl font-bold">
                  {formatAngka(data.summary.totalRealisasiM3)} m³
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">
                  {formatAngka(data.summary.totalTargetM3)} m³
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capaian</span>
                <span
                  className={`font-medium ${
                    data.summary.capaianM3 !== null &&
                    data.summary.capaianM3 < 100
                      ? 'text-destructive'
                      : 'text-emerald-600'
                  }`}
                >
                  {data.summary.capaianM3 !== null
                    ? `${data.summary.capaianM3}%`
                    : '—'}
                </span>
              </div>
              <Progress
                value={
                  data.summary.capaianM3 !== null
                    ? Math.min(data.summary.capaianM3, 100)
                    : 0
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
