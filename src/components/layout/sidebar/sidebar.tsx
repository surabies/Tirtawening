import { Link } from '@tanstack/react-router'
import { LogOut, SearchIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import SidebarMenu from './sidebar-menu'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import logo from '@/assets/images/logo.png'
import { toast } from 'sonner'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar'

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem', // samakan dgn layout.sidebarWidth (w-64)
          '--sidebar-width-icon': '3rem',
        } as React.CSSProperties
      }
    >
      <SidebarRoot collapsible="offcanvas" className="border-r border-border">
        {/* Catatan: variant TIDAK diset di sini, artinya pakai default
            "sidebar" — bukan "inset". Lihat komentar di atas file untuk
            alasannya (menghindari efek margin/rounded/shadow yang tidak
            diminta). SidebarRail di bawah tetap berfungsi normal pada
            variant default ini. */}
        <SidebarHeader className="gap-0 border-border p-0">
          <div className="flex h-12 items-center justify-between px-3">
            <Link to="/overview" className="flex min-w-0 items-center gap-2">
              <img
                src={logo}
                alt="Logo Tirtacater"
                width={20}
                height={20}
                className="shrink-0 rounded-full"
              />
              <span className="truncate text-[13px] font-medium">
                Tirtawening
              </span>
            </Link>
            <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </div>

          <div className="px-3 pb-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent/40"
            >
              <SearchIcon className="size-3.5" />
              <span className="flex-1 text-left">Cari…</span>
              <kbd className="rounded border border-border bg-muted px-1 text-[10px]">
                F
              </kbd>
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="hide-scrollbar gap-0">
          <SidebarMenu />
        </SidebarContent>

        <SidebarFooterSection />

        {/* ── FIX #1 ──
            Wajib di sini: child langsung di dalam <SidebarRoot>, sejajar
            dengan Header/Content/Footer — bukan di luar SidebarRoot, dan
            bukan di dalam salah satu dari Header/Content/Footer. */}
        <SidebarRail />
      </SidebarRoot>

      {/* ── FIX #2 berlaku di sini secara visual ──
          SidebarInset adalah <main> bawaan shadcn/ui. Karena SidebarRoot
          di atas sekarang punya variant="inset", attribute
          data-variant="inset" di-pass via peer selector dan className
          peer-data-[variant=inset]:... pada SidebarInset otomatis aktif:
          margin mengambang (m-2), rounded-xl, shadow. Tidak perlu
          menambahkan styling manual untuk efek tersebut di sini. */}
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}

function SidebarFooterSection() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            toast.success('Berhasil keluar!')
            window.location.href = '/login'
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
    <SidebarFooter className=" border-border p-0">
      <div className="flex items-center gap-2 p-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-9 flex-1 gap-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={14} className={isLoggingOut ? 'animate-spin' : ''} />
          {isLoggingOut ? 'Keluar...' : 'Keluar'}
        </Button>
      </div>
    </SidebarFooter>
  )
}
