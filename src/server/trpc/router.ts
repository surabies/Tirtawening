import { router } from './init'
import { tagihanRouter } from './routers/tagihan.router'
import { laporanMandiriRouter } from './routers/laporan-mandiri.router'
import { petaRouter } from './routers/peta.router'
import { laporanHarianRouter } from './routers/laporan-harian.router'
// ^ sesuaikan nama export ini dengan yang sebenarnya di-export
//   dari laporan-mandiri.router.ts kalau berbeda

export const appRouter = router({
  tagihan: tagihanRouter,
  laporanMandiri: laporanMandiriRouter,
  peta: petaRouter,
  laporanHarian: laporanHarianRouter,
})

export type AppRouter = typeof appRouter
