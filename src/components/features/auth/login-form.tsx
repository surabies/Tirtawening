// src/components/features/auth/login-form.tsx

import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { InteractiveGridPattern } from './interactive-grid'
import logo from '@/assets/images/logo.png'

// ── Schema ────────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email('Masukkan alamat email yang valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoginFormProps {
  redirectTo?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const destination = redirectTo ?? '/overview'

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      try {
        const { error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: destination,
        })

        if (error) {
          const code = (error as { code?: string }).code
          if (code === 'TWO_FACTOR_REQUIRED') {
            await router.navigate({ to: '/two-factor' })
            return
          }
          toast.error(
            code === 'INVALID_EMAIL_OR_PASSWORD'
              ? 'Email atau password salah.'
              : 'Gagal masuk. Coba lagi.',
          )
          return
        }

        await router.navigate({ to: destination })
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleOAuth = async (provider: 'github' | 'google') => {
    await authClient.signIn.social({ provider, callbackURL: destination })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* ── Kolom kiri — dekorasi ── */}
      <div className="relative hidden h-full flex-col p-10 lg:flex border-r border-border/40">
        <div className="absolute inset-0 bg-sidebar" />

        <InteractiveGridPattern
          className={cn('absolute inset-x-0 inset-y-[0%] h-full skew-y-12')}
          style={{
            maskImage:
              'radial-gradient(400px circle at center, white, transparent)',
            WebkitMaskImage:
              'radial-gradient(400px circle at center, white, transparent)',
          }}
        />

        {/* Logo */}
        <div className="relative z-20 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-3 font-semibold tracking-tight text-sidebar-foreground"
          >
            <img
              src={logo}
              alt="Logo Tirtacater"
              width={46}
              height={46}
              className="h-11 w-11 rounded-full border border-border/60 bg-card p-1.5 shadow-sm"
            />
            <span className="text-xl font-bold">Tirtawening</span>
          </Link>
        </div>

        {/* Quote */}
        <div className="relative z-20 mt-auto text-sidebar-foreground">
          <blockquote className="space-y-2 border-l-2 border-sidebar-foreground/20 pl-4">
            <p className="text-lg font-medium">
              &ldquo;Sistem ini membantu kami mengelola data pelanggan PDAM
              dengan lebih efisien dan terstruktur.&rdquo;
            </p>
            <footer className="text-sm text-sidebar-foreground/70">
              — Tim Tirtawening
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ── Kolom kanan — form ── */}
      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email dan password kamu untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field
              name="email"
              validators={{ onChange: signInSchema.shape.email }}
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

            <form.Field
              name="password"
              validators={{ onChange: signInSchema.shape.password }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
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
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Divider OAuth */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              atau masuk dengan
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* OAuth */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('github')}
              disabled={isLoading}
              type="button"
            >
              <GithubIcon />
              Masuk dengan GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              type="button"
            >
              <GoogleIcon />
              Masuk dengan Google
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Belum punya akun?{' '}
            <Link
              to="/sign-up"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

function GithubIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
