// src/components/features/auth/-forgot-password-form.tsx
//
// Form untuk meminta tautan reset password via email.
// Setelah submit, BetterAuth kirim email dengan link:
//   /reset-password?token=<token>
//
// BUKAN form input password baru — itu ada di -reset-password-form.tsx
//
// Note: `forgetPassword` tidak muncul di type karena plugin twoFactor
// meng-override ReactAuthClient. Casting ke `any` dulu sebagai workaround
// sampai BetterAuth fix type inference-nya dengan multiple plugins.

import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

// Workaround: plugin twoFactor menyempitkan type authClient sehingga
// `forgetPassword` tidak terlihat, padahal method-nya ada saat runtime.
const authClientAny = authClient as unknown as {
  forgetPassword: (opts: {
    email: string
    redirectTo: string
  }) => Promise<{ error: { message?: string } | null }>
}

const forgotSchema = z.object({
  email: z.string().email('Masukkan alamat email yang valid'),
})

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')
  const baseUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000'

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      try {
        const { error } = await authClientAny.forgetPassword({
          email: value.email,
          // 💡 Sekarang URL menjadi dinamis mengikuti environment!
          redirectTo: `${baseUrl}/reset-password`,
        })

        if (error) {
          toast.error(error.message ?? 'Gagal mengirim email. Coba lagi.')
          return
        }

        setSentToEmail(value.email)
        setIsEmailSent(true)
      } finally {
        setIsLoading(false)
      }
    },
  })

  // Tampilan sukses setelah email terkirim
  if (isEmailSent) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="flex h-full items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Terkirim
              </h1>
              <p className="text-sm text-muted-foreground">
                Kami sudah mengirim tautan reset password ke{' '}
                <span className="font-medium text-foreground">
                  {sentToEmail}
                </span>
                . Cek inbox atau folder spam kamu.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Tidak menerima email?{' '}
              <button
                type="button"
                onClick={() => setIsEmailSent(false)}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Kirim ulang
              </button>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft size={14} />
              Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-[65%_35%] lg:px-0">
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Lupa Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email kamu dan kami akan mengirimkan tautan untuk reset
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
              validators={{ onChange: forgotSchema.shape.email }}
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
                        {String(field.state.meta.errors[0])}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </Button>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              <ArrowLeft size={14} />
              Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
