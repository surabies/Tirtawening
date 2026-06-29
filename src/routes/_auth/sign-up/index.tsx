// src/routes/_auth/sign-up/index.tsx → URL: /sign-up

import { createFileRoute } from '@tanstack/react-router'
import { SignUpForm } from '@/components/features/auth/sign-up-form'

export const Route = createFileRoute('/_auth/sign-up/')({
  component: SignUpPage,
})

function SignUpPage() {
  return <SignUpForm />
}
