// src/types/index.ts (atau wherever NavAccess didefinisikan)
// Tambah field subBagianAny ke interface NavAccess yang sudah ada

export type RoleValue =
  | 'SUPER_ADMIN'
  | 'DIREKSI'
  | 'SENIOR_MANAGER'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'STAFF'
  | 'USER'

export interface NavAccess {
  /** Role yang diizinkan mengakses item ini */
  roles?: RoleValue[]

  /** Minimum role yang dibutuhkan (inklusif ke atas) */
  minRole?: RoleValue

  /** Kode divisi yang diizinkan, misal 'PELAYANAN' */
  divisi?: string

  /**
   * Kode sub-bagian tunggal yang diizinkan.
   * Gunakan ini untuk akses satu sub-bagian spesifik.
   * @example 'SUB-PW5-CATER'
   */
  subBagian?: string

  /**
   * Array kode sub-bagian yang diizinkan (OR logic).
   * Gunakan ini jika menu perlu diakses oleh beberapa sub-bagian.
   * @example ['SUB-PW5-CATER', 'SUB-PW5-LANG']
   */
  subBagianAny?: string[]
}

export interface NavItem {
  title: string
  url: string
  icon?: string
  shortcut?: string[]
  access?: NavAccess
  items?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}
