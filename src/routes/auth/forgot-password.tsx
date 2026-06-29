// src/routes/auth/forgot-password.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { AuthLeftPanel } from './_components/-auth-left-panel'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      try {
        const { error } = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: '/auth/reset-password',
        })

        if (error) {
          toast.error(error.message ?? 'Gagal mengirim email. Coba lagi.')
          return
        }

        setSubmittedEmail(value.email)
        setIsSubmitted(true)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {!isSubmitted ? (
            <>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Lupa Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Masukkan email kamu dan kami akan mengirim tautan untuk reset
                  password
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
                className="space-y-4"
              >
                <form.Field
                  name="email"
                  validators={{
                    onChange: z
                      .string()
                      .min(1, 'Email wajib diisi')
                      .email('Format email tidak valid'),
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Email</Label>
                      <Input
                        id={field.name}
                        type="email"
                        placeholder="nama@tirtawening.id"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                      {field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">
                            {field.state.meta.errors[0]?.message}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  to="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  <ArrowLeft size={14} />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </>
          ) : (
            // State setelah email terkirim
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Cek Email Kamu
                </h1>
                <p className="text-sm text-muted-foreground">
                  Kami telah mengirim tautan reset password ke{' '}
                  <span className="font-medium text-foreground">
                    {submittedEmail}
                  </span>
                  . Tautan berlaku selama 1 jam.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tidak menerima email? Cek folder spam, atau{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  coba lagi
                </button>
                .
              </p>
              <Link
                to="/auth/sign-in"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                <ArrowLeft size={14} />
                Kembali ke halaman masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
