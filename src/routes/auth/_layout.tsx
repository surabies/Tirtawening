// src/routes/auth/_layout.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/_layout')({
  beforeLoad: async ({ context, search }) => {
    // Jika sudah login, redirect ke dashboard atau ke URL sebelumnya
    if (context.session?.user) {
      const redirectTo = (search as any)?.redirect ?? '/overview'
      throw redirect({ to: redirectTo })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <Outlet />
    </div>
  )
}
