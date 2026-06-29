import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Import Navbar & Page Layout TanStack
import { NavbarFilter, useNavbar } from '@/components/layout/navbar'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'

// Import Komponen Peta & Provider dari folder components
import { MapClientView } from '@/components/features/map/_components/MapClientView'
import { MapDetailPanel } from '@/components/features/map/_components/MapDetailPanel'
import { MapSelectionProvider } from '@/components/features/map/_components/MapSelectionContext'
import { MapLayerProvider } from '@/components/features/map/_components/shared/Maplayercontext'

// 1. PATH DI SINI HARUS SESUAI LOKASI FOLDER: /_dashboard/map/
export const Route = createFileRoute('/_dashboard/map/')({
  component: MapPage,
})

function MapPage() {
  const { setContent } = useNavbar()

  // 2. Efek filter navbar khas dashboard kamu
  useEffect(() => {
    setContent(<NavbarFilter />)
    return () => setContent(null)
  }, [setContent])

  return (
    <PageContainer
      header={
        <PageHeader
          title="Peta Wilayah Pelayanan 5"
          description="Monitoring wilayah kerja dan distribusi pelanggan secara real-time."
        />
      }
    >
      {/* 3. Provider dibungkus di sini agar tidak ada error useMapSelection lagi */}
      <MapLayerProvider>
        <MapSelectionProvider>
          {/* LAYOUT GRID PETA (Dipertahankan dari kode Next.js kamu) */}
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
