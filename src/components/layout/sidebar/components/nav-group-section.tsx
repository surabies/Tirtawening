import { useLocation } from '@tanstack/react-router'
import type { NavGroup, NavItem } from '@/types'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu as SidebarMenuRoot,
} from '@/components/ui/sidebar'
import { NavLeaf } from './nav-leaf'
import { NavCollapsible } from './nav-collapsible'

interface NavGroupSectionProps {
  group: NavGroup
  isLast: boolean
}

/**
 * Component untuk render satu group/section dari sidebar menu
 * Menampilkan label group dan semua items di dalamnya
 */
export function NavGroupSection({ group, isLast }: NavGroupSectionProps) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup className={cn('px-2 py-3', !isLast && '')}>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenuRoot className="gap-0.5">
          {group.items.map((item: NavItem) => {
            const hasChildren = item.items && item.items.length > 0
            const isActive = pathname === item.url

            return hasChildren ? (
              <NavCollapsible
                key={item.url + item.title}
                item={item}
                depth={0}
              />
            ) : (
              <NavLeaf
                key={item.url + item.title}
                item={item}
                depth={0}
                isActive={isActive}
              />
            )
          })}
        </SidebarMenuRoot>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
