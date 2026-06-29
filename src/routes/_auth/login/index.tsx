// src/routes/_auth/login/index.tsx → URL: /login

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginForm } from '@/components/features/auth/login-form'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/_auth/login/')({
  validateSearch: searchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  return <LoginForm redirectTo={redirectTo} />
}
