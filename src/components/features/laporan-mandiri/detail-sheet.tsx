import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  User,
  Phone,
  Calendar,
  Gauge,
  Hash,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { type LaporanMandiriRow } from './columns'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  MENUNGGU: {
    label: 'Menunggu',
    className:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  DIVERIFIKASI: {
    label: 'Diverifikasi',
    className:
      'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  DITOLAK: {
    label: 'Ditolak',
    className:
      'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300',
  },
  DIGUNAKAN: {
    label: 'Digunakan',
    className:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
}

const BULAN = [
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

function formatPeriode(yyyymm: number): string {
  return `${BULAN[yyyymm % 100]} ${Math.floor(yyyymm / 100)}`
}

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground mb-0.5 text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
        <div className="text-foreground text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

// Tidak ada mt-4 bawaan lagi — jarak antar section sekarang diatur oleh
// `gap-5` pada flex container pembungkus (lihat di bawah), bukan margin
// di label-nya sendiri. Lebih konsisten di layout 2 kolom.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-widest">
      {children}
    </p>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  row: LaporanMandiriRow | null
  open: boolean
  onClose: () => void
  onVerify: (id: string) => void
  onReject: (id: string) => void
  isVerifyPending?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
// Catatan: nama export tetap `DetailSheet` supaya pemanggilnya di
// laporan-mandiri-table.tsx tidak perlu diubah — tapi sekarang isinya
// Dialog (modal di tengah), bukan Sheet (panel geser dari samping).

export function DetailSheet({
  row,
  open,
  onClose,
  onVerify,
  onReject,
  isVerifyPending,
}: Props) {
  if (!row) return null

  const status = STATUS_MAP[row.status]
  const bisaAksi = row.status === 'MENUNGGU'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {/* ── Header (sticky) ── */}
        <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-4 text-left">
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="text-base font-semibold leading-tight">
              Detail Laporan Mandiri
            </DialogTitle>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            {row.nomorLangganan}
          </p>
        </DialogHeader>

        {/* ── Body — scroll, 2 kolom di layar md+ ── */}
        <div className="grid flex-1 gap-x-6 gap-y-5 overflow-y-auto px-6 py-5 md:grid-cols-[1.05fr_1fr]">
          {/* KIRI — Foto & Pelapor */}
          <div className="flex flex-col gap-5">
            <div>
              <SectionLabel>Foto Meter</SectionLabel>
              <div className="overflow-hidden rounded-lg border">
                {row.fotoUrl ? (
                  <div className="group relative">
                    <img
                      src={row.fotoUrl}
                      alt="Foto meter pelanggan"
                      className="h-60 w-full object-cover md:h-72"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(row.fotoUrl, '_blank')}
                        className="gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka di tab baru
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-48 items-center justify-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Foto tidak tersedia
                  </div>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Identitas Pelapor</SectionLabel>
              <div className="bg-muted/30 rounded-lg px-3">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nama Pelapor"
                  value={row.namaPelapor}
                />
                <Separator className="my-0" />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Nomor Pelapor"
                  value={<span className="font-mono">{row.nomorPelapor}</span>}
                />
              </div>
            </div>
          </div>

          {/* KANAN — Pelanggan, Laporan, Riwayat */}
          <div className="flex flex-col gap-5">
            <div>
              <SectionLabel>Data Pelanggan</SectionLabel>
              <div className="bg-muted/30 rounded-lg px-3">
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="No. Langganan"
                  value={
                    <span className="font-mono">{row.nomorLangganan}</span>
                  }
                />
                <Separator className="my-0" />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nama Pelanggan"
                  value={row.pelanggan.nama}
                />
                <Separator className="my-0" />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Alamat"
                  value={
                    <span className="leading-relaxed">
                      {row.pelanggan.alamat}
                    </span>
                  }
                />
                {row.pelanggan.seksiCater && (
                  <>
                    <Separator className="my-0" />
                    <InfoRow
                      icon={<Hash className="h-4 w-4" />}
                      label="Seksi Cater"
                      value={`${row.pelanggan.seksiCater.kode} — ${row.pelanggan.seksiCater.nama}`}
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Data Laporan</SectionLabel>
              <div className="bg-muted/30 rounded-lg px-3">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Periode"
                  value={formatPeriode(row.periode)}
                />
                <Separator className="my-0" />
                <InfoRow
                  icon={<Gauge className="h-4 w-4" />}
                  label="Stand Meter Dilaporkan"
                  value={
                    <span className="tabular-nums">
                      {row.standDilaporkan.toLocaleString('id-ID')}{' '}
                      <span className="text-muted-foreground font-normal">
                        m³
                      </span>
                    </span>
                  }
                />
                {row.pembacaan && (
                  <>
                    <Separator className="my-0" />
                    <InfoRow
                      icon={<Gauge className="h-4 w-4" />}
                      label="Pemakaian (setelah verifikasi)"
                      value={
                        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                          {row.pembacaan.pemakaianM3} m³
                        </span>
                      }
                    />
                  </>
                )}
                <Separator className="my-0" />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Dikirim pada"
                  value={
                    <span className="tabular-nums">
                      {formatDate(row.createdAt)}
                    </span>
                  }
                />
              </div>
            </div>

            {(row.verifiedAt || row.alasanDitolak) && (
              <div>
                <SectionLabel>Riwayat Verifikasi</SectionLabel>
                <div className="bg-muted/30 rounded-lg px-3">
                  {row.verifiedAt && (
                    <InfoRow
                      icon={<Clock className="h-4 w-4" />}
                      label="Diproses pada"
                      value={
                        <span className="tabular-nums">
                          {formatDate(row.verifiedAt)}
                        </span>
                      }
                    />
                  )}
                  {row.verifiedBy?.name && (
                    <>
                      <Separator className="my-0" />
                      <InfoRow
                        icon={<User className="h-4 w-4" />}
                        label="Diproses oleh"
                        value={row.verifiedBy.name}
                      />
                    </>
                  )}
                  {row.alasanDitolak && (
                    <>
                      <Separator className="my-0" />
                      <InfoRow
                        icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                        label="Alasan Penolakan"
                        value={
                          <span className="leading-relaxed text-red-600 dark:text-red-400">
                            {row.alasanDitolak}
                          </span>
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Footer (sticky) ── */}
        {bisaAksi && (
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <p className="text-muted-foreground mb-3 text-xs">
              Tindakan verifikasi tidak dapat dibatalkan setelah dikonfirmasi.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950"
                onClick={() => {
                  onReject(row.id)
                  onClose()
                }}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Tolak
              </Button>
              <Button
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => {
                  onVerify(row.id)
                  onClose()
                }}
                disabled={isVerifyPending}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                {isVerifyPending ? 'Memproses…' : 'Verifikasi'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
