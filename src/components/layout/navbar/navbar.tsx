// src/components/layout/navbar/navbar.tsx
//
// Navbar dashboard yang proper:
//   - Kiri: Breadcrumb navigasi + page title + deskripsi
//   - Tengah/kanan: Slot konten (filter pills, tombol aksi, dll)
//   - Scroll-aware: border + blur background muncul saat scroll

import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useNavbar } from './navbar-context'
import { layout } from '@/lib/layout'
import { ChevronRight, Home } from 'lucide-react'
import { ThemeToggleIcon } from '@/components/ThemeToggle.tsx'
import { UserMenu } from './user-menu'

// ── Breadcrumb helper ─────────────────────────────────────────────────────────
// Mengubah path "/dashboard/pencatatan-meter/laporan-mandiri"
// menjadi [{label: 'Dashboard', href: '/dashboard'}, {label: 'Pencatatan Meter', ...}, ...]

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'pencatatan-meter': 'Pencatatan Meter',
  'laporan-mandiri': 'Laporan Mandiri',
  'laporan-harian': 'Laporan Harian',
  'closing-bulanan': 'Closing Bulanan',
  pelanggan: 'Pelanggan',
  tagihan: 'Tagihan',
  map: 'Peta Spasial',
  pengaturan: 'Pengaturan',
  manajemen: 'Manajemen',
  laporan: 'Laporan',
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    label: PATH_LABELS[seg] ?? seg.replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { content, pageTitle, pageDescription } = useNavbar()

  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const crumbs = buildBreadcrumbs(pathname)

  useEffect(() => {
    const onScroll = () => {
      // Shadcn UI default-nya men-scroll window halaman
      setScrolled(window.scrollY > 10)
    }
  
    // Daftarkan event listener ke window global
    window.addEventListener('scroll', onScroll)
    
    // Clean up event listener saat komponen unmount
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex min-h-0 flex-col',
        layout.navbarHeight,
        'transition-all duration-200',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-sm'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      {/* ── Baris utama ── */}
      <div className={cn('flex flex-1 items-center gap-2', layout.pagePadding)}>
        {/* Sidebar trigger button */}

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
        >
          {/* Home icon */}
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            aria-label="Dashboard"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>

          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex shrink-0 items-center gap-1">
              <ChevronRight className="text-muted-foreground/40 h-3.5 w-3.5 shrink-0" />
              {crumb.isLast ? (
                <span className="text-foreground max-w-[200px] truncate text-sm font-medium">
                  {pageTitle || crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href as Parameters<typeof Link>[0]['to']}
                  className="text-muted-foreground hover:text-foreground max-w-[140px] truncate text-sm transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}

          {/* Deskripsi halaman (opsional, tampil kecil di sebelah) */}
          {pageDescription && (
            <span className="text-muted-foreground hidden max-w-[220px] truncate text-xs sm:block">
              — {pageDescription}
            </span>
          )}
        </nav>
        {/* ── Slot konten kanan (filter pills, tombol aksi, dll) ── */}
        {content && (
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            {content}
          </div>
        )}

        {/* ── Theme toggle + avatar user, selalu di ujung kanan ── */}
        <div className="ml-1 flex shrink-0 items-center gap-1.5">
          <div className="bg-border mr-1 hidden h-5 w-px sm:block" />
          <ThemeToggleIcon />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}