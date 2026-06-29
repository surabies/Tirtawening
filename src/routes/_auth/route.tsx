//
// Layout route untuk semua halaman auth.
// Semua route di bawah /_auth/ otomatis dapat guard ini:
// - Kalau sudah login → redirect ke /overview (atau ?redirect=...)
// - Styling fullscreen dengan overflow scroll
//
// File structure:
//   src/routes/_auth.tsx          ← ini (layout)
//   src/routes/_auth/login.tsx    ← /login
//   src/routes/_auth/sign-up.tsx  ← /sign-up
//   src/routes/_auth/forgot-password.tsx  ← /forgot-password
//   src/routes/_auth/reset-password.tsx   ← /reset-password?token=xxx
//   src/routes/_auth/two-factor.tsx       ← /two-factor

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, search }) => {
    if (context.session?.user) {
      const redirectTo =
        (search as { redirect?: string })?.redirect ?? '/overview'
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
