import { Phone } from "lucide-react"
import { FieldLabel, FieldValue, StatusDot } from "./hasil-tagihan.atoms"
import type { HasilTagihanProps } from "./hasil-tagihan.types"

interface InfoFieldProps {
  label: string
  value: React.ReactNode
  colSpan?: boolean
}

function InfoField({ label, value, colSpan = false }: InfoFieldProps) {
  return (
    <div
      className={`border-b border-dashed border-border/50 pb-3 ${colSpan ? "col-span-2" : ""}`}
    >
      <FieldLabel>{label}</FieldLabel>
      {value}
    </div>
  )
}

export function TabInfo({ data }: HasilTagihanProps) {
  // 1. Ambil data dari item pertama array.
  // Jika data kosong, kita handle agar tidak error.
  const firstTagihan = data?.[0]

  // Tambahkan pengecekan jika data kosong
  if (!firstTagihan) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Data tidak ditemukan.
      </div>
    )
  }

  const { pelanggan } = firstTagihan

  const alamat = [
    pelanggan.alamat,
    pelanggan.rt && pelanggan.rw
      ? `RT ${pelanggan.rt}/RW ${pelanggan.rw}`
      : null,
  ]
    .filter(Boolean)
    .join(", ")

  // 2. Karena 'data' sekarang adalah array tagihan,
  // maka 'tagihan0' adalah firstTagihan itu sendiri
  const isAktif = pelanggan.status === "AKTIF"

  return (
    <div className="m-0 space-y-4 rounded-xl p-0">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <InfoField
          label="Nama Lengkap"
          colSpan
          value={<FieldValue>{pelanggan.nama}</FieldValue>}
        />
        <InfoField
          label="Alamat"
          colSpan
          value={<FieldValue>{alamat || "—"}</FieldValue>}
        />
        <InfoField
          label="Kode Rute"
          value={<FieldValue mono>{pelanggan.rute?.kode ?? "_"}</FieldValue>}
        />
        <InfoField
          label="Golongan Tarif"
          value={
            <FieldValue mono>
              {pelanggan.tarifGolongan?.kodeAsli ?? "—"}
            </FieldValue>
          }
        />
        {/* 3. Akses pembacaan langsung dari firstTagihan */}
        {firstTagihan.pembacaan && (
          <>
            <InfoField
              label="Stand Meter Lalu"
              value={
                <FieldValue mono>
                  {firstTagihan.pembacaan.standLalu.toLocaleString("id-ID")} m³
                </FieldValue>
              }
            />
            <InfoField
              label="Stand Meter Terkini"
              value={
                <FieldValue mono>
                  {firstTagihan.pembacaan.standAkhir.toLocaleString("id-ID")} m³
                </FieldValue>
              }
            />
          </>
        )}
        <InfoField
          label="Status Sambungan"
          colSpan
          value={
            <div className="flex items-center gap-1.5">
              <StatusDot
                className={isAktif ? "bg-emerald-500" : "bg-red-500"}
              />
              <FieldValue
                className={
                  isAktif
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {isAktif ? "Aktif" : (pelanggan.status ?? "—")}
              </FieldValue>
            </div>
          }
        />
        {pelanggan.notelp && (
          <InfoField
            label="Nomor Telepon"
            colSpan
            value={
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-muted-foreground" />
                <FieldValue mono>{pelanggan.notelp}</FieldValue>
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
