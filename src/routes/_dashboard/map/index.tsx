import { createFileRoute } from '@tanstack/react-router'

// Import Page Layout TanStack
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'

// Import Komponen Peta & Provider dari folder components
import { MapClientView } from '@/components/features/map/_components/MapClientView'
import { MapDetailPanel } from '@/components/features/map/_components/MapDetailPanel'
import { MapSelectionProvider } from '@/components/features/map/_components/MapSelectionContext'
import { MapLayerProvider } from '@/components/features/map/_components/shared/Maplayercontext'

export const Route = createFileRoute('/_dashboard/map/')({
  component: MapPage,
})

function MapPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Peta Wilayah Pelayanan 5"
          description="Monitoring wilayah kerja dan distribusi pelanggan secara real-time."
        />
      }
    >
      <MapLayerProvider>
        <MapSelectionProvider>
          {/* LAYOUT GRID PETA */}
          <div className="flex flex-col items-stretch gap-4 lg:grid lg:h-[calc(100vh-14rem)] lg:grid-cols-[65%_minmax(0,1fr)]">
            {/* KOLOM KIRI: Tempat Komponen Maplibre */}
            <div className="relative h-[450px] w-full overflow-hidden rounded-md border border-border shadow-sm lg:h-full">
              <MapClientView />
            </div>

            {/* KOLOM KANAN: Tempat Detail Kecamatan/Kelurahan */}
            <div className="custom-scrollbar relative flex h-[500px] w-full flex-col overflow-y-auto lg:h-full [&>*]:min-h-full">
              <MapDetailPanel />
            </div>
          </div>
        </MapSelectionProvider>
      </MapLayerProvider>
    </PageContainer>
  )
}
