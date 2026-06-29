// src/hooks/use-nav.ts
import { authClient } from '@/lib/auth-client'
import { getSidebarGroups } from '@/types/nav-config'
import type { NavGroup, NavItem, NavAccess } from '@/types'

// ─────────────────────────────────────────────────────────────
// ROLE HIERARCHY
// Angka lebih kecil = rank lebih tinggi.
// Tambah role baru di sini jika ada perubahan struktur organisasi.
// ─────────────────────────────────────────────────────────────
const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 0,
  DIREKSI: 1,
  SENIOR_MANAGER: 2,
  MANAGER: 3,
  SUPERVISOR: 4,
  STAFF: 5,
  USER: 6,
}

// Role dengan rank <= ini bypass cek divisi
const BYPASS_DIVISI_RANK = ROLE_RANK['SENIOR_MANAGER']!

// Role dengan rank <= ini bypass cek subBagian
const BYPASS_SUBBAGIAN_RANK = ROLE_RANK['MANAGER']!

interface UserCtx {
  role: string
  divisiKode: string | null
  subBagianKode: string | null
}

// ─────────────────────────────────────────────────────────────
// ACCESS CHECK
// ─────────────────────────────────────────────────────────────
function canAccess(access: NavAccess | undefined, user: UserCtx): boolean {
  if (!access) return true

  const userRole = user.role ?? 'USER'
  const userRank = ROLE_RANK[userRole] ?? 99

  // SUPER_ADMIN bypass semua tanpa cek apapun
  if (userRole === 'SUPER_ADMIN') return true

  // 1. Cek roles yang diizinkan
  if (access.roles && access.roles.length > 0) {
    if (!(access.roles as string[]).includes(userRole)) return false
  }

  // 2. Cek minimum role
  if (access.minRole) {
    const minRank = ROLE_RANK[access.minRole] ?? 99
    if (userRank > minRank) return false
  }

  // 3. Cek divisi — SENIOR_MANAGER ke atas bypass
  if (access.divisi && userRank > BYPASS_DIVISI_RANK) {
    if (user.divisiKode !== access.divisi) return false
  }

  // 4. Cek subBagian tunggal — MANAGER ke atas bypass
  if (access.subBagian && userRank > BYPASS_SUBBAGIAN_RANK) {
    if (!user.subBagianKode) return false
    if (user.subBagianKode !== access.subBagian) return false
  }

  // 5. Cek subBagian multi (OR logic) — MANAGER ke atas bypass
  if (
    access.subBagianAny &&
    access.subBagianAny.length > 0 &&
    userRank > BYPASS_SUBBAGIAN_RANK
  ) {
    if (!user.subBagianKode) return false
    if (!access.subBagianAny.includes(user.subBagianKode)) return false
  }

  return true
}

// ─────────────────────────────────────────────────────────────
// FILTER HELPERS
// ─────────────────────────────────────────────────────────────
function filterItems(items: NavItem[], user: UserCtx): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    if (!canAccess(item.access, user)) return acc

    if (item.items && item.items.length > 0) {
      const filteredChildren = filterItems(item.items, user)
      // Parent hanya tampil jika minimal 1 anak lolos
      if (filteredChildren.length === 0) return acc
      acc.push({ ...item, items: filteredChildren })
      return acc
    }

    acc.push(item)
    return acc
  }, [])
}

function filterGroups(groups: NavGroup[], user: UserCtx): NavGroup[] {
  return groups.reduce<NavGroup[]>((acc, group) => {
    const filtered = filterItems(group.items, user)
    if (filtered.length === 0) return acc
    acc.push({ ...group, items: filtered })
    return acc
  }, [])
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
export function useNav() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return { groups: [], isLoading: true, isPending }
  if (!session?.user) return { groups: [], isLoading: false, isPending }

  const u = session.user as any

  const userCtx: UserCtx = {
    role: u.role ?? 'USER',
    divisiKode: u.divisiKode ?? null,
    subBagianKode: u.subBagianKode ?? null,
  }

  const groups = filterGroups(getSidebarGroups(), userCtx)
  return { groups, isLoading: false, isPending: false }
}
