import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { MenuIcon, XIcon, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import SidebarMenu from './sidebar-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import logo from '@/assets/images/logo.png'

import { toast } from 'sonner'

export function Sidebar() {
  return (
    <SidebarContainer>
      <SidebarMenu />
    </SidebarContainer>
  )
}

function SidebarContainer({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // 🔄 State untuk loading saat logout
  const location = useLocation()
  const router = useRouter()

  useEffect(() => {
    setActive(false)
  }, [location.pathname])

  // 🛠️ Fungsi handler untuk keluar aplikasi
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            toast.success('Berhasil keluar!')
            // Membersihkan state aplikasi dan redirect penuh ke login
            window.location.href = '/auth/sign-in'
          },
          onError: () => {
            toast.error('Gagal keluar. Silakan coba lagi.')
          },
        },
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {/* Backdrop mobile */}
      {active && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setActive(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed top-0 left-0 z-40 flex h-screen w-72 flex-col',
          'border-r border-border bg-card transition-transform duration-200',
          '-translate-x-72 lg:translate-x-0',
          active && 'translate-x-0',
        )}
      >
        {/* Tombol toggle mobile */}
        <div className="absolute -right-12 flex h-16 items-center lg:hidden">
          <Button
            onClick={() => setActive((p) => !p)}
            size="icon"
            variant="outline"
            className="bg-card"
          >
            {active ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </Button>
        </div>

        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 ml-2">
          <Link
            to="/overview"
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
        </div>

        {/* Menu (slot children) */}
        <div className="hide-scrollbar flex-1 overflow-auto p-4">
          {children}
        </div>

        {/* Footer sidebar */}
        <div className="relative border-t border-border bg-card">
          <div className="pointer-events-none absolute right-0 bottom-full left-0 h-8 bg-linear-to-t from-card to-transparent" />
          <div className="flex items-center gap-2 p-3">
            <a
              href="https://tanstack.com/start/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Docs
            </a>
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex h-10 flex-1 items-center justify-center gap-2 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut
                size={16}
                className={cn(isLoggingOut && 'animate-spin')}
              />
              {isLoggingOut ? 'Keluar...' : 'Keluar'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
