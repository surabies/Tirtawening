import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useNavbar } from '@/components/layout/navbar'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { LaporanMandiriStats } from '@/components/features/laporan-mandiri/laporan-mandiri-stats'
import { LaporanMandiriTable } from '@/components/features/laporan-mandiri/laporan-mandiri-table'

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_dashboard/laporan-mandiri/')({
  component: LaporanMandiriPage,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPeriodeOptions(bulanTerakhir = 12) {
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
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyymm = d.getFullYear() * 100 + (d.getMonth() + 1)
    opts.push({
      value: yyyymm,
      label: `${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`,
    })
  }
  return opts
}

// ── Page ──────────────────────────────────────────────────────────────────────

function LaporanMandiriPage() {
  const trpc = useTRPC()
  const { setContent } = useNavbar()

  useEffect(() => {
    setContent(null)
    return () => setContent(null)
  }, [setContent])

  const statsQuery = useQuery(trpc.laporanMandiri.stats.queryOptions({}))

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
      <LaporanMandiriStats
        data={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />
      <LaporanMandiriTable periodeOptions={periodeOptions} />
    </PageContainer>
  )
}
