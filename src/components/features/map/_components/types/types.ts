import type { FeatureCollection } from 'geojson'
import type { StatusPelanggan } from '@/generated/prisma/client'

/** Event seleksi fitur di peta: titik pelanggan atau wilayah (kelurahan/kecamatan). */
export type MapFeatureEvent =
  | { type: 'pelanggan'; id: string }
  | { type: 'kelurahan'; id: string }
  | { type: 'kecamatan'; id: string }
  | null

export type PelangganFeatureProperties = {
  id: string
  nama: string
  alamat: string | null
  nomorLangganan: string
  status: string
}

export type PelangganListItem = {
  id: string
  nomorLangganan: string
  nama: string
  alamat: string | null
  geoLat: number | null
  geoLong: number | null
  status: StatusPelanggan | null
}

export type PelangganListResponse = {
  data: PelangganListItem[]
  total: number
}

export type WilayahGeoJson = FeatureCollection

export type ActivePelangganPopup = PelangganFeatureProperties & {
  longitude: number
  latitude: number
}

/** Ringkasan jumlah pelanggan per status, dipakai overlay statistik peta. */
export type PelangganStatusCounts = {
  AKTIF: number
  TUTUP_SEMENTARA: number
  TUTUP_SPT: number
  CABUT_PERMANEN: number
}
// ── Tipe bersama untuk panel detail peta ────────────────────────────────────

/** Props standar untuk setiap komponen detail (pelanggan/kelurahan/kecamatan). */
export interface DetailViewProps {
  /** ID entitas yang sedang dipilih di peta. */
  id: string
  /** Dipanggil saat pengguna menutup panel detail. */
  onClose: () => void
}
