// src/types/nav-config.ts
import type { NavGroup } from '@/types'
import { navPelayanan } from './nav-pelayanan'
// import { navTehnik } from './nav-tehnik'
// import { navUmum } from './nav-umum'
// import { navUtama } from './nav-utama'

const baseMenu: NavGroup[] = [
  // Kosongkan atau isi item dashboard global di sini
  // { label: 'Overview', items: [...] }
]

// PENTING: jangan gate SET menu berdasarkan divisi di sini.
// Selalu kembalikan gabungan SEMUA nav group yang ada — filtering
// per-role/per-divisi/per-subBagian dilakukan di canAccess() (use-nav.ts)
// lewat field `access` di tiap item. Kalau di-gate di sini, role
// lintas-divisi (SUPER_ADMIN, DIREKSI, SENIOR_MANAGER) yang divisiId-nya
// null/beda akan selalu dapat menu kosong walau access-nya seharusnya lolos.
export const getSidebarGroups = (): NavGroup[] => {
  return [
    ...baseMenu,
    ...navPelayanan,
    // ...navTehnik,
    // ...navUmum,
    // ...navUtama,
  ]
}
