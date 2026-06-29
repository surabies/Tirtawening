// src/server/trpc/init.ts
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { createTRPCContext } from './context'

// ── Role hierarchy Tirtawening ─────────────────────────────────
// Sesuaikan urutan ini dengan sistem RBAC kamu di nav-pelayanan.ts
export const ROLE_HIERARCHY: Record<string, number> = {
  USER: 0,
  STAFF: 1,
  SUPERVISOR: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER: 5,
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({ transformer: superjson })

export const router = t.router
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const baseProcedure = t.procedure

// ── Protected: wajib login ────────────────────────────────────
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: { ...ctx, user: ctx.session.user },
  })
})

// ── Role-based: wajib login + minimal role tertentu ───────────
// Contoh: requireRole('MANAGER') → hanya MANAGER, ADMIN, SUPER yang bisa akses
export const requireRole = (minRole: string) =>
  protectedProcedure.use(({ ctx, next }) => {
    const userLevel = ROLE_HIERARCHY[ctx.session!.user.role ?? 'USER'] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0

    if (userLevel < requiredLevel) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Akses ditolak. Diperlukan role minimal: ${minRole}`,
      })
    }
    return next({ ctx })
  })

// ── Divisi-based: cek divisiId user sesuai yang diizinkan ─────
// Contoh: requireDivisi(['DIV-PW5']) → hanya user di divisi PW5
export const requireDivisi = (allowedDivisiIds: string[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    const userDivisi = ctx.session!.user.divisiId

    if (!userDivisi || !allowedDivisiIds.includes(userDivisi)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Akses ditolak. Divisi tidak memiliki izin.',
      })
    }
    return next({ ctx })
  })

// ── SubBagian-based: granular ke level sub-bagian ─────────────
// Contoh: requireSubBagian(['SUB-PW5-CATER', 'SUB-PW5-LANG'])
export const requireSubBagian = (allowedSubBagianIds: string[]) =>
  protectedProcedure.use(({ ctx, next }) => {
    const userSubBagian = ctx.session!.user.subBagianId

    // ADMIN dan SUPER bypass cek subBagian
    const role = ctx.session!.user.role ?? 'USER'
    const isAdmin = ['ADMIN', 'SUPER'].includes(role)

    if (
      !isAdmin &&
      (!userSubBagian || !allowedSubBagianIds.includes(userSubBagian))
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Akses ditolak. Sub-bagian tidak memiliki izin.',
      })
    }
    return next({ ctx })
  })
