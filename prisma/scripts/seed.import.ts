// prisma/seed.ts
// Seed struktur organisasi PERUMDA TIRTAWENING KOTA BANDUNG
// Jalankan: bun prisma/seed.ts  (atau via "prisma db seed")
//
// Hierarki jabatan:
//   DIREKSI (4 Direktorat)
//     └── SENIOR_MANAGER (kepala tiap Bagian/Wilayah)
//           └── MANAGER (kepala tiap SubBagian)
//                 └── SUPERVISOR → STAFF → USER
//
// Urutan insert: Divisi → Bagian → SubBagian → User SUPER_ADMIN

import { KodeDivisi, Role } from '@/generated/prisma/client'
import { scrypt, randomBytes } from 'crypto'
import { promisify } from 'util'
import { prisma } from '../seed/client'

// ─────────────────────────────────────────────────────────────
// HELPER AUTH
// ─────────────────────────────────────────────────────────────

const scryptAsync = promisify(scrypt)

// Hash dengan algoritma BetterAuth (scrypt), format: <salt>:<hash>
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

// ─────────────────────────────────────────────────────────────
// DATA SEED
// ─────────────────────────────────────────────────────────────

// KodeDivisi = kode teknis enum Prisma (PELAYANAN, TEHNIK, UMUM, UTAMA)
// nama       = nama resmi Direktorat yang muncul di UI
const DIVISI = [
  { kode: KodeDivisi.UTAMA, nama: 'DIREKTORAT UTAMA' },
  { kode: KodeDivisi.PELAYANAN, nama: 'DIREKTORAT PELAYANAN' },
  { kode: KodeDivisi.TEHNIK, nama: 'DIREKTORAT TEHNIK' },
  { kode: KodeDivisi.UMUM, nama: 'DIREKTORAT UMUM' },
] as const

// Bagian per Direktorat.
// levelKepala = SENIOR_MANAGER untuk SEMUA bagian (dikoreksi dari versi sebelumnya).
// DIREKSI berada di atas hierarki ini — satu per Direktorat, tidak di sini.
const BAGIAN = [
  // ── UTAMA ──────────────────────────────────────────────────
  {
    kode: 'BAGIAN-SEKDIR',
    nama: 'SEKRETARIAT DIREKSI',
    divisiKode: KodeDivisi.UTAMA,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-SPI',
    nama: 'SATUAN PENGAWAS INTERN',
    divisiKode: KodeDivisi.UTAMA,
    levelKepala: Role.SENIOR_MANAGER,
  },

  // ── PELAYANAN (5 Wilayah) ──────────────────────────────────
  {
    kode: 'BAGIAN-PW1',
    nama: 'PELAYANAN WILAYAH 1',
    divisiKode: KodeDivisi.PELAYANAN,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-PW2',
    nama: 'PELAYANAN WILAYAH 2',
    divisiKode: KodeDivisi.PELAYANAN,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-PW3',
    nama: 'PELAYANAN WILAYAH 3',
    divisiKode: KodeDivisi.PELAYANAN,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-PW4',
    nama: 'PELAYANAN WILAYAH 4',
    divisiKode: KodeDivisi.PELAYANAN,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-PW5',
    nama: 'PELAYANAN WILAYAH 5',
    divisiKode: KodeDivisi.PELAYANAN,
    levelKepala: Role.SENIOR_MANAGER,
  },

  // ── TEHNIK (2 Produksi) ────────────────────────────────────
  {
    kode: 'BAGIAN-PROD1',
    nama: 'PRODUKSI 1',
    divisiKode: KodeDivisi.TEHNIK,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-PROD2',
    nama: 'PRODUKSI 2',
    divisiKode: KodeDivisi.TEHNIK,
    levelKepala: Role.SENIOR_MANAGER,
  },

  // ── UMUM (4 Bagian) ────────────────────────────────────────
  {
    kode: 'BAGIAN-KEU',
    nama: 'KEUANGAN',
    divisiKode: KodeDivisi.UMUM,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-SDM',
    nama: 'SUMBER DAYA MANUSIA',
    divisiKode: KodeDivisi.UMUM,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-HUMAS',
    nama: 'HUKUM & HUMAS',
    divisiKode: KodeDivisi.UMUM,
    levelKepala: Role.SENIOR_MANAGER,
  },
  {
    kode: 'BAGIAN-IT',
    nama: 'IT & ASET',
    divisiKode: KodeDivisi.UMUM,
    levelKepala: Role.SENIOR_MANAGER,
  },
] as const

