import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useNavbar } from '@/components/layout/navbar'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { LaporanMandiriStats } from '@/components/features/laporan-mandiri/laporan-mandiri-stats'
import { LaporanMandiriTable } from '@/components/features/laporan-mandiri/laporan-mandiri-table'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Membuat opsi periode bulan ke belakang secara dinamis dan memoized.
 * Dibuat murni (pure function) di luar komponen agar tidak di-recreate.
 */
function buildPeriodeOptions(
  bulanTerakhir = 12,
): { value: number; label: string }[] {
  const BULAN = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  const now = new Date()
  const opts: { value: number; label: string }[] = []

  for (let i = 0; i < bulanTerakhir; i++) {
    // Menggunakan safe date transition untuk menghindari bug penanggalan akhir bulan (e.g. 31 Jan ke Feb)
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyymm = d.getFullYear() * 100 + (d.getMonth() + 1)

    opts.push({
      value: yyyymm,
      label: `${BULAN[d.getMonth() + 1] ?? ''} ${d.getFullYear()}`,
    })
  }
  return opts
}

// ── Page Component ────────────────────────────────────────────────────────────

function LaporanMandiriPage() {
  const trpc = useTRPC()
  const { setContent } = useNavbar()

  // Sinkronisasi konten Navbar dengan pengaman dependensi murni
  useEffect(() => {
    setContent(null)
    // Cleanup hanya dilakukan jika komponen benar-benar unmount menuju halaman non-dashboard
    return () => {
      setContent(null)
    }
  }, [setContent])

  // Fetching data dengan tRPC + react-query
  const statsQuery = useQuery(
    trpc.laporanMandiri.stats.queryOptions(
      {},
      {
        // Menambahkan opsi ketangguhan (staleTime) agar tidak dikueri berulang-ulang dalam waktu dekat
        staleTime: 5 * 60 * 1000,
        // Mencegah crash jika request gagal total
        retry: 1,
      },
    ),
  )

  // Memastikan pembentukan opsi periode hanya dieksekusi sekali (0 overhead)
  const periodeOptions = useMemo(() => buildPeriodeOptions(12), [])

  return (
    <PageContainer
      header={
        <PageHeader
          title="Laporan Mandiri"
          description="Monitoring laporan stand meter yang dikirim pelanggan secara mandiri."
        />
      }
    >
      {/* Fallback data kosong `|| null/undefined` dihandle dengan melemparkan data aman ke komponen */}
      <LaporanMandiriStats
        data={statsQuery.data ?? undefined}
        isLoading={statsQuery.isLoading || statsQuery.isFetching}
      />

      <LaporanMandiriTable periodeOptions={periodeOptions} />
    </PageContainer>
  )
}

// ── Route Registration ────────────────────────────────────────────────────────
// Ditaruh di paling bawah untuk menjamin LaporanMandiriPage sudah ter-hoist dengan sempurna oleh Bun/Vite

export const Route = createFileRoute('/_dashboard/laporan-mandiri/')({
  component: LaporanMandiriPage,
})
