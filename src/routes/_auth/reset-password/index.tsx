// src/routes/_auth/reset-password.tsx → URL: /reset-password?token=xxx
//
// BetterAuth mengirim link reset ke email dengan format:
//   https://app.tirtawening.id/reset-password?token=<token>
// Pastikan di auth config, resetPasswordCallbackURL = '/reset-password'

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/_auth/reset-password/')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  return <ResetPasswordForm token={token} />
}
