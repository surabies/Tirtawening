import { useState, useEffect } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'
import type { NavItem } from '@/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { NavIcon } from './nav-icon'
import { NavLeaf } from './nav-leaf'
import {
  SIDEBAR_ITEM_CLASS,
  SIDEBAR_CHEVRON_CLASS,
  SIDEBAR_NESTED_LIST_CLASS,
} from '../constants/classes'

interface NavCollapsibleProps {
  item: NavItem
  depth: number
}

/**
 * Component untuk render menu item yang memiliki children (collapsible/expandable)
 * Menampilkan chevron icon yang berotasi saat expanded
 * Auto-expand jika child item aktif
 */
export function NavCollapsible({ item, depth }: NavCollapsibleProps) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Cek apakah ada child yang aktif
  const isChildActive =
    item.items?.some((sub: NavItem) => {
      if (pathname === sub.url || pathname.startsWith(sub.url)) return true
      if (sub.items?.some((grand: NavItem) => pathname === grand.url))
        return true
      return false
    }) ?? false

  // Auto-expand jika child aktif
  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive, pathname])

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isChildActive && !open}
            className={SIDEBAR_ITEM_CLASS}
            style={depth > 0 ? { paddingLeft: 10 + depth * 16 } : undefined}
          >
            <NavIcon name={item.icon} />
            <span className="flex-1 truncate text-left">{item.title}</span>
            <ChevronRightIcon
              className={cn(SIDEBAR_CHEVRON_CLASS, open && 'rotate-90')}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* PENTING: bungkus dengan <ul> agar <li> anak tidak nested langsung di <li> induk */}
          <ul className={SIDEBAR_NESTED_LIST_CLASS}>
            {item.items?.map((sub: NavItem) => {
              const subHasChildren = sub.items && sub.items.length > 0
              const subIsActive = pathname === sub.url

              return subHasChildren ? (
                <NavCollapsible
                  key={sub.url + sub.title}
                  item={sub}
                  depth={depth + 1}
                />
              ) : (
                <NavLeaf
                  key={sub.url + sub.title}
                  item={sub}
                  depth={depth + 1}
                  isActive={subIsActive}
                />
              )
            })}
          </ul>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
