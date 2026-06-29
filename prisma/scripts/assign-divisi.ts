// prisma/scripts/assign-divisi.ts
import { prisma } from "../seed/client"

async function main() {
  const divisi = await prisma.divisi.findFirst({
    where: { kode: "PELAYANAN" },
    select: { id: true, kode: true },
  })
  console.log("Divisi:", divisi)

  const result = await prisma.user.update({
    where: { email: "wiska.prayoga@gmail.com" },
    data: { divisiId: divisi?.id },
  })
  console.log("✅ Berhasil:", result.email, result.divisiId)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
