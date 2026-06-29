import { Link } from '@tanstack/react-router'
import logo from '@/assets/images/logo.png'
import { cn } from '@/lib/utils'

export function PublicNavbar() {
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
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <img
            src={logo}
            alt="Logo Tirtacater"
            width={46}
            height={46}
            className="rounded-full border border-border/40 bg-card p-1.5 shadow-[0_2px_12px_rgb(0,0,0,0.06)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
          />
          <span className="text-lg font-semibold">Tirtawening</span>
        </Link>

        {/* Menu */}
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            to="/cek-tagihan"
            className="transition-colors hover:text-foreground"
          >
            Cek Tagihan
          </Link>

          <Link
            to="/lapor-meter"
            className="transition-colors hover:text-foreground"
          >
            Lapor Meter
          </Link>

          <Link
            to="/auth/sign-in"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}
