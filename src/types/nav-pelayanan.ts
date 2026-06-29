// src/config/navigasi/nav-pelayanan.ts
import type { NavGroup, NavAccess, RoleValue } from '@/types'

// ─────────────────────────────────────────────────────────────
// ROLE GROUPS
// Definisi terpusat — ubah di sini jika ada role baru.
// Urutan hierarki: SUPER_ADMIN > DIREKSI > SENIOR_MANAGER >
//                 MANAGER > SUPERVISOR > STAFF > USER
// ─────────────────────────────────────────────────────────────

/** Semua staf internal (semua kecuali USER publik) */
const INTERNAL_ROLES: RoleValue[] = [
  'SUPER_ADMIN',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
]

/** Role yang bisa memvalidasi/menyetujui data */
const CAN_VALIDATE: RoleValue[] = [
  'SUPER_ADMIN',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
]

/** Level manajemen strategis */
const MANAGEMENT: RoleValue[] = ['SUPER_ADMIN', 'DIREKSI', 'SENIOR_MANAGER']

/** Manager ke atas */
const MANAGER_UP: RoleValue[] = [
  'SUPER_ADMIN',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
]

/** Hanya Super Admin */
const SUPER_ONLY: RoleValue[] = ['SUPER_ADMIN']

// ─────────────────────────────────────────────────────────────
// ACCESS HELPERS
// Factory function untuk membuat NavAccess dengan pola umum.
// Tambah helper baru di sini jika ada pola akses yang berulang.
// ─────────────────────────────────────────────────────────────

/**
 * Akses untuk staff sub-bagian tertentu di divisi PELAYANAN.
 * SUPER_ADMIN, DIREKSI, SENIOR_MANAGER bypass cek subBagian
 * (sudah dihandle di canAccess() berdasarkan ROLE_RANK).
 *
 * @param subBagianKode - Kode sub-bagian, misal 'SUB-PW5-CATER'
 *
 * @example
 * // Hanya staff SUB-PW5-CATER dan manager ke atas di PELAYANAN
 * access: staffAccess('SUB-PW5-CATER')
 */
function staffAccess(subBagianKode: string): NavAccess {
  return {
    roles: INTERNAL_ROLES,
    divisi: 'PELAYANAN',
    subBagian: subBagianKode,
  }
}

/**
 * Akses untuk beberapa sub-bagian sekaligus di divisi PELAYANAN.
 * Gunakan saat satu menu perlu diakses oleh lebih dari satu sub-bagian.
 *
 * @param subBagianKodes - Array kode sub-bagian
 *
 * @example
 * // Menu yang bisa diakses CATER dan LANG sekaligus
 * access: multiStaffAccess(['SUB-PW5-CATER', 'SUB-PW5-LANG'])
 */
function multiStaffAccess(subBagianKodes: string[]): NavAccess {
  return {
    roles: INTERNAL_ROLES,
    divisi: 'PELAYANAN',
    subBagianAny: subBagianKodes, // ← perlu tambah field ini di NavAccess type
  }
}

/**
 * Akses divisi PELAYANAN untuk semua role yang diizinkan,
 * tanpa restriksi sub-bagian. Cocok untuk menu lintas sub-bagian.
 */
function pelayananAccess(roles: RoleValue[]): NavAccess {
  return { roles, divisi: 'PELAYANAN' }
}

// ─────────────────────────────────────────────────────────────
// SUB-BAGIAN KODE CONSTANTS
// Definisikan konstanta kode agar tidak typo saat penambahan menu.
// Jika ada PW baru (PW6, dst), cukup tambah di sini.
// ─────────────────────────────────────────────────────────────

const CATER = 'SUB-PW5-CATER'
const LANG = 'SUB-PW5-LANG'
const NRW = 'SUB-PW5-NRW'
// const ZONA  = 'SUB-PW5-ZONA'  // uncomment jika ZONA perlu menu

// ─────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────

