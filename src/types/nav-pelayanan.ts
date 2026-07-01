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
        url: '/overview/',
        icon: 'dashboard',
        access: pelayananAccess(INTERNAL_ROLES),
      },
      {
        title: 'Rekap Wilayah',
        url: '#', // TODO: create route /rekap/
        icon: 'chart-bar',
        access: pelayananAccess(MANAGEMENT),
      },
      {
        title: 'Peta Spasial',
        url: '/map/',
        icon: 'peta',
        access: pelayananAccess(INTERNAL_ROLES),
      },
      {
        title: 'KPI Pencatat Meter',
        url: '/kpi-pencatat/',
        icon: 'chart-bar',
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
            url: '/tagihan/',
            shortcut: ['p', 'l'],
          },
          {
            title: 'Tambah Pelanggan',
            url: '#', // TODO: create route /pelanggan/baru/
            access: pelayananAccess(MANAGER_UP),
          },
          {
            title: 'Cari Pelanggan',
            url: '#', // TODO: create route /pelanggan/cari/
            shortcut: ['p', 'c'],
          },
          {
            title: 'Data Meter',
            url: '#', // TODO: create route /meter/
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
            url: '#', // TODO: create route /pbpk/
            shortcut: ['p', 'b'],
          },
          {
            title: 'Riwayat Mutasi',
            url: '#', // TODO: create route /pbpk/riwayat/
          },
          {
            title: 'Validasi PB/PK',
            url: '#', // TODO: create route /pbpk/validasi/
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
            url: '#', // TODO: create route /pemutusan/
          },
          {
            title: 'TSM (Tutup Sementara)',
            url: '#', // TODO: create route /pemutusan/tsm/
          },
          {
            title: 'SPT (Surat Perintah Tutup)',
            url: '#', // TODO: create route /pemutusan/spt/
          },
          {
            title: 'Riwayat Pemutusan',
            url: '#', // TODO: create route /pemutusan/riwayat/
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
            url: '#', // TODO: create route /pencatatan/input/
            shortcut: ['c', 'i'],
          },
          {
            title: 'Laporan Hari Ini',
            url: '/laporan-harian/',
          },
          {
            title: 'Verifikasi Laporan',
            url: '#', // TODO: create route /pencatatan/verifikasi/
            access: pelayananAccess(CAN_VALIDATE),
          },
          {
            title: 'Riwayat Pembacaan',
            url: '#', // TODO: create route /pencatatan/riwayat/
          },
          {
            title: 'Anomali Pemakaian',
            url: '#', // TODO: create route /pencatatan/anomali/
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
            url: '#', // TODO: create route /laporan-mandiri/verifikasi/
            access: pelayananAccess(CAN_VALIDATE),
          },
          {
            title: 'Riwayat Laporan',
            url: '#', // TODO: create route /laporan-mandiri/riwayat/
          },
          {
            title: 'Monitoring Lapor Meter',
            url: '#', // TODO: create route /laporan-mandiri/monitoring/
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
            url: '/closing/',
            shortcut: ['c', 'b'],
          },
          {
            title: 'Import ProgresCater',
            url: '/closing/import/',
          },
          {
            title: 'Histori Closing',
            url: '/closing/history/',
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
        url: '#', // TODO: create route /tagihan/jatuh-tempo/
        icon: 'receipt',
        shortcut: ['t', 'j'],
        access: staffAccess(LANG),
      },
      {
        title: 'Tunggakan',
        url: '#', // TODO: create route /tagihan/tunggakan/
        icon: 'receipt',
        access: staffAccess(LANG),
      },
      {
        title: 'Validasi Pembayaran',
        url: '#', // TODO: create route /tagihan/validasi/
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
        url: '#', // TODO: create route /nrw/
        icon: 'droplet',
        shortcut: ['n', 'r'],
        access: staffAccess(NRW),
      },
      {
        title: 'Zona & DMA',
        url: '#', // TODO: create route /nrw/zona/
        icon: 'droplet',
        access: staffAccess(NRW),
      },
      {
        title: 'Analisis Kehilangan Air',
        url: '#', // TODO: create route /nrw/analisis/
        icon: 'droplet',
        access: staffAccess(NRW),
      },
      {
        title: 'Wilayah & Seksi Cater',
        url: '#', // TODO: create route /nrw/wilayah/
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
        url: '#', // TODO: create route /laporan/pembacaan/
        icon: 'fileText',
        shortcut: ['l', 'p'],
        access: pelayananAccess(CAN_VALIDATE),
      },
      {
        title: 'Rekap Tagihan',
        url: '#', // TODO: create route /laporan/tagihan/
        icon: 'receiptText',
        access: pelayananAccess(CAN_VALIDATE),
      },
      {
        title: 'Laporan Petugas',
        url: '#', // TODO: create route /laporan/petugas/
        icon: 'userCog',
        access: pelayananAccess(MANAGER_UP),
      },
      {
        title: 'Laporan DRD',
        url: '/drd', // TODO: create route /laporan/pembacaan/
        icon: 'fileText',
        shortcut: ['l', 'p'],
        access: pelayananAccess(CAN_VALIDATE),
      },
      {
        title: 'Ekspor CSV',
        url: '#', // TODO: create route /laporan/ekspor/
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
            url: '#', // TODO: create route /referensi/tarif/
          },
          {
            title: 'Blok Tarif',
            url: '#', // TODO: create route /referensi/tarif/blok/
          },
          {
            title: 'Wilayah PDAM',
            url: '#', // TODO: create route /referensi/wilayah/
          },
          {
            title: 'Kecamatan & Kelurahan',
            url: '#', // TODO: create route /referensi/kecamatan/
          },
          {
            title: 'Daftar Petugas',
            url: '#', // TODO: create route /referensi/petugas/
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
            url: '#', // TODO: create route /admin/audit/
            access: pelayananAccess(MANAGEMENT),
          },
          {
            title: 'Konfigurasi Sistem',
            url: '#', // TODO: create route /admin/konfigurasi/
            access: { roles: SUPER_ONLY },
          },
          {
            title: 'Manajemen User',
            url: '#', // TODO: create route /admin/users/
            access: pelayananAccess(MANAGEMENT),
          },
        ],
      },
    ],
  },
]
