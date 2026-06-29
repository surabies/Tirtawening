"use client"

import { format } from "date-fns"
import { id } from "date-fns/locale"
import { SectionLabel, StatusDot } from "./hasil-tagihan.atoms"
import { formatRupiah, STATUS_CONFIG } from "./hasil-tagihan.types"
import type { HasilTagihanProps, CekTagihanResult } from "./hasil-tagihan.types"
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Pemakaian:{" "}
        <span className="font-mono font-semibold text-foreground">
          {payload[0].value} m³
        </span>
      </p>
    </div>
  )
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────

function CustomCursor({ x, y, width, height, barSize }: any) {
  const cursorWidth = barSize ?? width
  const offsetX = (width - cursorWidth) / 2
  return (
    <rect
      x={x + offsetX}
      y={y}
      width={cursorWidth}
      height={height}
      rx={4}
      ry={4}
      fill="color-mix(in srgb, var(--muted-foreground) 12%, transparent)"
    />
  )
}

// ─── Konsumsi Card ────────────────────────────────────────────────────────────

interface KonsumsiCardProps {
  // Mengambil tipe data per-item dari array CekTagihanResult
  bulanIni: CekTagihanResult[number]
  riwayat: CekTagihanResult
}

function KonsumsiCard({ bulanIni, riwayat }: KonsumsiCardProps) {
  const BAR_SIZE = 20

  const chartData = [...riwayat].reverse().map((t) => ({
    id: t.id,
    bulan: format(new Date(t.periode), "MMM", { locale: id }),
    pemakaian: t.pemakaianM3 ?? 0,
    isLatest: t.id === bulanIni.id,
  }))

  return (
    <div>
      <SectionLabel>Konsumsi Bulan Ini</SectionLabel>
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-sm text-muted-foreground">
            {format(new Date(bulanIni.periode), "MMMM yyyy", { locale: id })}
          </p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {bulanIni.pemakaianM3}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              m³
            </span>
          </p>
        </div>

        <ResponsiveContainer width="100%" height={100}>
          <BarChart
            data={chartData}
            barSize={BAR_SIZE}
            margin={{ top: 4, right: 0, left: -5, bottom: 0 }}
          >
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={<CustomCursor barSize={BAR_SIZE} />}
            />
            <Bar dataKey="pemakaian" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={
                    entry.isLatest
                      ? "var(--foreground)"
                      : "color-mix(in srgb, var(--muted-foreground) 25%, transparent)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Riwayat List ─────────────────────────────────────────────────────────────

interface RiwayatListProps {
  riwayat: CekTagihanResult
}

function RiwayatList({ riwayat }: RiwayatListProps) {
  return (
    <div>
      <SectionLabel>Riwayat Pembayaran</SectionLabel>
      <div>
        {riwayat.map((t, i) => {
          const lunas = t.status === "SUDAH_BAYAR"
          const statusCfg =
            STATUS_CONFIG[t.status] ?? STATUS_CONFIG["SUDAH_BAYAR"]
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between py-3 ${
                i < riwayat.length - 1
                  ? "border-b border-dashed border-border/50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <StatusDot className={statusCfg.dotClass} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(t.periode), "MMMM yyyy", { locale: id })}
                  </p>
                  <p
                    className={`text-[11px] font-medium ${statusCfg.textClass}`}
                  >
                    {statusCfg.label}
                  </p>
                </div>
              </div>
              <p
                className={`font-mono text-sm font-semibold tabular-nums ${
                  lunas
                    ? "text-foreground"
                    : "text-destructive dark:text-red-400"
                }`}
              >
                {formatRupiah(t.totalTagihan)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab Export ───────────────────────────────────────────────────────────────

export function TabRiwayat({ data }: HasilTagihanProps) {
  // Guard Clause: Pastikan data ada dan tidak kosong sebelum diproses
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Tidak ada data riwayat tagihan.
      </div>
    )
  }

  const riwayat = data.slice(0, 6)
  const bulanIni = riwayat[0]

  return (
    <div className="space-y-6">
      {bulanIni && <KonsumsiCard bulanIni={bulanIni} riwayat={riwayat} />}
      <RiwayatList riwayat={riwayat} />
    </div>
  )
}