// SubBagian — dipimpin oleh MANAGER (satu level di bawah SENIOR_MANAGER)
const SUB_BAGIAN_PELAYANAN = [
  { suffix: 'CATER', nama: 'PENCATATAN METER' },
  { suffix: 'ZONA', nama: 'SUB ZONA' },
  { suffix: 'LANG', nama: 'LANGGANAN' },
  { suffix: 'NRW', nama: 'NRW' },
] as const

const SUB_BAGIAN_TEHNIK: Record<string, { suffix: string; nama: string }[]> = {
  'BAGIAN-PROD1': [
    { suffix: 'INTAKE', nama: 'OPERATOR PENGOLAHAN & INTAKE' },
    { suffix: 'MEKANIK', nama: 'MEKANIKAL ENGINEERING' },
    { suffix: 'PERPI', nama: 'BAGIAN PERPIPAAN' },
  ],
  'BAGIAN-PROD2': [
    { suffix: 'INTAKE', nama: 'OPERATOR PENGOLAHAN & INTAKE' },
    { suffix: 'SUMURBOR', nama: 'SUMUR BOR' },
    { suffix: 'MATAAIR', nama: 'MATA AIR' },
  ],
}

const SUB_BAGIAN_UMUM: Record<string, { suffix: string; nama: string }[]> = {
  'BAGIAN-KEU': [
    { suffix: 'ANGG', nama: 'ANGGARAN & AKUNTANSI' },
    { suffix: 'KAS', nama: 'KAS & PENAGIHAN' },
  ],
  'BAGIAN-SDM': [
    { suffix: 'REKRUT', nama: 'REKRUTMEN & PENGEMBANGAN' },
    { suffix: 'PENGG', nama: 'PENGGAJIAN & KESEJAHTERAAN' },
  ],
  'BAGIAN-HUMAS': [
    { suffix: 'HUKUM', nama: 'HUKUM & KEPATUHAN' },
    { suffix: 'PR', nama: 'HUBUNGAN MASYARAKAT' },
  ],
  'BAGIAN-IT': [
    { suffix: 'SIS', nama: 'SISTEM INFORMASI' },
    { suffix: 'ASET', nama: 'MANAJEMEN ASET' },
  ],
}

const SUB_BAGIAN_UTAMA: Record<string, { suffix: string; nama: string }[]> = {
  'BAGIAN-SEKDIR': [
    { suffix: 'ADM', nama: 'ADMINISTRASI & KORESPONDENSI' },
    { suffix: 'PROTO', nama: 'PROTOKOL & KEARSIPAN' },
  ],
  'BAGIAN-SPI': [
    { suffix: 'AUDIT', nama: 'AUDIT INTERNAL' },
    { suffix: 'EVAL', nama: 'EVALUASI & PELAPORAN' },
  ],
}

// ─────────────────────────────────────────────────────────────
// HELPER: seed semua SubBagian dari satu map
// ─────────────────────────────────────────────────────────────

