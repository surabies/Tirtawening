// prisma/scripts/cek-struktur.ts
import { prisma } from "../seed/client"

async function main() {
  const result = await prisma.divisi.findMany({
    include: {
      bagian: {
        include: {
          subBagian: true,
        },
      },
    },
  })

  for (const divisi of result) {
    console.log(`\n📁 ${divisi.kode} - ${divisi.nama}`)
    for (const bagian of divisi.bagian) {
      console.log(`  📂 ${bagian.kode} - ${bagian.nama}`)
      for (const sub of bagian.subBagian) {
        console.log(`    📄 ${sub.kode} - ${sub.nama}`)
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
