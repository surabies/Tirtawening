import { MapPopup } from '@/components/ui/map'
import type { ActivePelangganPopup } from './types/types'

interface PelangganPopupProps {
  pelanggan: ActivePelangganPopup
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

/**
 * Tooltip minimal saat hover titik pelanggan.
 * Hanya tampil: nomor pelanggan + koordinat.
 * Detail lengkap muncul saat klik (panel samping).
 *
 * Warna sepenuhnya dari CSS variables shadcn/ui:
 * bg-background, text-foreground, text-muted-foreground, border
 * → otomatis responsif terhadap light/dark mode.
 */
export function PelangganPopup({
  pelanggan,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: PelangganPopupProps) {
  const lng = pelanggan.longitude.toFixed(5)
  const lat = pelanggan.latitude.toFixed(5)

  return (
    <MapPopup
      longitude={pelanggan.longitude}
      latitude={pelanggan.latitude}
      closeButton={false}
      onClose={onClose}
      className="!rounded-lg !border-0 !p-0 !shadow-none"
    >
      <div
        className="min-w-[152px] rounded-lg border border-border bg-background px-3 py-2.5"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Nomor pelanggan */}
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Pelanggan
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {pelanggan.nomorLangganan}
        </p>

        {/* Divider */}
        <div className="my-2 border-t border-border" />

        {/* Koordinat */}
        <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Koordinat
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {lat}, {lng}
        </p>

        {/* Hint */}
        <p className="mt-2 text-[10px] text-muted-foreground/50">
          Klik untuk detail
        </p>
      </div>
    </MapPopup>
  )
}
