/**
 * dissolve-kecamatan.ts
 *
 * Menghasilkan GeoJSON kecamatan dari GeoJSON kelurahan dengan cara
 * mengumpulkan semua geometri per nama kecamatan (field KECAMATAN).
 *
 * Tidak melakukan true topological dissolve (butuh library berat seperti
 * turf/union) — sebagai gantinya kita buat MultiPolygon per kecamatan
 * dengan mengumpulkan semua koordinat kelurahan di dalamnya.
 * Hasilnya adalah outline yang terlihat sebagai batas kecamatan karena
 * interior kelurahan tetap ada, tapi layer kecamatan di-render hanya
 * sebagai LINE (bukan fill) dengan warna berbeda sehingga batas luar
 * kecamatan terlihat lebih tebal/menonjol.
 *
 * Pendekatan ini zero-dependency dan cukup untuk kebutuhan visual.
 */

import type { FeatureCollection, Feature, MultiPolygon, Polygon } from "geojson"

export type KecamatanProperties = {
  KECAMATAN: string
  KAB_KOTA: string
  PROVINSI: string
  /** Jumlah kelurahan dalam kecamatan ini */
  jumlahKelurahan: number
}

/**
 * Mengumpulkan semua polygon kelurahan per kecamatan menjadi MultiPolygon.
 * Input: GeoJSON kelurahan (tiap feature punya properties.KECAMATAN)
 * Output: GeoJSON kecamatan (tiap feature = satu kecamatan, MultiPolygon)
 */
export function dissolveToKecamatan(
  kelurahanGeoJson: FeatureCollection
): FeatureCollection<MultiPolygon, KecamatanProperties> {
  // Group features by KECAMATAN name
  const grouped = new Map<
    string,
    {
      features: Feature[]
      kab_kota: string
      provinsi: string
    }
  >()

  for (const feature of kelurahanGeoJson.features) {
    const kec = feature.properties?.KECAMATAN as string | undefined
    if (!kec || !feature.geometry) continue

    if (!grouped.has(kec)) {
      grouped.set(kec, {
        features: [],
        kab_kota: feature.properties?.KAB_KOTA ?? "",
        provinsi: feature.properties?.PROVINSI ?? "",
      })
    }
    grouped.get(kec)!.features.push(feature)
  }

  // Build MultiPolygon per kecamatan
  const kecamatanFeatures: Feature<MultiPolygon, KecamatanProperties>[] = []

  for (const [kecamatan, { features, kab_kota, provinsi }] of grouped) {
    const allPolygons: number[][][][] = []

    for (const f of features) {
      if (!f.geometry) continue

      if (f.geometry.type === "Polygon") {
        allPolygons.push(f.geometry.coordinates as number[][][])
      } else if (f.geometry.type === "MultiPolygon") {
        for (const poly of f.geometry.coordinates as number[][][][]) {
          allPolygons.push(poly)
        }
      }
    }

    if (allPolygons.length === 0) continue

    kecamatanFeatures.push({
      type: "Feature",
      properties: {
        KECAMATAN: kecamatan,
        KAB_KOTA: kab_kota,
        PROVINSI: provinsi,
        jumlahKelurahan: features.length,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: allPolygons,
      },
    })
  }

  return {
    type: "FeatureCollection",
    features: kecamatanFeatures,
  }
}
