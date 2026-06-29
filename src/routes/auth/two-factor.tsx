// src/routes/auth/two-factor.tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { AuthLeftPanel } from './_components/-auth-left-panel'

export const Route = createFileRoute('/auth/two-factor')({
  component: TwoFactorPage,
})

function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTrustedDevice, setIsTrustedDevice] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error('Masukkan 6 digit kode verifikasi.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: isTrustedDevice,
      })

      if (error) {
        toast.error(
          error.code === 'INVALID_TWO_FACTOR_CODE'
            ? 'Kode salah atau sudah kadaluarsa. Coba lagi.'
            : (error.message ?? 'Verifikasi gagal.'),
        )
        setCode('')
        inputRef.current?.focus()
        return
      }

      await router.navigate({ to: '/overview' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupCode = async () => {
    if (code.length < 8) {
      toast.error('Masukkan kode backup (8 karakter).')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({ code })
      if (error) {
        toast.error('Kode backup tidak valid.')
        return
      }
      toast.success('Verifikasi berhasil!')
      await router.navigate({ to: '/overview' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Icon + Header */}
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifikasi Dua Faktor
              </h1>
              <p className="text-sm text-muted-foreground">
                Buka aplikasi authenticator kamu dan masukkan kode 6 digit
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input kode OTP — satu input, style besar */}
            <div className="space-y-1.5">
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                className="text-center font-mono text-2xl tracking-[0.5em] h-14"
                autoComplete="one-time-code"
              />
            </div>

            {/* Trusted device */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isTrustedDevice}
                onChange={(e) => setIsTrustedDevice(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Percayai perangkat ini selama 30 hari
            </label>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>
          </form>

          {/* Backup code option */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Tidak bisa mengakses aplikasi authenticator?
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Masukkan kode backup"
                value={code.length > 6 ? code : ''}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="font-mono text-sm"
                maxLength={8}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBackupCode}
                disabled={isLoading}
                className="shrink-0"
              >
                Gunakan
              </Button>
            </div>
          </div>

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
