import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import logo from '@/assets/images/logo.png'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/cek-tagihan', label: 'Cek Tagihan' },
  { to: '/lapor-meter', label: 'Lapor Meter' },
] as const

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Tutup menu otomatis saat pindah halaman
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Kunci scroll body saat menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-20',
        'border-b border-border',
        'bg-background/80 backdrop-blur',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <img
            src={logo}
            alt="Logo Tirtacater"
            width={40}
            height={40}
            className="rounded-full border border-border/40 bg-card p-1 shadow-[0_2px_12px_rgb(0,0,0,0.06)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] md:h-[46px] md:w-[46px] md:p-1.5"
          />
          <span className="text-base font-semibold md:text-lg">
            Tirtawening
          </span>
        </Link>

        {/* Menu desktop */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname === link.to && 'font-medium text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/login"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            Login
          </Link>
        </nav>

        {/* Tombol hamburger — mobile saja */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Dropdown menu mobile */}
      <div
        className={cn(
          'grid overflow-hidden border-border transition-[grid-template-rows] duration-200 ease-out md:hidden',
          open ? 'grid-rows-[1fr] border-t' : 'grid-rows-[0fr]',
        )}
      >
        <nav className="min-h-0">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    pathname === link.to &&
                      'bg-accent font-medium text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <Link
                to="/login"
                className="block rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
