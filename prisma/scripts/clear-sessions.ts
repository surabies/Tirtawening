// prisma/scripts/clear-sessions.ts
import { prisma } from "../seed/client"

async function main() {
  await prisma.session.deleteMany({})
  console.log("✅ Semua session dihapus")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
