// seed/index.ts
import { prisma } from './client'
import * as fs from 'fs'
import { seedUserOrg } from '../scripts/seed.import'
import { seedReferensi } from './01-referensi'
import { seedProgresCater } from './02-progrescater'
import { seedLapdatameter } from './03-lapdatameter'
import { seedPBPK } from './04-pbpk'
import { seedRNomor } from './05-rnomor'

// ─────────────────────────────────────────────────────────────
// TIPE & KONFIGURASI FASE
// ─────────────────────────────────────────────────────────────

interface SeedPhase {
  label: string
  fn: (path?: string) => Promise<void>
  fileEnv?: string
  default?: string
}

const SEED_CONFIG: Record<string, SeedPhase> = {
  '00': {
    label: 'Struktur Organisasi & Admin',
    fn: async () => {
      await seedUserOrg()
    },
  },
  '01': {
    label: 'Referensi',
    fn: () => seedReferensi(),
  },
  '02': {
    label: 'ProgresCater',
    fileEnv: 'PROGRESCATER_CSV',
    default: './data/ProgresCater-PW5.csv',
    fn: (path) => seedProgresCater(path!),
  },
  '03': {
    label: 'Lapdatameter',
    fileEnv: 'LAPDATAMETER_CSV',
    default: './data/lapdatametertes.csv',
    fn: (path) => seedLapdatameter(path!),
  },
  '04': {
    label: 'PBPK',
    fileEnv: 'PBPK_CSV',
    default: './data/PBPK.csv',
    fn: (path) => seedPBPK(path!),
  },
  '05': {
    label: 'R-Nomor',
    fileEnv: 'RNOMOR_CSV',
    default: './data/r-nomor.csv',
    fn: (path) => seedRNomor(path!),
  },
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  const onlyPhase = process.env.SEED_PHASE
  console.log(`\n🚀 TIRTACATER SEEDING [${new Date().toLocaleTimeString()}]`)

  for (const [id, config] of Object.entries(SEED_CONFIG)) {
    if (onlyPhase && id !== onlyPhase) continue

    const { label, fn, fileEnv, default: defPath } = config
    const filePath = fileEnv ? (process.env[fileEnv] ?? defPath) : undefined

    // Validasi file CSV jika diperlukan fase ini
    if (filePath && !fs.existsSync(filePath)) {
      console.error(`❌ File tidak ditemukan: ${filePath}`)
      process.exit(1)
    }

    const start = performance.now()
    console.log(`\n▶ [${id}] Memproses: ${label}...`)

    try {
      await fn(filePath)
      const duration = ((performance.now() - start) / 1000).toFixed(2)
      console.log(`✅ [${id}] ${label} selesai (${duration}s)`)
    } catch (err) {
      console.error(`❌ [${id}] Gagal pada ${label}:`, err)
      process.exit(1)
    }
  }

  console.log('\n🎉 Semua proses seeding selesai!\n')
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
