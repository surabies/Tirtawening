import { z } from 'zod'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { StatusTagihan } from '@/generated/prisma/client'

// ============================================================
// Input schemas
// ============================================================

const filterSchema = z.object({
  periode: z.string().datetime().optional(), // ISO date → DateTime di Prisma
  status: z.nativeEnum(StatusTagihan).optional(),
  seksiCaterId: z.string().optional(),
  ruteId: z.string().optional(),
  search: z.string().optional(), // nomorTagihan atau nomorLangganan
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// ============================================================
// Router
// ============================================================

export const tagihanRouter = createTRPCRouter({
  // ── Daftar tagihan dengan filter ──────────────────────────

  cekTagihan: publicProcedure
    .input(z.object({ nomorLangganan: z.string() }))
    .query(async ({ input }) => {
      return await prisma.tagihan.findMany({
        where: { pelanggan: { nomorLangganan: input.nomorLangganan } },
        select: {
          // ── field Tagihan ──────────────────────────────────
          id: true,
          nomorTagihan: true,
          periode: true,
          status: true,
          pemakaianM3: true,
          jmlHargaAir: true,
          beaBeban: true,
          beaAdmin: true,
          airKotor: true,
          lainLain: true,
          denda: true,
          totalTagihan: true,
          tanggalJatuhTempo: true,
          tanggalBayar: true,
          metodePembayaran: true,
          createdAt: true,
          // ── relasi PembacaanMeter ──────────────────────────
          pembacaan: {
            select: {
              standLalu: true,
              standAkhir: true,
              pemakaianM3: true,
              kondisi: true,
            },
          },
          // ── relasi Pelanggan ───────────────────────────────
          pelanggan: {
            select: {
              nomorLangganan: true,
              nama: true,
              alamat: true,
              rt: true,
              rw: true,
              notelp: true,
              status: true,
              rute: {
                select: { kode: true },
              },
              tarifGolongan: {
                select: {
                  kode: true,
                  kodeAsli: true,
                  nama: true,
                  kategori: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  list: protectedProcedure.input(filterSchema).query(async ({ input }) => {
    const skip = (input.page - 1) * input.limit

    const where: Record<string, unknown> = {}
    if (input.status) where.status = input.status
    if (input.periode) {
      const tgl = new Date(input.periode)
      where.periode = {
        gte: new Date(tgl.getFullYear(), tgl.getMonth(), 1),
        lt: new Date(tgl.getFullYear(), tgl.getMonth() + 1, 1),
      }
    }
    if (input.search) {
      where.OR = [
        { nomorTagihan: { contains: input.search, mode: 'insensitive' } },
        {
          pelanggan: {
            nomorLangganan: { contains: input.search, mode: 'insensitive' },
          },
        },
      ]
    }
    if (input.ruteId) {
      where.pelanggan = { ruteId: input.ruteId }
    }

    const [total, data] = await Promise.all([
      prisma.tagihan.count({ where }),
      prisma.tagihan.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pelanggan: {
            select: {
              nomorLangganan: true,
              nama: true,
              alamat: true,
              tarifGolongan: { select: { nama: true, kode: true } },
              rute: { select: { kode: true } },
            },
          },
        },
      }),
    ])

    return {
      data,
      total,
      page: input.page,
      totalPages: Math.ceil(total / input.limit),
    }
  }),

  // ── Tagihan jatuh tempo ────────────────────────────────────
  jatuhTempo: protectedProcedure
    .input(
      z.object({
        hariKedepan: z.number().int().min(1).max(90).default(7),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit
      const now = new Date()
      const batas = new Date(now.getTime() + input.hariKedepan * 86400000)

      const where = {
        status: StatusTagihan.BELUM_BAYAR,
        tanggalJatuhTempo: { gte: now, lte: batas },
      }

      const [total, data] = await Promise.all([
        prisma.tagihan.count({ where }),
        prisma.tagihan.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { tanggalJatuhTempo: 'asc' },
          include: {
            pelanggan: {
              select: { nomorLangganan: true, nama: true, notelp: true },
            },
          },
        }),
      ])

      return {
        data,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      }
    }),

  // ── Tunggakan (belum bayar + lewat jatuh tempo) ────────────
  tunggakan: protectedProcedure
    .input(
      z.object({
        seksiCaterId: z.string().optional(),
        ruteId: z.string().optional(),
        minNominal: z.number().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit

      const where: Record<string, unknown> = {
        status: StatusTagihan.BELUM_BAYAR,
        tanggalJatuhTempo: { lt: new Date() },
      }
      if (input.minNominal) {
        where.nominalTunggak = { gte: input.minNominal }
      }
      if (input.ruteId) {
        where.pelanggan = { ruteId: input.ruteId }
      }

      const [total, data, agregat] = await Promise.all([
        prisma.tagihan.count({ where }),
        prisma.tagihan.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { nominalTunggak: 'desc' },
          include: {
            pelanggan: {
              select: {
                nomorLangganan: true,
                nama: true,
                alamat: true,
                notelp: true,
                rute: { select: { kode: true } },
              },
            },
          },
        }),
        // Total nominal tunggakan
        prisma.tagihan.aggregate({
          where,
          _sum: { totalTagihan: true, nominalTunggak: true },
          _count: { _all: true },
        }),
      ])

      return {
        data,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
        totalNominal: agregat._sum.totalTagihan ?? 0,
        totalTunggakan: agregat._sum.nominalTunggak ?? BigInt(0),
      }
    }),

  // ── Validasi pembayaran ────────────────────────────────────
  validasiPembayaran: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        tanggalBayar: z.string().datetime(),
        metodePembayaran: z.string().min(1),
        referensiPembayaran: z.string().optional(),
        catatanValidasi: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.tagihan.update({
        where: { id: input.id },
        data: {
          status: StatusTagihan.SUDAH_BAYAR,
          tanggalBayar: new Date(input.tanggalBayar),
          metodePembayaran: input.metodePembayaran,
          referensiPembayaran: input.referensiPembayaran,
          validatorId: ctx.user.id,
          validasiAt: new Date(),
          catatanValidasi: input.catatanValidasi,
        },
      })
    }),

  // ── Rekap tagihan bulanan (untuk halaman laporan) ──────────
  rekap: protectedProcedure
    .input(
      z.object({
        tahun: z.number().int().min(2020).max(2099),
        bulan: z.number().int().min(1).max(12),
        seksiCaterId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const periodeAwal = new Date(input.tahun, input.bulan - 1, 1)
      const periodeAkhir = new Date(input.tahun, input.bulan, 1)

      const where: Record<string, unknown> = {
        periode: { gte: periodeAwal, lt: periodeAkhir },
      }

      const [byStatus, byGolongan, agregat] = await Promise.all([
        // Rekap per status
        prisma.tagihan.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
          _sum: { totalTagihan: true },
        }),
        // Rekap per golongan tarif
        prisma.tagihan.findMany({
          where,
          include: {
            pelanggan: {
              select: {
                tarifGolongan: {
                  select: { kode: true, nama: true, kategori: true },
                },
              },
            },
          },
        }),
        prisma.tagihan.aggregate({
          where,
          _sum: {
            totalTagihan: true,
            pemakaianM3: true,
            jmlHargaAir: true,
            denda: true,
          },
          _count: { _all: true },
          _avg: { pemakaianM3: true },
        }),
      ])

      return {
        periode: { tahun: input.tahun, bulan: input.bulan },
        byStatus,
        byGolongan,
        agregat,
      }
    }),

  // ── Detail satu tagihan ───────────────────────────────────
  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.tagihan.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          pelanggan: {
            select: {
              nomorLangganan: true,
              nama: true,
              alamat: true,
              tarifGolongan: { select: { kode: true, nama: true } },
              rute: { select: { kode: true } },
            },
          },
          pembacaan: {
            select: {
              standLalu: true,
              standAkhir: true,
              pemakaianM3: true,
              kondisi: true,
            },
          },
          validator: { select: { id: true, name: true } },
        },
      })
    }),
})
