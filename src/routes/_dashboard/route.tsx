// src/routes/_dashboard/route.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/sidebar/sidebar'
import { Navbar, NavbarProvider } from '@/components/layout/navbar'
import { layout } from '@/lib/layout'
import { cn } from '@/lib/utils'

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
        to: '/auth/sign-in',
        search: { redirect: location.pathname },
      })
    }

    const { role, status } = context.session.user as {
      role: string
      status: string
    }

    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      throw redirect({ to: '/auth/sign-in' })
    }

    if (!ALLOWED_ROLES.includes(role as any)) {
      throw redirect({ to: '/unauthorized' })
    }

    const path = location.pathname

    if (path.startsWith('/dashboard/pelayanan/admin/konfigurasi')) {
      if (role !== 'SUPER_ADMIN') {
        throw redirect({ to: '/overview' })
      }
    }

    const MANAGEMENT_ROUTES = [
      '/dashboard/pelayanan/admin',
      '/dashboard/users',
      '/dashboard/pelayanan/laporan/petugas',
      '/dashboard/pelayanan/laporan/ekspor',
      '/dashboard/pelayanan/referensi',
    ]
    const isManagementRoute = MANAGEMENT_ROUTES.some((r) => path.startsWith(r))
    if (isManagementRoute) {
      const managementRoles = ['SUPER_ADMIN', 'DIREKSI', 'SENIOR_MANAGER']
      if (!managementRoles.includes(role)) {
        throw redirect({ to: '/overview' })
      }
    }
  },

  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <NavbarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            layout.sidebarWidth,
          )}
        >
          <Navbar />

          <main className="flex-1 overflow-auto min-h-0">
            <Outlet />
          </main>
        </div>
      </div>
    </NavbarProvider>
  )
}
