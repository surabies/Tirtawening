/**
 * Main export file for sidebar module
 * Re-export public components dan constants
 */

// Main components
export { Sidebar } from './sidebar'
export { default as SidebarMenu } from './sidebar-menu'

// Sub-components (opsional untuk direct import)
export { NavIcon, NavLeaf, NavCollapsible, NavGroupSection } from './components'

// Constants (opsional untuk direct import)
export {
  ICON_MAP,
  DEFAULT_ICON,
  SIDEBAR_ITEM_CLASS,
  SIDEBAR_ICON_CLASS,
  SIDEBAR_CHEVRON_CLASS,
  SIDEBAR_SHORTCUT_CLASS,
  SIDEBAR_NESTED_LIST_CLASS,
} from './constants'
