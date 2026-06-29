import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { FeatureCollection } from 'geojson'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'
import { useMap } from '@/components/ui/map'
import { useMapSelection } from './MapSelectionContext'
import {
  WILAYAH_FILL_LAYER_ID,
  WILAYAH_OUTLINE_LAYER_ID,
  WILAYAH_SOURCE_ID,
} from './types/constants'
import {
  buildKelurahanColorExpression,
  injectColorIndex,
  KELURAHAN_FILL_OPACITY,
  KECAMATAN_LINE_COLOR,
  KECAMATAN_LINE_WIDTH,
  KECAMATAN_LINE_OPACITY,
  type LayerVisibility,
} from './types/wilayah.color'

// IMPORT KEMBALI fungsi dissolve sebagai fallback
import { dissolveToKecamatan } from './types/dissolve.kecamatan'

const KECAMATAN_SOURCE_ID = 'kecamatan-source'
const KECAMATAN_LINE_LAYER_ID = 'kecamatan-line'

type WilayahLayerProps = {
  data?: FeatureCollection
  kecamatanData?: FeatureCollection
  visibility?: LayerVisibility
}

export function WilayahLayer({
  data,
  kecamatanData,
  visibility = { kelurahan: true, kecamatan: true, pelanggan: true },
}: WilayahLayerProps) {
  const { map, isLoaded } = useMap()
  const { setSelected } = useMapSelection()

  const validKelurahanRef = useRef<FeatureCollection | null>(null)
  const validKecamatanRef = useRef<FeatureCollection | null>(null)

  // ── 1. Proses Data Kelurahan ──
  const kelurahanWithColor = useMemo(() => {
    if (!data?.features?.length) return null

    const validFeatures = data.features.filter((f) => {
      if (!f?.geometry) return false
      const t = f.geometry.type
      return (
        (t === 'Polygon' || t === 'MultiPolygon') &&
        Array.isArray(f.geometry.coordinates) &&
        f.geometry.coordinates.length > 0
      )
    })
    if (!validFeatures.length) return null

    return injectColorIndex({
      type: 'FeatureCollection',
      features: validFeatures,
    })
  }, [data])

  // ── 2. Proses Data Kecamatan (Dengan Fallback) ──
  const computedKecamatanData = useMemo(() => {
    // Utamakan data dari props/backend jika ada dan tidak kosong
    if (kecamatanData?.features && kecamatanData.features.length > 0) {
      return kecamatanData
    }
    // FALLBACK: Jika backend kosong, generate on-the-fly dari data kelurahan
    if (data?.features && data.features.length > 0) {
      return dissolveToKecamatan(data)
    }
    return null
  }, [kecamatanData, data])

  const registerLayers = useCallback(() => {
    if (!map) return

    // ... [KODE REGISTER LAYER KELURAHAN TETAP SAMA] ...
    if (validKelurahanRef.current) {
      if (!map?.getSource(WILAYAH_SOURCE_ID)) {
        map?.addSource(WILAYAH_SOURCE_ID, {
          type: 'geojson',
          data: validKelurahanRef.current,
        })
      } else {
        ;(map.getSource(WILAYAH_SOURCE_ID) as GeoJSONSource).setData(
          validKelurahanRef.current,
        )
      }
    }

    if (
      !map?.getLayer(WILAYAH_FILL_LAYER_ID) &&
      map?.getSource(WILAYAH_SOURCE_ID)
    ) {
      map?.addLayer({
        id: WILAYAH_FILL_LAYER_ID,
        type: 'fill',
        source: WILAYAH_SOURCE_ID,
        layout: { visibility: 'visible' },
        paint: {
          'fill-color': buildKelurahanColorExpression() as any,
          'fill-opacity': KELURAHAN_FILL_OPACITY,
        },
      })
    }

    if (
      !map?.getLayer(WILAYAH_OUTLINE_LAYER_ID) &&
      map?.getSource(WILAYAH_SOURCE_ID)
    ) {
      map?.addLayer({
        id: WILAYAH_OUTLINE_LAYER_ID,
        type: 'line',
        source: WILAYAH_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: 'visible',
        },
        paint: {
          'line-color': buildKelurahanColorExpression() as any,
          'line-width': 1,
          'line-opacity': 0.5,
        },
      })
    }

    // ── Kecamatan source ──
    if (validKecamatanRef.current) {
      if (!map.getSource(KECAMATAN_SOURCE_ID)) {
        map.addSource(KECAMATAN_SOURCE_ID, {
          type: 'geojson',
          data: validKecamatanRef.current,
        })
      } else {
        ;(map.getSource(KECAMATAN_SOURCE_ID) as GeoJSONSource).setData(
          validKecamatanRef.current,
        )
      }
    }

    // ── Kecamatan outline ──
    if (
      !map?.getLayer(KECAMATAN_LINE_LAYER_ID) &&
      map?.getSource(KECAMATAN_SOURCE_ID)
    ) {
      map.addLayer({
        id: KECAMATAN_LINE_LAYER_ID,
        type: 'line',
        source: KECAMATAN_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: 'visible',
        },
        paint: {
          'line-color': KECAMATAN_LINE_COLOR,
          'line-width': KECAMATAN_LINE_WIDTH,
          'line-opacity': KECAMATAN_LINE_OPACITY,
          'line-dasharray': [4, 2],
        },
      })
    }
  }, [map])

  // ── 3. Gunakan dependency baru di useEffect ──
  useEffect(() => {
    // Pastikan bail-out tidak memblokir kecamatan jika kelurahan terlambat render
    if (!isLoaded || !map) return

    if (kelurahanWithColor) {
      validKelurahanRef.current = kelurahanWithColor
    }

    if (computedKecamatanData) {
      validKecamatanRef.current = computedKecamatanData
    }

    // Selama salah satu data sudah siap, jalankan registerLayers
    if (validKelurahanRef.current || validKecamatanRef.current) {
      registerLayers()
    }
  }, [kelurahanWithColor, computedKecamatanData, isLoaded, map, registerLayers])

  // Sync visibility
  useEffect(() => {
    if (!isLoaded || !map) return

    const kVis = visibility.kelurahan ? 'visible' : 'none'
    const cVis = visibility.kecamatan ? 'visible' : 'none'

    if (map?.getLayer(WILAYAH_FILL_LAYER_ID))
      map?.setLayoutProperty(WILAYAH_FILL_LAYER_ID, 'visibility', kVis)
    if (map?.getLayer(WILAYAH_OUTLINE_LAYER_ID))
      map?.setLayoutProperty(WILAYAH_OUTLINE_LAYER_ID, 'visibility', kVis)
    if (map?.getLayer(KECAMATAN_LINE_LAYER_ID))
      map?.setLayoutProperty(KECAMATAN_LINE_LAYER_ID, 'visibility', cVis)
  }, [isLoaded, map, visibility])

  // Event handlers
  useEffect(() => {
    if (!isLoaded || !map) return

    const handleClick = (e: MapLayerMouseEvent) => {
      if ((e as any).handled) return
      const id = e.features?.[0]?.properties?.id as string | undefined
      if (id) setSelected({ type: 'kelurahan', id })
    }

    const handleMouseEnter = (e: MapLayerMouseEvent) => {
      if ((e as any).handled) return
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', WILAYAH_FILL_LAYER_ID, handleClick)
    map.on('mouseenter', WILAYAH_FILL_LAYER_ID, handleMouseEnter)
    map.on('mouseleave', WILAYAH_FILL_LAYER_ID, handleMouseLeave)

    return () => {
      map.off('click', WILAYAH_FILL_LAYER_ID, handleClick)
      map.off('mouseenter', WILAYAH_FILL_LAYER_ID, handleMouseEnter)
      map.off('mouseleave', WILAYAH_FILL_LAYER_ID, handleMouseLeave)
    }
  }, [isLoaded, map, setSelected])

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (!map) return
      try {
        // 🚀 Tambahkan `?.` di semua method agar aman saat unmount massal
        if (map?.getLayer?.(KECAMATAN_LINE_LAYER_ID))
          map?.removeLayer?.(KECAMATAN_LINE_LAYER_ID)

        if (map?.getSource?.(KECAMATAN_SOURCE_ID))
          map?.removeSource?.(KECAMATAN_SOURCE_ID)

        if (map?.getLayer?.(WILAYAH_OUTLINE_LAYER_ID))
          map?.removeLayer?.(WILAYAH_OUTLINE_LAYER_ID)

        if (map?.getLayer?.(WILAYAH_FILL_LAYER_ID))
          map?.removeLayer?.(WILAYAH_FILL_LAYER_ID)

        if (map?.getSource?.(WILAYAH_SOURCE_ID))
          map?.removeSource?.(WILAYAH_SOURCE_ID)
      } catch {
        // ignore
      }
    }
  }, [map])

  return null
}
