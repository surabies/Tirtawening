// src/components/layout/sidebar-menu.tsx
import {
  BarChartIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DatabaseIcon,
  DropletIcon,
  FileDownIcon,
  FilePlusIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  Loader2Icon,
  ReceiptIcon,
  ScissorsIcon,
  SettingsIcon,
  UserCogIcon,
  UsersIcon,
  Map,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useNav } from '@/hooks/use-nav'
import type { NavGroup, NavItem } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboardIcon,
  'chart-bar': BarChartIcon,
  users: UsersIcon,
  'file-plus': FilePlusIcon,
  scissors: ScissorsIcon,
  clipboard: ClipboardIcon,
  camera: CameraIcon,
  'calendar-check': CalendarCheckIcon,
  receipt: ReceiptIcon,
  receiptText: ReceiptIcon,
  droplet: DropletIcon,
  fileText: FileTextIcon,
  fileDown: FileDownIcon,
  userCog: UserCogIcon,
  database: DatabaseIcon,
  settings: SettingsIcon,
  peta: Map,
}

function NavIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = ICON_MAP[name] ?? BookOpenIcon
  return <Icon className="size-4 shrink-0" />
}

function NavLeaf({ item }: { item: NavItem }) {
  const { pathname } = useLocation()
  // Perbaikan: Gunakan startsWith jika url dashboard dinamis, atau exact match
  const isActive = pathname === item.url

  return (
    <Link
      to={item.url}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground w-full',
        isActive && 'bg-accent font-medium text-foreground',
      )}
    >
      {/* Hanya render jika item memiliki icon murni */}
      {item.icon && <NavIcon name={item.icon} />}
      <span>{item.title}</span>
      {item.shortcut && (
        <span className="ml-auto flex gap-0.5">
          {item.shortcut.map((k: string) => (
            <kbd
              key={k}
              className="rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground"
            >
              {k}
            </kbd>
          ))}
        </span>
      )}
    </Link>
  )
}

function NavCollapsible({ item }: { item: NavItem }) {
  const { pathname } = useLocation()

  // Cek apakah ada rute anak atau cucu yang sedang aktif saat ini
  const isChildActive =
    item.items?.some((sub: NavItem) => {
      if (pathname === sub.url || pathname.startsWith(sub.url)) return true
      if (sub.items?.some((grand: NavItem) => pathname === grand.url))
        return true
      return false
    }) ?? false

  const [open, setOpen] = useState(isChildActive)

  // Sinkronisasi state open jika user berpindah halaman eksternal
  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive, pathname])

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors',
          'hover:bg-accent hover:text-foreground',
          isChildActive && 'text-foreground font-medium',
        )}
      >
        <NavIcon name={item.icon} />
        <span className="flex-1 text-left">{item.title}</span>
        {open ? (
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Render Rekursif: Bisa membaca kedalaman berapapun */}
      {open && item.items && item.items.length > 0 && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.items.map((sub: NavItem) =>
            sub.items && sub.items.length > 0 ? (
              <NavCollapsible key={sub.url + sub.title} item={sub} />
            ) : (
              <NavLeaf key={sub.url + sub.title} item={sub} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function NavGroupSection({ group }: { group: NavGroup }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {group.label}
      </p>
      <div className="flex flex-col gap-0.5">
        {group.items.map((item: NavItem) =>
          item.items && item.items.length > 0 ? (
            <NavCollapsible key={item.url + item.title} item={item} />
          ) : (
            <NavLeaf key={item.url + item.title} item={item} />
          ),
        )}
      </div>
    </div>
  )
}

export default function SidebarMenu() {
  const { groups, isLoading } = useNav()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        <span>Memuat menu…</span>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        Tidak ada menu tersedia.
      </p>
    )
  }

  return (
    <div className="w-full space-y-1">
      {groups.map((group: NavGroup) => (
        <NavGroupSection key={group.label} group={group} />
      ))}
    </div>
  )
}
