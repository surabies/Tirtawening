// src/components/layout/sidebar/sidebar-menu.tsx
import { Loader2Icon } from 'lucide-react'
import { useNav } from '@/hooks/use-nav'
import type { NavGroup } from '@/types'
import { NavGroupSection } from './components'

/**
 * SidebarMenu Component
 * Orchestrator untuk render menu sidebar berdasarkan role dan access control
 *
 * Fitur:
 * - Loading state saat data sedang di-fetch
 * - Empty state jika tidak ada menu tersedia
 * - Render multiple groups dengan border separator
 * - Auto-expand nested items saat route aktif
 */
export default function SidebarMenu() {
  const { groups, isLoading } = useNav()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-4 text-[13px] text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        <span>Memuat menu…</span>
      </div>
    )
  }

  // Empty state
  if (groups.length === 0) {
    return (
      <p className="px-2.5 py-4 text-[13px] text-muted-foreground">
        Tidak ada menu tersedia.
      </p>
    )
  }

  // Render menu groups
  return (
    <>
      {groups.map((group: NavGroup, i: number) => (
        <NavGroupSection
          key={group.label}
          group={group}
          isLast={i === groups.length - 1}
        />
      ))}
    </>
  )
}
