import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import { AlertCircle, Phone } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SearchForm } from './_components/search-form'
import { HasilTagihan } from './_components/hasil-tagihan'

export type { CekTagihanResult } from './_components/hasil-tagihan'

export function CekTagihanView() {
  const trpc = useTRPC()
  const [query, setQuery] = useState('')

  const { data, isFetching, isError } = useQuery({
    ...trpc.tagihan.cekTagihan.queryOptions({ nomorLangganan: query }),
    enabled: query.length > 0,
  })

  const hasData = data && Array.isArray(data) && data.length > 0
  const notFound = query && !isFetching && data && data.length === 0

  return (
    <div className="min-h-screen bg-background" data-theme="supabase">
      <main className="mx-auto w-full max-w-md space-y-4 px-4 pt-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgb(0,0,0,0.06)]">
          {/* Search Section — header ada di dalam SearchForm */}
          <div className="px-5 pt-5 pb-4">
            <SearchForm onSearch={setQuery} isLoading={isFetching} />
            <div className="mt-4 h-px bg-border/60" />
          </div>

          {/* Error State */}
          {isError && (
            <div className="border-b border-border/60 px-5 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Terjadi kesalahan saat mengambil data. Silakan coba lagi.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Not Found State */}
          {notFound && (
            <div className="border-b border-border/60 px-5 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pelanggan dengan nomor{' '}
                  <strong className="font-bold">&ldquo;{query}&rdquo;</strong>{' '}
                  tidak ditemukan. Periksa kembali nomor pelanggan Anda.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Result — Hanya tampil jika array memiliki isi */}
          {hasData && <HasilTagihan data={data} />}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs leading-relaxed text-muted-foreground">
          Layanan pelaporan mandiri 24 jam. Hubungi Call Center
          <br />
          <a
            href="tel:0221234567"
            className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
          >
            <Phone size={11} />
            (022) 123-4567
          </a>
        </footer>
      </main>
    </div>
  )
}
