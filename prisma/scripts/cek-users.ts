// prisma/scripts/cek-users.ts
import { prisma } from "../seed/client"

async function main() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      divisi: { select: { kode: true } },
      bagian: { select: { kode: true } },
      subBagian: { select: { kode: true } },
    },
  })

  for (const u of users) {
    console.log(
      `${u.name} | ${u.role} | ${u.divisi?.kode} | ${u.bagian?.kode} | ${u.subBagian?.kode}`
    )
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
