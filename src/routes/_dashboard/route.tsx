// src/routes/_dashboard/route.tsx
//
// PERBAIKAN: DashboardLayout tidak lagi merender elemen <main> kedua di
// dalam children yang dilempar ke <Sidebar>.
//
// FAKTA TERVERIFIKASI dari source code resmi shadcn/ui (ui/sidebar.tsx):
//
//   const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<'main'>>(
//     (props, ref) => <main ref={ref} className="relative flex min-h-svh flex-1 flex-col bg-background ..." {...props} />
//   )
//
// SidebarInset SUDAH berupa elemen <main> bawaan, lengkap dengan
// "flex flex-1 flex-col" sendiri. Versi lama membungkus {Navbar + <main>}
// dalam <div className="flex h-screen flex-col overflow-hidden"> sebelum
// dilempar sebagai children ke <Sidebar> — children itu akhirnya dirender
// PERSIS di dalam <SidebarInset>, sehingga hasil akhirnya:
//
//   <main>                              ← dari SidebarInset (shadcn/ui)
//     <div class="flex h-screen ...">   ← wrapper manual lama (DIHAPUS)
//       <Navbar />
//       <main>...</main>                ← <main> KEDUA — nested, invalid HTML
//     </div>
//   </main>
//
// Ini bukan kesalahan kosmetik semata: dua elemen <main> nested melanggar
// HTML living standard (hanya boleh ada satu <main> per "main content
// area" yang tidak nested di dalam <main> lain), sudah pernah dilaporkan
// sebagai isu resmi di shadcn-ui/ui (discussion #6057), dan berisiko
// membingungkan screen reader / landmark navigation karena ada dua
// landmark "main" yang bertumpuk untuk satu area konten yang sama.
//
// Perbaikannya: children sekarang langsung berupa Navbar + area scroll
// (pakai <div>, bukan <main> kedua), memanfaatkan flex-1/flex-col yang
// SUDAH disediakan oleh SidebarInset itu sendiri — tidak perlu wrapper
// div h-screen/flex-col tambahan di luar itu.

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Navbar, NavbarProvider } from '@/components/layout/navbar'
import { AppSidebar } from '#/components/layout/sidebar/sidebar'

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
] as const

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: ({ context, location }) => {
    if (!context.session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      })
    }

    const { role, status } = context.session.user as {
      role: string
      status: string
    }

    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      throw redirect({ to: '/login' })
    }

    if (!ALLOWED_ROLES.includes(role as any)) {
      throw redirect({ to: '/unauthorized' })
    }

    const path = location.pathname

    // Super admin only routes
    if (path.startsWith('/admin/konfigurasi')) {
      if (role !== 'SUPER_ADMIN') {
        throw redirect({ to: '/' })
      }
    }

    // Management routes (SUPER_ADMIN, DIREKSI, SENIOR_MANAGER only)
    const MANAGEMENT_ROUTES = [
      '/admin',
      '/admin/users',
      '/laporan/petugas',
      '/laporan/ekspor',
      '/referensi',
    ]
    const isManagementRoute = MANAGEMENT_ROUTES.some((r) => path.startsWith(r))
    if (isManagementRoute) {
      const managementRoles = ['SUPER_ADMIN', 'DIREKSI', 'SENIOR_MANAGER']
      if (!managementRoles.includes(role)) {
        throw redirect({ to: '/' })
      }
    }
  },

  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <NavbarProvider>
      {/* children di sini dirender LANGSUNG di dalam <SidebarInset>, yang
          sudah berupa <main className="flex flex-1 flex-col min-h-svh ...">
          bawaan shadcn/ui (lihat sidebar.tsx). Karena itu sudah ada <main>,
          area scroll konten di bawah memakai <div>, bukan <main> kedua —
          menghindari nested <main> yang invalid sekaligus tetap
          memanfaatkan flex-1/flex-col yang sudah disediakan SidebarInset. */}
      <AppSidebar>
        <Navbar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </AppSidebar>
    </NavbarProvider>
  )
}