export const navPelayanan: NavGroup[] = [
  // ── Grup: Pelayanan ──────────────────────────────────────
  {
    label: 'Pelayanan',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/pelayanan',
        icon: 'dashboard',
        access: pelayananAccess(INTERNAL_ROLES),
      },
      {
        title: 'Rekap Wilayah',
        url: '/dashboard/pelayanan/rekap',
        icon: 'chart-bar',
        access: pelayananAccess(MANAGEMENT),
      },
      {
        title: 'Peta Spasial',
        url: '/map',
        icon: 'peta',
        access: pelayananAccess(INTERNAL_ROLES),
      },
    ],
  },

  // ── Grup: Data Pelanggan ─────────────────────────────────
  {
    label: 'Data Pelanggan',
    items: [
      {
        title: 'Pelanggan',
        url: '#',
        icon: 'users',
        access: staffAccess(LANG),
        items: [
          {
            title: 'Daftar Pelanggan',
            url: '/dashboard/pelayanan/tagihan',
            shortcut: ['p', 'l'],
          },
          {
            title: 'Tambah Pelanggan',
            url: '/dashboard/pelayanan/pelanggan/baru',
            access: pelayananAccess(MANAGER_UP),
          },
          {
            title: 'Cari Pelanggan',
            url: '/dashboard/pelayanan/pelanggan/cari',
            shortcut: ['p', 'c'],
          },
          {
            title: 'Data Meter',
            url: '/dashboard/pelayanan/meter',
            access: pelayananAccess(CAN_VALIDATE),
          },
        ],
      },
      {
        title: 'Sambungan',
        url: '#',
        icon: 'file-plus',
        access: staffAccess(LANG),
        items: [
          {
            title: 'Pengajuan PB/PK',
            url: '/dashboard/pelayanan/pbpk',
            shortcut: ['p', 'b'],
          },
          {
            title: 'Riwayat Mutasi',
            url: '/dashboard/pelayanan/pbpk/riwayat',
          },
          {
            title: 'Validasi PB/PK',
            url: '/dashboard/pelayanan/pbpk/validasi',
            access: pelayananAccess(CAN_VALIDATE),
          },
        ],
      },
      {
        title: 'Pemutusan Layanan',
        url: '#',
        icon: 'scissors',
        access: pelayananAccess(CAN_VALIDATE),
        items: [
          {
            title: 'Daftar Pemutusan',
            url: '/dashboard/pelayanan/pemutusan',
          },
          {
            title: 'TSM (Tutup Sementara)',
            url: '/dashboard/pelayanan/pemutusan/tsm',
          },
          {
            title: 'SPT (Surat Perintah Tutup)',
            url: '/dashboard/pelayanan/pemutusan/spt',
          },
          {
            title: 'Riwayat Pemutusan',
            url: '/dashboard/pelayanan/pemutusan/riwayat',
          },
        ],
      },
    ],
  },

  // ── Grup: Pencatatan Meter ───────────────────────────────
  {
    label: 'Pencatatan Meter',
    items: [
      {
        title: 'Laporan Harian',
        url: '#',
        icon: 'clipboard',
        access: staffAccess(CATER),
        items: [
          {
            title: 'Input Stand Meter',
            url: '/dashboard/cater/input-stand-meter',
            shortcut: ['c', 'i'],
          },
          {
            title: 'Laporan Hari Ini',
            url: '/laporan-harian',
          },
          {
            title: 'Verifikasi Laporan',
            url: '/dashboard/cater/verifikasi-laporan',
            access: pelayananAccess(CAN_VALIDATE),
          },
          {
            title: 'Riwayat Pembacaan',
            url: '/dashboard/cater/riwayat-pembacaan',
          },
          {
            title: 'Anomali Pemakaian',
            url: '/dashboard/cater/anomali-pemakaian',
            access: pelayananAccess(CAN_VALIDATE),
          },
        ],
      },
      {
        title: 'Laporan Mandiri',
        url: '#',
        icon: 'camera',
        access: staffAccess(CATER),
        items: [
          {
            title: 'Antrian Laporan',
            url: '/laporan-mandiri',
            shortcut: ['m', 'a'],
          },
          {
            title: 'Verifikasi Foto',
            url: '/dashboard/cater/verifikasi-poto',
            access: pelayananAccess(CAN_VALIDATE),
          },
          {
            title: 'Riwayat Laporan',
            url: '/dashboard/cater/riwayat-laporan',
          },
          {
            title: 'Monitoring Lapor Meter',
            url: '/dashboard/cater/monitoring-lapor-meter',
          },
        ],
      },
      {
        title: 'Closing Bulanan',
        url: '#',
        icon: 'calendar-check',
        access: pelayananAccess(MANAGER_UP),
        items: [
          {
            title: 'Proses Closing',
            url: '/dashboard/cater/closing',
            shortcut: ['c', 'b'],
          },
          {
            title: 'Import ProgresCater',
            url: '/dashboard/cater/import',
          },
          {
            title: 'Histori Closing',
            url: '/dashboard/cater/histori',
          },
        ],
      },
    ],
  },

  // ── Grup: Tagihan ────────────────────────────────────────
  {
    label: 'Tagihan',
    items: [
      {
        title: 'Daftar Tagihan',
        url: '/tagihan',
        icon: 'receipt',
        shortcut: ['t', 'l'],
        access: staffAccess(LANG),
      },
      {
        title: 'Tagihan Jatuh Tempo',
        url: '/dashboard/pelayanan/tagihan/jatuh-tempo',
        icon: 'receipt',
        shortcut: ['t', 'j'],
        access: staffAccess(LANG),
      },
      {
        title: 'Tunggakan',
        url: '/dashboard/pelayanan/tagihan/tunggakan',
        icon: 'receipt',
        access: staffAccess(LANG),
      },
      {
        title: 'Validasi Pembayaran',
        url: '/dashboard/pelayanan/tagihan/validasi',
        icon: 'receipt',
        access: pelayananAccess(CAN_VALIDATE),
      },
    ],
  },

  // ── Grup: NRW ────────────────────────────────────────────
  // CATATAN: access dikunci di level item (bukan parent collapsible)
  // karena parent tanpa access akan selalu lolos filter — ini by design
  // agar filterItems() bisa mengevaluasi tiap anak secara independen.
  {
    label: 'Pelayanan NRW',
    items: [
      {
        title: 'Dashboard NRW',
        url: '/dashboard/pelayanan/nrw',
        icon: 'droplet',
        shortcut: ['n', 'r'],
        access: staffAccess(NRW),
      },
      {
        title: 'Zona & DMA',
        url: '/dashboard/pelayanan/nrw/zona',
        icon: 'droplet',
        access: staffAccess(NRW),
      },
      {
        title: 'Analisis Kehilangan Air',
        url: '/dashboard/pelayanan/nrw/analisis',
        icon: 'droplet',
        access: staffAccess(NRW),
      },
      {
        title: 'Wilayah & Seksi Cater',
        url: '/dashboard/pelayanan/nrw/wilayah',
        icon: 'droplet',
        access: pelayananAccess(MANAGER_UP),
      },
    ],
  },

  // ── Grup: Laporan ────────────────────────────────────────
  {
    label: 'Laporan',
    items: [
      {
        title: 'Rekap Pembacaan',
        url: '/dashboard/pelayanan/laporan/pembacaan',
        icon: 'fileText',
        shortcut: ['l', 'p'],
        access: pelayananAccess(CAN_VALIDATE),
      },
      {
        title: 'Rekap Tagihan',
        url: '/dashboard/pelayanan/laporan/tagihan',
        icon: 'receiptText',
        access: pelayananAccess(CAN_VALIDATE),
      },
      {
        title: 'Laporan Petugas',
        url: '/dashboard/pelayanan/laporan/petugas',
        icon: 'userCog',
        access: pelayananAccess(MANAGER_UP),
      },
      {
        title: 'Ekspor CSV',
        url: '/dashboard/pelayanan/laporan/ekspor',
        icon: 'fileDown',
        access: pelayananAccess(MANAGER_UP),
      },
    ],
  },

  // ── Grup: Referensi ──────────────────────────────────────
  {
    label: 'Referensi',
    items: [
      {
        title: 'Master Data',
        url: '#',
        icon: 'database',
        access: pelayananAccess(MANAGER_UP),
        items: [
          {
            title: 'Golongan Tarif',
            url: '/dashboard/pelayanan/referensi/tarif',
          },
          {
            title: 'Blok Tarif',
            url: '/dashboard/pelayanan/referensi/tarif/blok',
          },
          {
            title: 'Wilayah PDAM',
            url: '/dashboard/pelayanan/referensi/wilayah',
          },
          {
            title: 'Kecamatan & Kelurahan',
            url: '/dashboard/pelayanan/referensi/kecamatan',
          },
          {
            title: 'Daftar Petugas',
            url: '/dashboard/pelayanan/referensi/petugas',
          },
        ],
      },
    ],
  },

  // ── Grup: Administrasi ───────────────────────────────────
  {
    label: 'Administrasi',
    items: [
      {
        title: 'Sistem',
        url: '#',
        icon: 'settings',
        access: pelayananAccess(MANAGEMENT),
        items: [
          {
            title: 'Audit Log',
            url: '/dashboard/pelayanan/admin/audit',
            access: pelayananAccess(MANAGEMENT),
          },
          {
            title: 'Konfigurasi Sistem',
            url: '/dashboard/pelayanan/admin/konfigurasi',
            access: { roles: SUPER_ONLY },
          },
          {
            title: 'Manajemen User',
            url: '/dashboard/users',
            access: pelayananAccess(MANAGEMENT),
          },
        ],
      },
    ],
  },
]
