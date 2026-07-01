// src/server/trpc/routers/drd/drd.router.ts
//
// Gabungan seluruh sub-router DRD, satu router per sheet Excel
// "DRD_JUNI_2026_PW5_fix.xlsx".

import { router } from '../init'
import { drdProgresRouter } from './drd-progres.router'
import { drdTargetRouter } from './drd-target.router'
import { drdPemakaianRouter } from './drd-pemakaian.router'
import { drdMutasiRouter } from './drd-mutasi.router'
import { drdDomestikRouter } from './drd-domestik.router'

export const drdRouter = router({
  progres: drdProgresRouter, // Sheet PROGRES WP 5
  target: drdTargetRouter, // Sheet TARGET WP 5
  pemakaian: drdPemakaianRouter, // Sheet PEMAKAIAN PER GOL TARIP
  mutasi: drdMutasiRouter, // Sheet PENAMBAHAN SL
  domestik: drdDomestikRouter, // Sheet DOMESTIK
})
