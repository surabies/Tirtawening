/**
 * Tailwind classes untuk styling sidebar components
 * Centralize styling logic untuk maintainability
 */

/**
 * Styling untuk NavItem button (active/inactive state)
 * Dipakai di NavLeaf dan NavCollapsible sebagai override default SidebarMenuButton
 * Gaya flat ala Vercel design
 */
export const SIDEBAR_ITEM_CLASS =
  'gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-normal text-foreground/80 hover:bg-accent/60 hover:text-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-foreground'

/**
 * Sizing untuk icon di sidebar
 * Menggunakan size-[15px] untuk konsistensi dengan design Vercel
 */
export const SIDEBAR_ICON_CLASS = 'size-[15px] shrink-0'

/**
 * Styling untuk chevron/arrow di collapsible item
 */
export const SIDEBAR_CHEVRON_CLASS =
  'size-3.5 shrink-0 text-muted-foreground/60 transition-transform'

/**
 * Styling untuk keyboard shortcut badge
 */
export const SIDEBAR_SHORTCUT_CLASS =
  'rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground'

/**
 * Styling untuk nested items container
 * PENTING: gunakan <ul> untuk menghindari nested <li> langsung di <li> induk
 */
export const SIDEBAR_NESTED_LIST_CLASS =
  'mx-3.5 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/60 pl-3'
