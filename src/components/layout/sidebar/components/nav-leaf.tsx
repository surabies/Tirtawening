import { Link } from '@tanstack/react-router'
import type { NavItem } from '@/types'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { NavIcon } from './nav-icon'
import {
  SIDEBAR_ITEM_CLASS,
  SIDEBAR_SHORTCUT_CLASS,
} from '../constants/classes'

interface NavLeafProps {
  item: NavItem
  depth: number
  isActive: boolean
}

/**
 * Component untuk render menu item yang tidak memiliki children (leaf node)
 * Menampilkan icon, title, dan optional keyboard shortcut
 */
export function NavLeaf({ item, depth, isActive }: NavLeafProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={SIDEBAR_ITEM_CLASS}
        style={depth > 0 ? { paddingLeft: 10 + depth * 16 } : undefined}
      >
        <Link to={item.url}>
          <NavIcon name={item.icon} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.shortcut && (
            <span className="ml-auto flex gap-0.5">
              {item.shortcut.map((k: string) => (
                <kbd key={k} className={SIDEBAR_SHORTCUT_CLASS}>
                  {k}
                </kbd>
              ))}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
