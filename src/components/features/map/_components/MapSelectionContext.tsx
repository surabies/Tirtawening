import { createContext, useContext, useState, type ReactNode } from 'react'

// Tambahkan tipe layer baru ke dalam definisi union agar dikenali secara global
export type MapFeatureEvent =
  | { type: 'pelanggan'; id: string }
  | { type: 'kelurahan'; id: string }
  | { type: 'kecamatan'; id: string }
  | { type: 'potensi'; id: string }
  | { type: 'pemutusan'; id: string }
  | null

type MapSelectionContextType = {
  selected: MapFeatureEvent
  setSelected: (selection: MapFeatureEvent) => void
}

const MapSelectionContext = createContext<MapSelectionContextType | undefined>(
  undefined,
)

export function MapSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<MapFeatureEvent>(null)

  return (
    <MapSelectionContext.Provider value={{ selected, setSelected }}>
      {children}
    </MapSelectionContext.Provider>
  )
}

export function useMapSelection() {
  const context = useContext(MapSelectionContext)
  if (!context) {
    throw new Error('useMapSelection must be used within MapSelectionProvider')
  }
  return context
}
