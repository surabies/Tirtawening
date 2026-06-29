// prisma/scripts/seed-users.ts
// ============================================================
// Seed Users — BetterAuth compatible
//
// PERUBAHAN DARI AUTH.JS:
//   • `password` tidak lagi di User → pindah ke model Account
//   • Account dibuat dengan providerId: "credential" (konvensi BetterAuth)
//   • Hash memakai scrypt (algoritma default BetterAuth)
//   • User.emailVerified sekarang Boolean (bukan DateTime)
// ============================================================

import { prisma } from '../seed/client'
import { Scrypt } from 'oslo/password' // 🚀 Menggunakan library bawaan ekosistem BetterAuth

// Hash password menggunakan algoritma scrypt yang identik dengan BetterAuth
async function hashPassword(password: string): Promise<string> {
  const scrypt = new Scrypt()
  return await scrypt.hash(password)
}

async function main() {
  // ── Ambil referensi bagian & subBagian ─────────────────────
  const bagianPW5 = await prisma.bagian.findUnique({
    where: { kode: 'BAGIAN-PW5' },
  })
  const divisiPelayanan = await prisma.divisi.findUnique({
    where: { kode: 'PELAYANAN' },
  })
  const subCater = await prisma.subBagian.findUnique({
    where: { kode: 'SUB-PW5-CATER' },
  })
  const subZona = await prisma.subBagian.findUnique({
    where: { kode: 'SUB-PW5-ZONA' },
  })
  const subLang = await prisma.subBagian.findUnique({
    where: { kode: 'SUB-PW5-LANG' },
  })
  const subNRW = await prisma.subBagian.findUnique({
    where: { kode: 'SUB-PW5-NRW' },
  })

  if (
    !bagianPW5 ||
    !divisiPelayanan ||
    !subCater ||
    !subZona ||
    !subLang ||
    !subNRW
  ) {
    console.error(
      '❌ Data referensi tidak ditemukan, jalankan seed utama dulu!',
    )
    return
  }

  // Hash sekali, pakai untuk semua seed user
  const hashedPassword = await hashPassword('admin123')

  // ... Sisa kode fungsi main() milikmu ke bawah tinggal dilanjutkan tanpa diubah

  // ── Definisi users ────────────────────────────────────────
  const users = [
    {
      name: 'Wiska Prayoga',
      email: 'wiska.prayoga@gmail.com',
      role: 'SUPER_ADMIN' as const,
      divisiId: divisiPelayanan.id,
      bagianId: bagianPW5.id,
      subBagianId: subCater.id,
    },
    {
      name: 'Hani Nugraheni',
      email: 'hani.nugraheni@tirtawening.id',
      role: 'STAFF' as const,
      divisiId: divisiPelayanan.id,
      bagianId: bagianPW5.id,
      subBagianId: subZona.id,
    },
    {
      name: 'Rini Rosdiani',
      email: 'rini.rosdiani@tirtawening.id',
      role: 'STAFF' as const,
      divisiId: divisiPelayanan.id,
      bagianId: bagianPW5.id,
      subBagianId: subLang.id,
    },
    {
      name: 'Kevin',
      email: 'kevin@tirtawening.id',
      role: 'STAFF' as const,
      divisiId: divisiPelayanan.id,
      bagianId: bagianPW5.id,
      subBagianId: subNRW.id,
    },
  ]

  // ── Upsert setiap user + Account credential ───────────────
  for (const userData of users) {
    // 1. Upsert User (tidak ada field password di sini)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        role: userData.role,
        divisiId: userData.divisiId,
        bagianId: userData.bagianId,
        subBagianId: userData.subBagianId,
      },
      create: {
        name: userData.name,
        email: userData.email,
        emailVerified: true, // Boolean di BetterAuth, langsung verified untuk seed
        role: userData.role,
        divisiId: userData.divisiId,
        bagianId: userData.bagianId,
        subBagianId: userData.subBagianId,
      },
    })

    // 2. Upsert Account credential — tempat password disimpan di BetterAuth
    //    BetterAuth menggunakan email sebagai accountId untuk email+password login
    await prisma.account.upsert({
      where: {
        accountId_providerId: {
          accountId: userData.email,
          providerId: 'credential',
        },
      },
      update: {
        password: hashedPassword,
      },
      create: {
        accountId: userData.email,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
      },
    })

    console.log(`✅ ${userData.name} (${userData.role}) - ${userData.email}`)
  }

  console.log('\n🎉 Semua user berhasil di-seed!')
  console.log('📌 Default password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
