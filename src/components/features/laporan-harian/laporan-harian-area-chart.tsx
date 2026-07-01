import { useQuery } from '@tanstack/react-query'
import { BarChart } from '@/components/charts/bar-chart'
import { Bar } from '@/components/charts/bar'
import { BarXAxis } from '@/components/charts/bar-x-axis'
import { Grid } from '@/components/charts/grid'
import { ChartTooltip } from '@/components/charts/tooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTRPC } from '@/integrations/trpc/react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LaporanHarianAreaChartDatum = {
  label: string
  tanggal: number
  total: number
  target: number
}

export type LaporanHarianAreaChartData = LaporanHarianAreaChartDatum[]

// ---------------------------------------------------------------------------
// Data builder
// ---------------------------------------------------------------------------

export function buildAreaChartData(data: {
  jumlahHari: number
  hariInfo: Array<{
    tanggal: number
    isHariKerja: boolean
    isWeekend: boolean
    liburNasional: string | null
  }>
  total: {
    harian: number[]
    target: number
  }
}): LaporanHarianAreaChartData {
  return data.hariInfo.map((hari, index) => ({
    label: String(hari.tanggal),
    tanggal: hari.tanggal,
    total: data.total.harian[index] ?? 0,
    target:
      data.total.target > 0
        ? Math.round(data.total.target / data.jumlahHari)
        : 0,
  }))
}

// ---------------------------------------------------------------------------
// Warna pakai token shadcn CSS vars agar responsif terhadap light/dark theme
// ---------------------------------------------------------------------------
const COLOR_TOTAL = 'var(--chart-1)'
const COLOR_TARGET = 'var(--chart-2)'
const GRID_COLOR = 'var(--border)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LaporanHarianAreaChart({
  data: dataProp,
  isLoading = false,
  isError = false,
  periode = new Date().getFullYear() * 100 + (new Date().getMonth() + 1),
}: {
  data?: {
    jumlahHari: number
    hariInfo: Array<{
      tanggal: number
      isHariKerja: boolean
      isWeekend: boolean
      liburNasional: string | null
    }>
    total: {
      harian: number[]
      target: number
    }
  } | null
  isLoading?: boolean
  isError?: boolean
  periode?: number
}) {
  const trpc = useTRPC()
  const {
    data: queriedData,
    isLoading: isQueryLoading,
    isError: isQueryError,
  } = useQuery({
    ...trpc.laporanHarian.matrix.queryOptions({ periode }),
    enabled: !dataProp,
  })

  const data = dataProp ?? queriedData
  const chartData = data ? buildAreaChartData(data) : []
  const isLoadingState = isLoading || (!dataProp && isQueryLoading)
  const isErrorState = isError || (!dataProp && isQueryError)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-0 pt-4 px-5">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">
            Tren Pencatatan Harian
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visualisasi total pencatatan per tanggal dalam periode yang dipilih.
          </p>
        </div>

        {/* Legend — gunakan inline style agar warnanya ikut CSS var shadcn */}
        <div className="flex shrink-0 items-center gap-4 pt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_TOTAL }}
            />
            Total Catat
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_TARGET }}
            />
            Target
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 pt-3">
        {isErrorState ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-destructive">
              Gagal memuat data tren pencatatan harian.
            </p>
          </div>
        ) : (
          <BarChart
            data={chartData}
            xDataKey="label"
            status={isLoadingState ? 'loading' : 'ready'}
            aspectRatio="7 / 1"
            barGap={0.25}
            margin={{ top: 16, right: 8, bottom: 20, left: 8 }}
          >
            <Grid horizontal stroke={GRID_COLOR} strokeOpacity={0.7} />
            <Bar
              dataKey="target"
              fill={COLOR_TARGET}
              stroke={COLOR_TARGET}
              lineCap={3}
              animationType="grow"
            />
            <Bar
              dataKey="total"
              fill={COLOR_TOTAL}
              stroke={COLOR_TOTAL}
              lineCap={3}
              animationType="grow"
            />
            <BarXAxis maxLabels={31} />
            <ChartTooltip
              backgroundColor="hsl(var(--card))"
              panelStyle={{
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 10px 30px -12px hsl(var(--foreground) / 0.24)',
              }}
            />
          </BarChart>
        )}
      </CardContent>
    </Card>
  )
}
