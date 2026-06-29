import { createContext, useContext, useState, type ReactNode } from 'react'

export type MapLayerState = {
  /** Batas kelurahan (fill + outline) */
  kelurahan: boolean
  /** Batas kecamatan (outline amber) */
  kecamatan: boolean
  /** Titik pelanggan aktif (tabel Pelanggan) */
  pelangganAktif: boolean
  /** Titik pelanggan potensial (tabel PotensiPelanggan) */
  pelangganPotensi: boolean
  /** Titik eks pelanggan (tabel Pemutusan) */
  pelangganEks: boolean
}

type MapLayerContextType = {
  layers: MapLayerState
  toggleLayer: (key: keyof MapLayerState) => void
}

const DEFAULT_LAYERS: MapLayerState = {
  kelurahan: true,
  kecamatan: true,
  pelangganAktif: true,
  pelangganPotensi: true,
  pelangganEks: true,
}

const MapLayerContext = createContext<MapLayerContextType | undefined>(
  undefined,
)

export function MapLayerProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<MapLayerState>(DEFAULT_LAYERS)

  const toggleLayer = (key: keyof MapLayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <MapLayerContext.Provider value={{ layers, toggleLayer }}>
      {children}
    </MapLayerContext.Provider>
  )
}

export function useMapLayer() {
  const ctx = useContext(MapLayerContext)
  if (!ctx) throw new Error('useMapLayer must be used within MapLayerProvider')
  return ctx
}
