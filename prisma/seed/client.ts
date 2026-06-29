// seed/client.ts
// Shared PrismaClient instance — dipakai oleh semua seed file
// Import file ini, jangan buat instance PrismaClient sendiri di setiap seed file.

import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    '[seed/client] DATABASE_URL tidak ditemukan di environment. Pastikan file .env tersedia.',
  )
}

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter })
