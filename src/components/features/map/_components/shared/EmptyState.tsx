import { Layers, MapPin } from "lucide-react"
import type { ReactNode } from "react"

/** Tampilan placeholder saat belum ada titik/wilayah yang dipilih di peta. */
export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-5 text-muted-foreground/80" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Pilih titik atau wilayah
        </p>
        <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
          Klik titik pelanggan atau batas kelurahan/kecamatan di peta untuk
          melihat detail informasi.
        </p>
      </div>
      <div className="mt-1 flex w-full max-w-48 flex-col gap-2">
        <Hint
          icon={<MapPin className="size-3 text-emerald-500" />}
          text="Titik warna = pelanggan"
        />
        <Hint
          icon={<Layers className="size-3 text-blue-500" />}
          text="Area berwarna = wilayah"
        />
      </div>
    </div>
  )
}

function Hint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  )
}
