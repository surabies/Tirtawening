import { Link, useRouter } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

export function TwoFactorForm() {
  const router = useRouter()
  const [otpCode, setOtpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTrustedDevice, setIsTrustedDevice] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    otpInputRef.current?.focus()
  }, [])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      toast.error('Masukkan 6 digit kode verifikasi.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: otpCode,
        trustDevice: isTrustedDevice,
      })

      if (error) {
        toast.error(
          error.code === 'INVALID_TWO_FACTOR_CODE'
            ? 'Kode salah atau sudah kadaluarsa. Coba lagi.'
            : (error.message ?? 'Verifikasi gagal.'),
        )
        setOtpCode('')
        otpInputRef.current?.focus()
        return
      }

      await router.navigate({ to: '/overview' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupCodeSubmit = async () => {
    if (backupCode.length < 8) {
      toast.error('Kode backup minimal 8 karakter.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode,
      })
      if (error) {
        toast.error('Kode backup tidak valid.')
        setBackupCode('')
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

          {/* OTP Form */}
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
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
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>
          </form>

          {/* Backup code — state TERPISAH dari otpCode */}
          <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Tidak bisa mengakses aplikasi authenticator?
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Masukkan kode backup"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                disabled={isLoading}
                className="font-mono text-sm"
                maxLength={8}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBackupCodeSubmit}
                disabled={isLoading || backupCode.length < 8}
                className="shrink-0"
              >
                Gunakan
              </Button>
            </div>
          </div>

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
