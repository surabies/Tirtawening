// src/routes/_auth/two-factor/index.tsx → URL: /two-factor

import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorForm } from '#/components/features/auth/two-factor-form'

export const Route = createFileRoute('/_auth/two-factor/')({
  component: TwoFactorPage,
})

function TwoFactorPage() {
  return <TwoFactorForm />
}