async function seedSubBagian(
  map: Record<string, { suffix: string; nama: string }[]>,
  bagianMap: Record<string, string>,
) {
  for (const [bagianKode, subs] of Object.entries(map)) {
    for (const sub of subs) {
      const kode = `SUB-${bagianKode.replace('BAGIAN-', '')}-${sub.suffix}`
      await prisma.subBagian.upsert({
        where: { kode },
        update: { nama: sub.nama },
        create: { kode, nama: sub.nama, bagianId: bagianMap[bagianKode] },
      })
      console.log(`   ✓ [${bagianKode}] ${sub.nama}`)
    }
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Memulai seed struktur organisasi Tirtawening...\n')

  try {
    // 1. DIVISI / DIREKTORAT ────────────────────────────────────
    console.log('📂  Seed Direktorat (Divisi)...')
    const divisiMap: Record<string, string> = {} // kode → id

    for (const d of DIVISI) {
      const record = await prisma.divisi.upsert({
        where: { kode: d.kode },
        update: { nama: d.nama },
        create: { kode: d.kode, nama: d.nama },
      })
      divisiMap[d.kode] = record.id
      console.log(`   ✓ ${d.nama}`)
    }

    // 2. BAGIAN (dipimpin SENIOR_MANAGER) ──────────────────────
    console.log('\n📁  Seed Bagian (kepala: SENIOR_MANAGER)...')
    const bagianMap: Record<string, string> = {} // kode → id

    for (const b of BAGIAN) {
      const record = await prisma.bagian.upsert({
        where: { kode: b.kode },
        update: { nama: b.nama, levelKepala: b.levelKepala },
        create: {
          kode: b.kode,
          nama: b.nama,
          levelKepala: b.levelKepala,
          divisiId: divisiMap[b.divisiKode],
        },
      })
      bagianMap[b.kode] = record.id
      console.log(`   ✓ [${b.divisiKode}] ${b.nama}`)
    }

    // 3. SUBBAGIAN (dipimpin MANAGER) ──────────────────────────
    console.log('\n📄  Seed SubBagian (kepala: MANAGER)...')

    // 3a. Pelayanan Wilayah 1–5 (pattern sama, di-loop)
    for (let w = 1; w <= 5; w++) {
      const bagianKode = `BAGIAN-PW${w}`
      for (const sub of SUB_BAGIAN_PELAYANAN) {
        const kode = `SUB-PW${w}-${sub.suffix}`
        await prisma.subBagian.upsert({
          where: { kode },
          update: { nama: sub.nama },
          create: { kode, nama: sub.nama, bagianId: bagianMap[bagianKode] },
        })
        console.log(`   ✓ [PW${w}] ${sub.nama}`)
      }
    }

    // 3b. Tehnik, Umum, Utama
    await seedSubBagian(SUB_BAGIAN_TEHNIK, bagianMap)
    await seedSubBagian(SUB_BAGIAN_UMUM, bagianMap)
    await seedSubBagian(SUB_BAGIAN_UTAMA, bagianMap)

    // 4. SUPER_ADMIN default ────────────────────────────────────
    console.log('\n👤  Seed User SUPER_ADMIN...')

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@tirtawening.id'
    const adminPass = process.env.SEED_ADMIN_PASSWORD ?? 'TirTA@2025!'
    const hashedPassword = await hashPassword(adminPass)

    // 4a. Upsert User (tanpa password — BetterAuth simpan di Account)
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: 'Super Administrator',
        email: adminEmail,
        emailVerified: true, // Boolean di BetterAuth
        role: Role.SUPER_ADMIN,
      },
    })

    // 4b. Upsert Account credential (tempat password di BetterAuth)
    await prisma.account.upsert({
      where: {
        accountId_providerId: {
          accountId: adminEmail,
          providerId: 'credential',
        },
      },
      update: { password: hashedPassword },
      create: {
        accountId: adminEmail,
        providerId: 'credential',
        userId: adminUser.id,
        password: hashedPassword,
      },
    })

    console.log(`   ✓ ${adminEmail} (role: SUPER_ADMIN)`)
    if (adminPass === 'TirTA@2025!') {
      console.log(
        '   ⚠️  Password default dipakai. Set SEED_ADMIN_PASSWORD di .env sebelum deploy!',
      )
    } else {
      console.log('   ✓ Password dari env digunakan.')
    }

    console.log('\n✅  Seed selesai!\n')
  } catch (e) {
    console.error('❌  Seed gagal:', e)
    throw e
  }
  // ⚠️ Tidak ada $disconnect di sini — dihandle oleh index.ts
  // agar koneksi tetap hidup untuk seed berikutnya (seedSubBagian, dst.)
}

// Export untuk dipanggil dari seed/index.ts
export async function seedUserOrg() {
  await main()
}

// Hanya jalan kalau file ini dieksekusi LANGSUNG (bukan di-import)
if (import.meta.main) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
