import { AlertTriangle, CheckCircle2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Types — cocok dengan return type pencatatKpi.list / byPencatat
// ---------------------------------------------------------------------------

type KondisiItem = { kondisi: string; jumlah: number }

type KpiData = {
  pencatat: {
    id: string
    namaLapangan: string
    namaLengkap: string | null
    nip: string | null
    isAktif: boolean
    user: { image: string | null; email: string } | null
  }
  periode: number
  targetSl: number
  totalSl: number
  normalSl: number
  anomaliSl: number
  totalM3: number
  akurasi: number
  progres: number
  breakdown: {
    kritis: KondisiItem[]
    peringatan: KondisiItem[]
    lapangan: KondisiItem[]
  }
}

// ---------------------------------------------------------------------------
// Label display per KondisiCatat enum
// ---------------------------------------------------------------------------

const KONDISI_LABEL: Record<string, string> = {
  METER_RUSAK: '🛠️ Meter Rusak',
  METER_MATI_ADA_AIR: '🛠️ Meter Mati Ada Air',
  LOS_METER: '⚡ Los Meter',
  DICABUT: '🛑 Meter Dicabut',
  BMK_BMB: '❌ BMK / BMB',
  METER_TERBALIK: '🔄 Meter Terbalik',
  METER_MUNDUR: '🔄 Meter Mundur',
  METER_DALAM_AIR: '💧 Meter Terendam',
  TIDAK_ADA_AIR: '💧 Tidak Ada Air',
  STAND_TEMPEL: '📝 Stand Tempel',
  STAND_KONSUMEN: '📝 Stand Konsumen',
  REV_PENCATAT: '🔄 Rev Pencatat',
  MUDA_KEMBALI: '🔄 Muda Kembali',
  TTB: 'TTB',
  MTA: 'MTA',
  DK: 'DK',
  MB: 'MB',
  RUMAH_KOSONG: '🏠 Rumah Kosong',
  TIDAK_DIPAKAI: '🏠 Tidak Dipakai',
  TERHALANG: '🚧 Terhalang',
  ADA_ANJING: '🚧 Ada Anjing',
}

// ---------------------------------------------------------------------------
// Status tone mapping (pakai CSS var semantik, bukan warna Tailwind literal)
// Definisikan var ini di globals.css, contoh ada di bawah file ini.
// ---------------------------------------------------------------------------

type Tone = 'critical' | 'warning' | 'info' | 'success'

const TONE_CLASS: Record<
  Tone,
  { dot: string; text: string; card: string; value: string }
> = {
  critical: {
    dot: 'bg-destructive',
    text: 'text-destructive',
    card: 'border-destructive/15 bg-destructive/5',
    value: 'text-destructive',
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    card: 'border-warning/15 bg-warning/5',
    value: 'text-warning',
  },
  info: {
    dot: 'bg-info',
    text: 'text-info',
    card: 'border-info/15 bg-info/5',
    value: 'text-info',
  },
  success: {
    dot: 'bg-success',
    text: 'text-success',
    card: 'border-success/15 bg-success/5',
    value: 'text-success',
  },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AnomalyGroup({
  label,
  items,
  tone,
}: {
  label: string
  items: KondisiItem[]
  tone: Tone
}) {
  if (!items.length) return null

  const cls = TONE_CLASS[tone]

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${cls.text}`}>
        <span className={`h-1 w-1 rounded-full ${cls.dot}`} />
        {label}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {items.map(({ kondisi, jumlah }) => (
          <div
            key={kondisi}
            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${cls.card}`}
          >
            <span className="text-muted-foreground truncate">
              {KONDISI_LABEL[kondisi] ?? kondisi}
            </span>
            <span className={`ml-2 shrink-0 font-mono font-bold ${cls.value}`}>
              {jumlah}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Card
// ---------------------------------------------------------------------------

export function PencatatKpiCard({ data }: { data: KpiData }) {
  const {
    pencatat,
    targetSl,
    totalSl,
    normalSl,
    anomaliSl,
    akurasi,
    progres,
    breakdown,
  } = data

  const nama = pencatat.namaLengkap ?? pencatat.namaLapangan
  const nip = pencatat.nip ?? '-'
  const avatar = pencatat.user?.image

  // Tone akurasi berdasarkan ambang, mapped ke token semantik
  const akurasiTone: Tone =
    akurasi >= 90 ? 'success' : akurasi >= 75 ? 'warning' : 'critical'
  const akurasiCls = TONE_CLASS[akurasiTone]

  const progresBarColor =
    progres >= 90
      ? 'from-success to-success/70'
      : progres >= 70
        ? 'from-primary to-primary/70'
        : 'from-warning to-warning/70'

  const pctNormal =
    totalSl > 0 ? Math.round((normalSl / totalSl) * 1000) / 10 : 0
  const pctAnomali =
    totalSl > 0 ? Math.round((anomaliSl / totalSl) * 1000) / 10 : 0

  const hasAnomali =
    breakdown.kritis.length + breakdown.peringatan.length + breakdown.lapangan.length > 0

  return (
    <Card className="relative overflow-hidden border-border bg-card/50 shadow-2xl backdrop-blur-md">
      {/* Animated border laser */}
      {/*
        Catatan robustness:
        - @keyframes didefinisikan inline di sini (bukan di globals.css) supaya
          animasi ini TIDAK bergantung pada file CSS eksternal yang bisa lupa
          di-import / ke-purge oleh Tailwind. Sebelumnya animation-name
          "borderFlowSingle" dipanggil tapi keyframes-nya tidak ada di mana pun
          → browser diam-diam mengabaikannya tanpa error.
        - pathLength="100" pada <rect> menormalkan total keliling path jadi
          selalu 100 unit, apa pun ukuran actual card-nya. Dulu dasharray
          "100, 1300" mengasumsikan keliling ±1300px secara hardcode — kalau
          card lebih kecil/besar (responsive), rasio segmen jadi salah dan
          animasi terlihat diam atau meloncat.
        - Animasi jalan lewat stroke-dashoffset (bukan cuma dasharray statis),
          ini pola yang lebih reliable lintas browser untuk "marching ants".
        - prefers-reduced-motion dihormati.
      */}
      <style>{`
        @keyframes kpiCardBorderFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -100; }
        }
        .kpi-card-laser-rect {
          stroke-dasharray: 8 92;
          animation: kpiCardBorderFlow 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .kpi-card-laser-rect {
            animation: none;
          }
        }
      `}</style>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="16"
          ry="16"
          pathLength={100}
          className="kpi-card-laser-rect h-full w-full fill-none stroke-[2px]"
          style={{ stroke: 'url(#laserGrad)' }}
        />
        <defs>
          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
        </defs>
      </svg>

      <CardContent className="p-5 text-card-foreground">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-gradient-to-tr from-warning via-primary to-success p-[2px] shrink-0">
              <div className="h-14 w-14 rounded-full bg-card p-[2px]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={nama}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              {pencatat.isAktif && (
                <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold tracking-tight">{nama}</h3>
                <span className="inline-flex items-center rounded border border-info/20 bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
                  NIP: {nip}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Pencatat Meter
              </p>
            </div>
          </div>

          {/* Akurasi badge */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${akurasiCls.card} ${akurasiCls.text}`}>
              {akurasi}%
            </div>
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
              Akurasi
            </span>
          </div>
        </div>

        <hr className="my-4 border-border/80" />

        {/* Progres target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Progres Target
            </span>
            <span className="font-mono text-muted-foreground">
              <strong className="text-foreground">
                {totalSl.toLocaleString('id-ID')}
              </strong>{' '}
              / {targetSl.toLocaleString('id-ID')} SL
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progresBarColor} transition-all duration-700`}
              style={{ width: `${Math.min(progres, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>
              Normal:{' '}
              <strong className="text-success">
                {normalSl.toLocaleString('id-ID')} ({pctNormal}%)
              </strong>
            </span>
            <span>
              Anomali:{' '}
              <strong className="text-warning">
                {anomaliSl.toLocaleString('id-ID')} ({pctAnomali}%)
              </strong>
            </span>
          </div>
        </div>

        {/* Breakdown anomali */}
        {hasAnomali && (
          <>
            <hr className="my-4 border-border/80" />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Rincian Temuan
                </span>
                <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-bold text-muted-foreground">
                  {anomaliSl} Total
                </span>
              </div>

              <AnomalyGroup
                label="Kritis / Butuh Tindakan"
                items={breakdown.kritis}
                tone="critical"
              />
              <AnomalyGroup
                label="Peringatan Teknis"
                items={breakdown.peringatan}
                tone="warning"
              />
              <AnomalyGroup
                label="Situasi Lapangan"
                items={breakdown.lapangan}
                tone="info"
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[10px] font-medium text-muted-foreground">
          <span>
            Periode:{' '}
            {String(data.periode).slice(4)}/{String(data.periode).slice(0, 4)}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-success" />
            Realtime
          </span>
        </div>
      </CardContent>
    </Card>
  )
}