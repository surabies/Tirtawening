// src/routes/auth/reset-password.tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { AuthLeftPanel } from './_components/-auth-left-panel'

// BetterAuth mengirim token sebagai query param ?token=...
const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

function ResetPasswordPage() {
  const router = useRouter()
  const { token } = Route.useSearch()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error('Token tidak valid. Minta ulang tautan reset password.')
        return
      }

      const parsed = resetSchema.safeParse(value)
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message)
        return
      }

      setIsLoading(true)
      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.password,
          token,
        })

        if (error) {
          toast.error(
            error.code === 'INVALID_TOKEN'
              ? 'Tautan sudah kadaluarsa. Minta ulang reset password.'
              : (error.message ?? 'Gagal reset password.'),
          )
          return
        }

        toast.success('Password berhasil diubah!')
        await router.navigate({ to: '/auth/sign-in' })
      } finally {
        setIsLoading(false)
      }
    },
  })

  // Tampilan jika tidak ada token
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Tautan Tidak Valid</h1>
          <p className="text-sm text-muted-foreground">
            Tautan reset password tidak valid atau sudah kadaluarsa.
          </p>
          <Link to="/auth/forgot-password">
            <Button className="mt-2">Minta Tautan Baru</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Masukkan password baru untuk akun kamu
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
              name="password"
              validators={{
                onChange: z.string().min(8, 'Password minimal 8 karakter'),
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Password Baru</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 8 karakter"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ['password'],
                onChange: ({ value, fieldApi }) => {
                  if (!value) {
                    return { message: 'Konfirmasi password wajib diisi' }
                  }
                  if (value !== fieldApi.form.getFieldValue('password')) {
                    return { message: 'Password tidak cocok' }
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Konfirmasi Password</Label>
                  <Input
                    id={field.name}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
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
        </div>
      </div>
    </div>
  )
}
