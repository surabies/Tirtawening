/**
 * wilayah-colors.ts
 *
 * Palet warna dan utilitas untuk layer kelurahan & kecamatan.
 *
 * CATATAN PENTING — kenapa tidak pakai MapLibre math expression:
 * ["%" , ["to-number", ["get", "KODE_DESA"]], 8] secara teori benar,
 * tapi di praktiknya ["==", float_mod_result, integer] bisa tidak reliable
 * tergantung versi MapLibre dan tipe data properties di GeoJSON.
 *
 * Solusi paling robust: inject property "_colorIdx" (0–7) langsung ke
 * setiap feature di JS sebelum data masuk ke MapLibre source,
 * lalu pakai ["get", "_colorIdx"] langsung — tidak ada math di GPU.
 */

// ── Palet kelurahan (8 warna) ─────────────────────────────────────────────────
export const KELURAHAN_PALETTE = [
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#38bdf8", // sky-400
  "#4ade80", // green-400
  "#c084fc", // purple-400
  "#fb7185", // rose-400
] as const

export const KELURAHAN_FILL_OPACITY = 0.13

// ── Warna kecamatan — amber, jauh dari palet kelurahan ───────────────────────
export const KECAMATAN_LINE_COLOR = "#d97706"
export const KECAMATAN_LINE_WIDTH = 2.5
export const KECAMATAN_LINE_OPACITY = 0.9

/**
 * Inject property "_colorIdx" ke setiap feature GeoJSON.
 * Index = OBJECT_ID % 8, fallback ke urutan feature (index % 8).
 *
 * Kenapa OBJECT_ID: angkanya lebih kecil dan variatif per kelurahan
 * yang bersebelahan (31257, 31258, 31259...) sehingga warna tidak
 * berulang terlalu cepat di area yang sama.
 *
 * Dipanggil sekali di WilayahLayer sebelum data masuk ke addSource.
 */
export function injectColorIndex<T extends GeoJSON.FeatureCollection>(
  fc: T
): T {
  return {
    ...fc,
    features: fc.features.map((feature, i) => {
      const objectId = feature.properties?.OBJECT_ID
      const idx =
        typeof objectId === "number"
          ? Math.round(objectId) % KELURAHAN_PALETTE.length
          : i % KELURAHAN_PALETTE.length
      return {
        ...feature,
        properties: {
          ...feature.properties,
          _colorIdx: idx,
        },
      }
    }),
  }
}

/**
 * MapLibre expression untuk fill-color: langsung ambil warna dari
 * property "_colorIdx" yang sudah di-inject.
 *
 * ["match", ["get", "_colorIdx"], 0, color0, 1, color1, ..., fallback]
 */
export function buildKelurahanColorExpression(): any[] {
  const expr: any[] = ["match", ["get", "_colorIdx"]]
  for (let i = 0; i < KELURAHAN_PALETTE.length; i++) {
    expr.push(i)
    expr.push(KELURAHAN_PALETTE[i])
  }
  expr.push(KELURAHAN_PALETTE[0]) // fallback
  return expr
}

// Label display untuk legenda
export const LAYER_LABELS = {
  kelurahan: "Batas Kelurahan",
  kecamatan: "Batas Kecamatan",
  pelanggan: "Titik Pelanggan",
} as const

export type LayerVisibility = {
  kelurahan: boolean
  kecamatan: boolean
  pelanggan: boolean
}
