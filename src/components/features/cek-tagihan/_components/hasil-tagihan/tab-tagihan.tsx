import { Droplets, Calendar, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  BiayaRow,
  FieldLabel,
  FieldValue,
  SectionLabel,
} from "./hasil-tagihan.atoms"
import { formatRupiah } from "./hasil-tagihan.types"
import type { HasilTagihanProps } from "./hasil-tagihan.types"

export function TabTagihan({ data }: HasilTagihanProps) {
  // Guard Clause: Jika data null, undefined, atau array kosong
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Droplets className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">
          Semua tagihan lunas
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tidak ada tagihan yang perlu dibayar saat ini.
        </p>
      </div>
    )
  }

  // Ambil tagihan yang belum bayar, jika tidak ada fallback ke tagihan paling pertama/terbaru
  const tagihan = data.find((t) => t.status !== "SUDAH_BAYAR") ?? data[0]

  // Jika setelah dicari tetap tidak ada objek tagihan (pengaman ekstra)
  if (!tagihan) return null

  // Data pelanggan diambil dari struktur relasi milik baris tagihan terkait
  const pelanggan = tagihan.pelanggan

  const isOverdue = new Date(tagihan.tanggalJatuhTempo) < new Date()

  const biayaItems = [
    {
      label: `Pemakaian Air (${tagihan.pemakaianM3} m³)`,
      value: tagihan.jmlHargaAir,
      accent: false,
    },
    { label: "Biaya Beban Tetap", value: tagihan.beaBeban, accent: false },
    {
      label: "Biaya Pemeliharaan Meter",
      value: tagihan.beaAdmin,
      accent: false,
    },
    ...(tagihan.airKotor && Number(tagihan.airKotor) > 0
      ? [{ label: "Biaya Air Kotor", value: tagihan.airKotor, accent: false }]
      : []),
    ...(tagihan.lainLain && Number(tagihan.lainLain) > 0
      ? [{ label: "Lain-lain", value: tagihan.lainLain, accent: false }]
      : []),
    ...(tagihan.denda && Number(tagihan.denda) > 0
      ? [{ label: "Denda Keterlambatan", value: tagihan.denda, accent: true }]
      : []),
  ]

  return (
    <div className="space-y-4">
      {/* ── Periode & Jatuh Tempo ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Box Periode */}
        <div className="rounded-lg bg-muted/40 p-3">
          <FieldLabel>Periode</FieldLabel>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <FieldValue>
              {format(new Date(tagihan.periode), "MMMM yyyy", { locale: id })}
            </FieldValue>
          </div>
        </div>

        {/* Box Jatuh Tempo */}
        <div
          className={`rounded-lg border p-3 ${
            isOverdue
              ? "border-destructive/30 bg-destructive/15 text-destructive dark:text-red-400"
              : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
          }`}
        >
          <FieldLabel>Jatuh Tempo</FieldLabel>
          <div className="flex items-center gap-1.5">
            {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
            <FieldValue className="font-medium">
              {format(new Date(tagihan.tanggalJatuhTempo), "dd MMM yyyy", {
                locale: id,
              })}
            </FieldValue>
          </div>
          {isOverdue && (
            <p className="mt-0.5 text-[10px] font-bold">Telah jatuh tempo</p>
          )}
        </div>
      </div>

      {/* ── Golongan Tarif ── */}
      {pelanggan?.tarifGolongan && (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <FieldLabel>Tarif Golongan</FieldLabel>
            <span className="font-mono text-[10px] text-muted-foreground">
              {pelanggan.tarifGolongan.kodeAsli}
            </span>
          </div>
          <FieldValue>{pelanggan.tarifGolongan.kategori}</FieldValue>
        </div>
      )}

      <Separator className="opacity-50" />

      {/* ── Rincian Biaya ── */}
      <div>
        <SectionLabel>Rincian Biaya</SectionLabel>
        <div className="rounded-lg bg-muted/40 px-4 py-1">
          {biayaItems.map(({ label, value, accent }, i) => (
            <BiayaRow
              key={label}
              label={label}
              value={value}
              accent={accent}
              last={i === biayaItems.length - 1}
            />
          ))}
        </div>
      </div>

      {/* ── Total ── */}
      <div className="rounded-lg bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Total Tagihan
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {format(new Date(tagihan.periode), "MMMM yyyy", { locale: id })}
            </p>
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatRupiah(tagihan.totalTagihan)}
          </p>
        </div>
      </div>
    </div>
  )
}
