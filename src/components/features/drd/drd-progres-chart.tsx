// src/components/features/drd/drd-progres-chart.tsx
//
// Line chart tren SL & m³ per bulan, konsumsi trpc.drd.progres.tren.
// Pakai recharts. Kalau proyekmu tidak pakai recharts, tinggal ganti
// bagian <ResponsiveContainer>...</ResponsiveContainer> dengan library
// chart lain (data shape tetap sama).

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTRPC } from '@/integrations/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const formatAngka = (n: number) => new Intl.NumberFormat('id-ID').format(n)

function formatPeriodeLabel(periode: number) {
  const bulan = periode % 100
  const tahun = Math.floor(periode / 100)
  const NAMA_BULAN_SINGKAT = [
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
  return `${NAMA_BULAN_SINGKAT[bulan]} '${String(tahun).slice(2)}`
}

interface DrdProgresChartProps {
  tahunMulai?: number
  tahunAkhir?: number
}

export function DrdProgresChart({
  tahunMulai = new Date().getFullYear() - 1,
  tahunAkhir = new Date().getFullYear(),
}: DrdProgresChartProps) {
  const trpc = useTRPC()

  const { data, isLoading, isError } = useQuery(
    trpc.drd.progres.tren.queryOptions({ tahunMulai, tahunAkhir }),
  )

  const chartData =
    data?.items.map((item) => ({
      periode: item.periode,
      label: formatPeriodeLabel(item.periode),
      sl: item.jumlahSl,
      m3: item.totalM3,
    })) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren SL & Pemakaian (m³) per Bulan</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-72 w-full" />}

        {isError && (
          <p className="text-sm text-destructive">
            Gagal memuat data tren PROGRES WP 5.
          </p>
        )}

        {!isLoading && !isError && chartData.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada data untuk rentang tahun ini.
          </p>
        )}

        {!isLoading && !isError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis
                yAxisId="sl"
                orientation="left"
                fontSize={12}
                tickFormatter={formatAngka}
              />
              <YAxis
                yAxisId="m3"
                orientation="right"
                fontSize={12}
                tickFormatter={formatAngka}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatAngka(Number(value ?? 0)),
                  name === 'sl' ? 'Jumlah SL' : 'Total m³',
                ]}
                labelFormatter={(label) => label}
              />
              <Line
                yAxisId="sl"
                type="monotone"
                dataKey="sl"
                name="sl"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="m3"
                type="monotone"
                dataKey="m3"
                name="m3"
                stroke="hsl(var(--chart-2, 200 90% 50%))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
