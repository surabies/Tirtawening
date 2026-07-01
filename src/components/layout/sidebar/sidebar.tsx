import { Link } from '@tanstack/react-router'
import { SearchIcon, ChevronsUpDownIcon, MessageSquarePlus, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import SidebarMenu from './sidebar-menu'
import { Button } from '@/components/ui/button'
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
} from '@/components/animate-ui/components/radix/sidebar'

export function AppSidebar({ children }: { children: React.ReactNode }) {
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
        <SidebarHeader className="gap-0 p-0">
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

        {/* ── Komponen Footer Feedback ── */}
        <SidebarFooterSection />

        <SidebarRail />
      </SidebarRoot>

      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}

function SidebarFooterSection() {
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async () => {
    setIsSubmitting(true)
    try {
      // Simulasi pengiriman data ke server/API selama 1 detik
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setFeedbackSent(true)
      toast.success('Feedback berhasil dikirim!')
    } catch (error) {
      toast.error('Gagal mengirim feedback. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarFooter className="border-t border-border p-2">
      <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/60 transition-all">
        {feedbackSent ? (
          // Tampilan Selesai Kirim Feedback
          <div className="flex flex-col items-center justify-center py-1">
            <CheckCircle2 className="text-emerald-500 h-5 w-5 animate-bounce" />
            <p className="text-foreground mt-2 text-xs font-semibold">
              Terima Kasih!
            </p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Saran Anda sangat berharga.
            </p>
          </div>
        ) : (
          // Tampilan Awal Tombol Feedback
          <>
            <p className="text-muted-foreground text-xs font-medium mb-2">
              Punya saran atau kendala?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFeedback}
              disabled={isSubmitting}
              className="w-full h-8 gap-1.5 text-xs font-medium shadow-none hover:bg-background"
            >
              <MessageSquarePlus 
                size={13} 
                className={isSubmitting ? 'animate-spin' : 'text-muted-foreground'} 
              />
              {isSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
            </Button>
          </>
        )}
      </div>
    </SidebarFooter>
  )
}