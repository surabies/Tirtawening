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
// Sub-components
// ---------------------------------------------------------------------------

function AnomalyGroup({
  label,
  items,
  color,
}: {
  label: string
  items: KondisiItem[]
  color: 'rose' | 'amber' | 'blue'
}) {
  if (!items.length) return null

  const dotColor = {
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    blue: 'bg-blue-400',
  }[color]

  const textColor = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  }[color]

  const cardStyle = {
    rose: 'border-rose-500/15 bg-rose-500/5',
    amber: 'border-amber-500/15 bg-amber-500/5',
    blue: 'border-blue-500/15 bg-blue-500/5',
  }[color]

  const valueColor = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  }[color]

  return (
    <div className="space-y-1.5">
      <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${textColor}`}>
        <span className={`h-1 w-1 rounded-full ${dotColor}`} />
        {label}
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {items.map(({ kondisi, jumlah }) => (
          <div
            key={kondisi}
            className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${cardStyle}`}
          >
            <span className="text-slate-300 truncate">
              {KONDISI_LABEL[kondisi] ?? kondisi}
            </span>
            <span className={`ml-2 shrink-0 font-mono font-bold ${valueColor}`}>
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

  // Warna akurasi
  const akurasiColor =
    akurasi >= 90
      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
      : akurasi >= 75
        ? 'text-amber-400 border-amber-500/20 bg-amber-500/10'
        : 'text-rose-400 border-rose-500/20 bg-rose-500/10'

  const progresBarColor =
    progres >= 90
      ? 'from-emerald-500 to-teal-500'
      : progres >= 70
        ? 'from-blue-500 to-indigo-500'
        : 'from-amber-500 to-orange-500'

  const pctNormal =
    totalSl > 0 ? Math.round((normalSl / totalSl) * 1000) / 10 : 0
  const pctAnomali =
    totalSl > 0 ? Math.round((anomaliSl / totalSl) * 1000) / 10 : 0

  const hasAnomali =
    breakdown.kritis.length + breakdown.peringatan.length + breakdown.lapangan.length > 0

  return (
    <Card className="relative overflow-hidden border-slate-800/60 bg-slate-900/50 shadow-2xl backdrop-blur-md">
      {/* Animated border laser */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          rx="16"
          ry="16"
          className="h-full w-full fill-none stroke-[2px]"
          style={{
            stroke: 'url(#laserGrad)',
            strokeDasharray: '100, 1300',
            animation: 'borderFlowSingle 4s linear infinite',
          }}
        />
        <defs>
          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      <CardContent className="p-5 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-gradient-to-tr from-amber-500 via-blue-500 to-emerald-500 p-[2px] shrink-0">
              <div className="h-14 w-14 rounded-full bg-slate-900 p-[2px]">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={nama}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-800">
                    <User className="h-6 w-6 text-slate-500" />
                  </div>
                )}
              </div>
              {pencatat.isAktif && (
                <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold tracking-tight">{nama}</h3>
                <span className="inline-flex items-center rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                  NIP: {nip}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Pencatat Meter
              </p>
            </div>
          </div>

          {/* Akurasi badge */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${akurasiColor}`}>
              {akurasi}%
            </div>
            <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
              Akurasi
            </span>
          </div>
        </div>

        <hr className="my-4 border-slate-800/80" />

        {/* Progres target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-400 uppercase">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Progres Target
            </span>
            <span className="font-mono text-slate-400">
              <strong className="text-slate-100">
                {totalSl.toLocaleString('id-ID')}
              </strong>{' '}
              / {targetSl.toLocaleString('id-ID')} SL
            </span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progresBarColor} transition-all duration-700`}
              style={{ width: `${Math.min(progres, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>
              Normal:{' '}
              <strong className="text-emerald-400">
                {normalSl.toLocaleString('id-ID')} ({pctNormal}%)
              </strong>
            </span>
            <span>
              Anomali:{' '}
              <strong className="text-amber-400">
                {anomaliSl.toLocaleString('id-ID')} ({pctAnomali}%)
              </strong>
            </span>
          </div>
        </div>

        {/* Breakdown anomali */}
        {hasAnomali && (
          <>
            <hr className="my-4 border-slate-800/80" />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-slate-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Rincian Temuan
                </span>
                <span className="rounded border border-slate-700/60 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-300">
                  {anomaliSl} Total
                </span>
              </div>

              <AnomalyGroup
                label="Kritis / Butuh Tindakan"
                items={breakdown.kritis}
                color="rose"
              />
              <AnomalyGroup
                label="Peringatan Teknis"
                items={breakdown.peringatan}
                color="amber"
              />
              <AnomalyGroup
                label="Situasi Lapangan"
                items={breakdown.lapangan}
                color="blue"
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[10px] font-medium text-slate-500">
          <span>
            Periode:{' '}
            {String(data.periode).slice(4)}/{String(data.periode).slice(0, 4)}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Realtime
          </span>
        </div>
      </CardContent>
    </Card>
  )
}