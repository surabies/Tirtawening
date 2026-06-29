import { useMemo, useRef, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { Map, MapClusterLayer, MapControls } from '@/components/ui/map'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useMapSelection } from './MapSelectionContext'
import { useMapLayer } from './shared/Maplayercontext'
import { MapOverlay } from './MapOverlay'
import { PelangganPopup } from './PelangganPopup'
import { WilayahLayer } from './WilayahLayer'
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  POINT_COLOR_EXPRESSION,
  POINT_STROKE_EXPRESSION,
} from './types/constants'
import type {
  ActivePelangganPopup,
  PelangganFeatureProperties,
  PelangganListResponse,
  WilayahGeoJson,
} from './types/types'

export function MapClientView() {
  const trpc = useTRPC()
  const { setSelected } = useMapSelection()
  const { layers, toggleLayer } = useMapLayer()

  const [activePelanggan, setActivePelanggan] =
    useState<ActivePelangganPopup | null>(null)
  const cancelHideRef = useRef<(() => void) | null>(null)

  // ── Query Options ─────────────────────────────────────
  const pelangganQueryOptions = trpc.peta.getPelangganList.queryOptions({
    take: 50000,
    skip: 0,
    status: ['AKTIF'],
  }) as any
  const wilayahQueryOptions = trpc.peta.getWilayahGeoJson.queryOptions() as any
  const kecamatanQueryOptions =
    trpc.peta.getKecamatanGeoJson.queryOptions() as any
  const statsQueryOptions = trpc.peta.getPelangganStats.queryOptions() as any
  const potensiQueryOptions = trpc.peta.getPotensiPelangganList.queryOptions({
    take: 50000,
    skip: 0,
  }) as any
  const pemutusanQueryOptions = trpc.peta.getPemutusanList.queryOptions({
    take: 50000,
    skip: 0,
  }) as any

  // ── Queries ───────────────────────────────────────────
  const {
    data: pelangganData,
    isLoading,
    isError,
  } = useQuery<PelangganListResponse | undefined, unknown>(
    pelangganQueryOptions,
  )
  const { data: geoJsonData } = useQuery<WilayahGeoJson | undefined, unknown>(
    wilayahQueryOptions,
  )
  const { data: kecamatanGeoJson } = useQuery<
    WilayahGeoJson | undefined,
    unknown
  >(kecamatanQueryOptions)
  const { data: statsData } = useQuery<any>(statsQueryOptions)
  const { data: potensiData } = useQuery<
    { data: any[]; total: number } | undefined,
    unknown
  >(potensiQueryOptions)
  const { data: pemutusanData } = useQuery<
    { data: any[]; total: number } | undefined,
    unknown
  >(pemutusanQueryOptions)

  // ── GeoJSON memo ─────────────────────────────────────
  const pelangganGeoJson = useMemo<
    FeatureCollection<GeoJSON.Point, PelangganFeatureProperties>
  >(() => {
    if (!layers.pelangganAktif)
      return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features:
        pelangganData?.data
          ?.filter(
            (p) =>
              p.geoLong != null && p.geoLat != null && p.status === 'AKTIF',
          )
          .map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.geoLong!, p.geoLat!] },
            properties: {
              id: p.id,
              nama: p.nama,
              alamat: p.alamat,
              nomorLangganan: p.nomorLangganan,
              status: p.status ?? 'UNKNOWN',
            },
          })) ?? [],
    }
  }, [pelangganData, layers.pelangganAktif])

  const potensiGeoJson = useMemo<FeatureCollection<GeoJSON.Point, any>>(() => {
    if (!layers.pelangganPotensi)
      return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features:
        potensiData?.data
          ?.filter((p) => p.geoLong != null && p.geoLat != null)
          .map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.geoLong!, p.geoLat!] },
            properties: {
              id: p.id,
              nama: `Calon Pelanggan (${p.status.replace('_', ' ')})`,
              alamat: p.alamat,
              nomorLangganan: 'PROSPEK SURVEI',
              status: p.status,
            },
          })) ?? [],
    }
  }, [potensiData, layers.pelangganPotensi])

  const pemutusanGeoJson = useMemo<
    FeatureCollection<GeoJSON.Point, any>
  >(() => {
    if (!layers.pelangganEks) return { type: 'FeatureCollection', features: [] }
    return {
      type: 'FeatureCollection',
      features:
        pemutusanData?.data
          ?.filter((p) => p.geoLong != null && p.geoLat != null)
          .map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.geoLong!, p.geoLat!] },
            properties: {
              id: p.id,
              nama: p.nama ?? `Eks Pelanggan (${p.jenis})`,
              alamat: p.alamat ?? 'Alamat tidak terekam lapangan',
              nomorLangganan: p.nomorLangganan ?? 'EX-PELANGGAN',
              status: p.jenis,
            },
          })) ?? [],
    }
  }, [pemutusanData, layers.pelangganEks])

  // ── Loading / Error ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted p-4 text-center">
        <AlertCircle className="size-8 text-red-500" />
        <p className="text-sm font-medium text-foreground">
          Gagal memuat data peta
        </p>
        <p className="text-xs text-muted-foreground">
          Silakan coba muat ulang halaman
        </p>
      </div>
    )
  }

  const polygonCount = geoJsonData?.features?.length ?? 0
  const pelangganTotal = statsData?.total ?? 0
  const statusCounts = {
    AKTIF: statsData?.aktif ?? 0,
    TUTUP_SEMENTARA: statsData?.tutupSementara ?? 0,
    TUTUP_SPT: statsData?.tutupSpt ?? 0,
    CABUT_PERMANEN: statsData?.cabutPermanen ?? 0,
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      <Map
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <WilayahLayer
          data={geoJsonData}
          kecamatanData={kecamatanGeoJson}
          visibility={{
            kelurahan: layers.kelurahan,
            kecamatan: layers.kecamatan,
            pelanggan:
              layers.pelangganAktif ||
              layers.pelangganPotensi ||
              layers.pelangganEks,
          }}
        />

        <MapClusterLayer
          data={pelangganGeoJson}
          clusterColors={['#22c55e', '#f97316', '#ef4444']}
          clusterThresholds={[40, 120]}
          clusterRadius={70}
          pointColor={POINT_COLOR_EXPRESSION}
          pointStrokeWidth={2.5}
          pointStrokeColor={POINT_STROKE_EXPRESSION}
          onPointClick={(f) =>
            setSelected({ type: 'pelanggan', id: f.properties.id })
          }
          onPointMouseEnter={(f, coords, cancelHide) => {
            cancelHideRef.current = cancelHide
            setActivePelanggan({
              ...f.properties,
              longitude: coords[0],
              latitude: coords[1],
            })
          }}
          onPointMouseLeave={() => {
            cancelHideRef.current = null
            setActivePelanggan(null)
          }}
        />

        <MapClusterLayer
          data={potensiGeoJson}
          clusterColors={['#3b82f6', '#2563eb', '#1d4ed8']}
          clusterThresholds={[30, 100]}
          clusterRadius={65}
          pointColor={[
            'match',
            ['get', 'status'],
            'PROSPEK',
            '#60a5fa',
            'MENUNGGU_SURVEI',
            '#fbbf24',
            'VALIDASI',
            '#c084fc',
            'DITOLAK',
            '#9ca3af',
            '#3b82f6',
          ]}
          pointStrokeWidth={2}
          pointStrokeColor="#ffffff"
          onPointClick={(f) =>
            setSelected({ type: 'potensi', id: f.properties.id })
          }
          onPointMouseEnter={(f, coords, cancelHide) => {
            cancelHideRef.current = cancelHide
            setActivePelanggan({
              ...f.properties,
              longitude: coords[0],
              latitude: coords[1],
            })
          }}
          onPointMouseLeave={() => {
            cancelHideRef.current = null
            setActivePelanggan(null)
          }}
        />

        <MapClusterLayer
          data={pemutusanGeoJson}
          clusterColors={['#8b5cf6', '#7c3aed', '#6d28d9']}
          clusterThresholds={[30, 100]}
          clusterRadius={65}
          pointColor={[
            'match',
            ['get', 'status'],
            'TSM',
            '#ec4899',
            'SPT',
            '#f97316',
            'LAINNYA',
            '#6b7280',
            '#8b5cf6',
          ]}
          pointStrokeWidth={2}
          pointStrokeColor="#ffffff"
          onPointClick={(f) =>
            setSelected({ type: 'pemutusan', id: f.properties.id })
          }
          onPointMouseEnter={(f, coords, cancelHide) => {
            cancelHideRef.current = cancelHide
            setActivePelanggan({
              ...f.properties,
              longitude: coords[0],
              latitude: coords[1],
            })
          }}
          onPointMouseLeave={() => {
            cancelHideRef.current = null
            setActivePelanggan(null)
          }}
        />

        <MapControls
          showZoom
          showLocate
          showFullscreen
          className="right-4 bottom-12"
        />

        {/* MapOverlay menangani semua kasus sendiri via portal:
            - Desktop sheet   → absolute di dalam map container
            - Mobile FAB      → portal ke map.getContainer() → ikut fullscreen
            - Mobile Drawer   → portal ke fullscreenElement / document.body */}
        <MapOverlay
          polygonCount={polygonCount}
          pelangganCount={pelangganTotal}
          statusCounts={statusCounts}
          visibility={{
            kelurahan: layers.kelurahan,
            kecamatan: layers.kecamatan,
            pelanggan: layers.pelangganAktif,
            potensi: layers.pelangganPotensi,
            pemutusan: layers.pelangganEks,
          }}
          onVisibilityChange={(key) => {
            const keyMap: Record<string, keyof typeof layers> = {
              kelurahan: 'kelurahan',
              kecamatan: 'kecamatan',
              pelanggan: 'pelangganAktif',
              potensi: 'pelangganPotensi',
              pemutusan: 'pelangganEks',
            }
            const ctxKey = keyMap[key]
            if (ctxKey) toggleLayer(ctxKey)
          }}
        />

        {activePelanggan && (
          <PelangganPopup
            pelanggan={activePelanggan}
            onClose={() => setActivePelanggan(null)}
            onMouseEnter={() => cancelHideRef.current?.()}
            onMouseLeave={() => setActivePelanggan(null)}
          />
        )}
      </Map>
    </div>
  )
}
