// Menggantikan 3 file lama:
//   ✗ features/cater/router/mandiri.router.ts
//   ✗ server/routers/laporan-mandiri.router.ts  (versi ctx.prisma)
//   ✗ server/routers/laporan-mandiri.ts         (versi baseProcedure)

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from '@/server/trpc'
import { prisma } from '@/lib/prisma'
import { StatusLaporanMandiri } from '@/generated/prisma/client'
import { uploadFotoMeter } from '#/components/features/lapor-meter/lib/upload-foto'

const periodeSchema = z
  .number()
  .int()
  .refine((v) => v >= 202001 && v <= 203012, {
    message: 'Periode harus format YYYYMM antara 202001–203012',
  })

function formatPeriodeLabel(yyyymm: number): string {
  const BULAN = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  return `${BULAN[yyyymm % 100]} ${Math.floor(yyyymm / 100)}`
}

export const laporanMandiriRouter = createTRPCRouter({
  cariPelanggan: baseProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return (
        (await prisma.pelanggan.findFirst({
          where: {
            OR: [
              { nomorLangganan: { equals: input.query } },
              { nama: { contains: input.query, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            nomorLangganan: true,
            nama: true,
            alamat: true,
            tarifGolongan: { select: { kategori: true, kodeAsli: true } },
          },
        })) ?? null
      )
    }),

  // BARU — upload foto stand meter dijalankan di server (lewat tRPC),
  // bukan dipanggil langsung dari client. `uploadFotoMeter` memakai SDK
  // `cloudinary` (Node-only, butuh core module `url`/`https`/`fs` dan
  // CLOUDINARY_API_SECRET) yang TIDAK boleh ikut ke bundle browser.
  uploadFoto: baseProcedure
    .input(
      z.object({
        base64: z.string().min(1),
        periode: z.string(),
        tipeFoto: z.enum(['stand', 'segel', 'rumah']),
        nomorLangganan: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return uploadFotoMeter(input)
    }),

  // Dari: laporan-mandiri.ts + laporan-mandiri.router.ts
  cekPeriode: baseProcedure
    .input(
      z.object({
        pelangganId: z.string(),
        periode: periodeSchema,
      }),
    )
    .query(async ({ input }) => {
      return (
        (await prisma.laporanMandiri.findFirst({
          where: { pelangganId: input.pelangganId, periode: input.periode },
          select: { id: true, status: true },
        })) ?? null
      )
    }),

  // Dari: laporan-mandiri.ts + laporan-mandiri.router.ts
  submit: baseProcedure
    .input(
      z.object({
        pelangganId: z.string(),
        nomorLangganan: z.string(),
        periode: periodeSchema,
        standDilaporkan: z.number().int().min(0),
        fotoUrl: z.string().url(),
        fotoPublicId: z.string(),
        nomorPelapor: z.string().min(1),
        namaPelapor: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.laporanMandiri.findFirst({
        where: { pelangganId: input.pelangganId, periode: input.periode },
        select: { id: true, status: true },
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Laporan periode ${input.periode} sudah ada (status: ${existing.status})`,
        })
      }
      return prisma.laporanMandiri.create({
        data: { ...input, status: 'MENUNGGU' },
      })
    }),

  // ══ PROTECTED — dipakai dashboard internal ═════════════════

  // Dari: laporan-mandiri.router.ts (getStats) — unik
  stats: protectedProcedure
    .input(z.object({ periode: periodeSchema.optional() }))
    .query(async ({ input }) => {
      const where = input.periode ? { periode: input.periode } : {}
      const [total, menunggu, diverifikasi, ditolak, digunakan] =
        await Promise.all([
          prisma.laporanMandiri.count({ where }),
          prisma.laporanMandiri.count({
            where: { ...where, status: 'MENUNGGU' },
          }),
          prisma.laporanMandiri.count({
            where: { ...where, status: 'DIVERIFIKASI' },
          }),
          prisma.laporanMandiri.count({
            where: { ...where, status: 'DITOLAK' },
          }),
          prisma.laporanMandiri.count({
            where: { ...where, status: 'DIGUNAKAN' },
          }),
        ])
      return { total, menunggu, diverifikasi, ditolak, digunakan }
    }),

  // Merger: mandiri.router.ts (list) + laporan-mandiri.router.ts (getList)
  // → Pakai select dari laporan-mandiri.router.ts (lebih lengkap)
  list: protectedProcedure
    .input(
      z.object({
        periode: periodeSchema.optional(),
        status: z.nativeEnum(StatusLaporanMandiri).optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit
      const where = {
        ...(input.periode ? { periode: input.periode } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.search
          ? {
              OR: [
                {
                  nomorLangganan: {
                    contains: input.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  namaPelapor: {
                    contains: input.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      }

      const [items, total] = await Promise.all([
        prisma.laporanMandiri.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            nomorLangganan: true,
            periode: true,
            standDilaporkan: true,
            namaPelapor: true,
            nomorPelapor: true,
            status: true,
            fotoUrl: true,
            alasanDitolak: true,
            verifiedAt: true,
            createdAt: true,
            pelanggan: {
              select: {
                nama: true,
                alamat: true,
                seksiCater: { select: { kode: true, nama: true } },
              },
            },
            verifiedBy: { select: { name: true } },
            pembacaan: { select: { id: true, pemakaianM3: true } },
          },
        }),
        prisma.laporanMandiri.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      }
    }),

  // Dari: mandiri.router.ts (antrianVerifikasi)
  antrian: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit
      const where = { status: 'MENUNGGU' as StatusLaporanMandiri }

      const [total, items] = await Promise.all([
        prisma.laporanMandiri.count({ where }),
        prisma.laporanMandiri.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'asc' }, // FIFO
          select: {
            id: true,
            nomorLangganan: true,
            periode: true,
            standDilaporkan: true,
            fotoUrl: true,
            namaPelapor: true,
            nomorPelapor: true,
            createdAt: true,
            pelanggan: { select: { nama: true, alamat: true } },
          },
        }),
      ])

      return {
        items,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      }
    }),

  // Merger: mandiri.router.ts (byId) + laporan-mandiri.router.ts (getById)
  // → Pakai include dari laporan-mandiri.router.ts (lebih dalam)
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const laporan = await prisma.laporanMandiri.findUnique({
        where: { id: input.id },
        include: {
          pelanggan: {
            include: {
              meter: true,
              seksiCater: true,
              tarifGolongan: { select: { kode: true, nama: true } },
            },
          },
          verifiedBy: { select: { id: true, name: true, email: true } },
          pembacaan: true,
        },
      })
      if (!laporan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Laporan tidak ditemukan',
        })
      }
      return laporan
    }),

  // Dari: laporan-mandiri.router.ts (verifikasi) — dipisah dari tolak agar eksplisit
  terima: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const laporan = await prisma.laporanMandiri.findUnique({
        where: { id: input.id },
        select: { status: true },
      })
      if (!laporan)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Laporan tidak ditemukan',
        })
      if (laporan.status !== 'MENUNGGU') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Hanya laporan MENUNGGU yang bisa diterima',
        })
      }
      return prisma.laporanMandiri.update({
        where: { id: input.id },
        data: {
          status: 'DIVERIFIKASI',
          verifiedById: ctx.user.id,
          verifiedAt: new Date(),
        },
      })
    }),

  // Dari: laporan-mandiri.router.ts (tolak)
  tolak: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        alasanDitolak: z.string().min(10, 'Alasan minimal 10 karakter'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const laporan = await prisma.laporanMandiri.findUnique({
        where: { id: input.id },
        select: { status: true },
      })
      if (!laporan)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Laporan tidak ditemukan',
        })
      if (laporan.status !== 'MENUNGGU') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Hanya laporan MENUNGGU yang bisa ditolak',
        })
      }
      return prisma.laporanMandiri.update({
        where: { id: input.id },
        data: {
          status: 'DITOLAK',
          verifiedById: ctx.user.id,
          verifiedAt: new Date(),
          alasanDitolak: input.alasanDitolak,
        },
      })
    }),

  // Dari: laporan-mandiri.router.ts (getTrend) — unik, tidak ada di file lain
  tren: protectedProcedure
    .input(
      z.object({ bulanTerakhir: z.number().int().min(1).max(24).default(6) }),
    )
    .query(async ({ input }) => {
      const now = new Date()
      const periodes: number[] = []
      for (let i = input.bulanTerakhir - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        periodes.push(d.getFullYear() * 100 + (d.getMonth() + 1))
      }

      const rows = await prisma.laporanMandiri.groupBy({
        by: ['periode', 'status'],
        where: { periode: { in: periodes } },
        _count: { id: true },
        orderBy: { periode: 'asc' },
      })

      return periodes.map((p) => {
        const subset = rows.filter((r) => r.periode === p)
        return {
          periode: p,
          label: formatPeriodeLabel(p),
          MENUNGGU: subset.find((r) => r.status === 'MENUNGGU')?._count.id ?? 0,
          DIVERIFIKASI:
            subset.find((r) => r.status === 'DIVERIFIKASI')?._count.id ?? 0,
          DITOLAK: subset.find((r) => r.status === 'DITOLAK')?._count.id ?? 0,
          DIGUNAKAN:
            subset.find((r) => r.status === 'DIGUNAKAN')?._count.id ?? 0,
        }
      })
    }),
})
