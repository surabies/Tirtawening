import { useLocation } from '@tanstack/react-router'
import type { NavItem } from '@/types'

/**
 * Hook untuk mengecek apakah route saat ini aktif
 * Mendukung path exact match dan path prefix matching
 */
export function useActiveRoute() {
  const { pathname } = useLocation()

  /**
   * Cek apakah route item aktif (exact match)
   */
  const isRouteActive = (url: string): boolean => {
    return pathname === url
  }

  /**
   * Cek apakah child item aktif (includes nested items)
   */
  const isChildActive = (items: NavItem[] | undefined): boolean => {
    if (!items || items.length === 0) return false

    return items.some((sub: NavItem) => {
      // Exact match atau prefix match untuk child
      if (pathname === sub.url || pathname.startsWith(sub.url)) return true
      // Cek grandchild juga (nested 2 level)
      if (sub.items?.some((grand: NavItem) => pathname === grand.url))
        return true
      return false
    })
  }

  return {
    pathname,
    isRouteActive,
    isChildActive,
  }
}
