import { useMapSelection } from './MapSelectionContext'
import { EmptyState } from './shared/EmptyState'
import { LegendCard } from './shared/Legend'
import { KecamatanDetail } from './details/KecamatanDetail'
import { KelurahanDetail } from './details/KelurahanDetail'
import { PelangganDetail } from './details/PelangganDetail'
import { PotensiDetail } from './details/PotensiDetail'
import { PemutusanDetail } from './details/PemutusanDetail'

/**
 * Panel detail di sisi peta: menampilkan legenda di bagian atas, dan kartu
 * detail yang adaptif tergantung jenis seleksi (pelanggan/kelurahan/kecamatan/potensi/pemutusan)
 * di bagian bawah.
 */
export function MapDetailPanel() {
  const { selected, setSelected } = useMapSelection()
  const handleClose = () => setSelected(null)

  return (
    <div className="flex h-full flex-col gap-1.5 overflow-hidden rounded-md border border-border/60 bg-muted/40 p-1.5 dark:bg-muted/10">
      {/* Legend card */}
      <LegendCard />

      {/* Detail card — adaptif berdasar seleksi */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border/50 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors dark:shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
        {selected === null ? (
          <EmptyState />
        ) : selected.type === 'pelanggan' ? (
          <PelangganDetail id={selected.id} onClose={handleClose} />
        ) : selected.type === 'potensi' ? (
          <PotensiDetail id={selected.id} onClose={handleClose} />
        ) : selected.type === 'pemutusan' ? (
          <PemutusanDetail id={selected.id} onClose={handleClose} />
        ) : selected.type === 'kelurahan' ? (
          <KelurahanDetail id={selected.id} onClose={handleClose} />
        ) : (
          <KecamatanDetail id={selected.id} onClose={handleClose} />
        )}
      </div>
    </div>
  )
}
