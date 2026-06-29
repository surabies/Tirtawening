import { Badge } from "@/components/ui/badge"
import { StatusDot } from "./hasil-tagihan.atoms"
import { getActiveStatus } from "./hasil-tagihan.types"
import type { HasilTagihanProps } from "./hasil-tagihan.types"

export function HasilTagihanHeader({ data }: HasilTagihanProps) {
  // 1. Guard Clause: Antisipasi jika data null, undefined, atau array kosong
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Memuat data pelanggan...
      </div>
    )
  }

  // 2. Ambil profil pelanggan dari item tagihan pertama (karena semua item memiliki relasi pelanggan yang sama)
  const pelanggan = data[0]?.pelanggan

  // 3. Masukkan `data` langsung ke getActiveStatus karena bertipe array CekTagihanResult
  const statusCfg = getActiveStatus(data)

  // 4. Hitung jumlah tagihan belum lunas (Type inference otomatis dari array data)
  const unpaidCount = data.filter((t) => t.status !== "SUDAH_BAYAR").length

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            No. Pelanggan
          </p>
          <p className="font-mono text-base font-bold text-foreground">
            {pelanggan?.nomorLangganan ?? "-"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {pelanggan?.nama ?? "Nama tidak ditemukan"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge
            variant="outline"
            className={`gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide ${statusCfg.badgeClass}`}
          >
            <StatusDot className={statusCfg.dotClass} />
            {statusCfg.label}
          </Badge>
          {unpaidCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {unpaidCount} tagihan belum lunas
            </p>
          )}
        </div>
      </div>
      {/* Garis pemisah dengan margin — tidak menyentuh tepi */}
      <div className="mt-4 h-px bg-border/60" />
    </div>
  )
}
