import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { useNavbar } from '@/components/layout/navbar'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { LaporanHarianStats } from '@/components/features/laporan-harian/laporan-harian-stats'
import { LaporanHarianProgressTable } from '@/components/features/laporan-harian/laporan-harian-table'

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_dashboard/laporan-harian/')({
  component: LaporanHarianPage,
})

// ── Page ──────────────────────────────────────────────────────────────────────

function LaporanHarianPage() {
  const trpc = useTRPC()
  const { setContent } = useNavbar()

  useEffect(() => {
    setContent(null)
    return () => setContent(null)
  }, [setContent])

  const statsQuery = useQuery(trpc.laporanHarian.stats.queryOptions())

  return (
    <PageContainer
      header={
        <PageHeader
          title="Laporan Harian Pencatatan"
          description="Monitoring progres pencatatan stand meter oleh petugas lapangan."
        />
      }
    >
      <LaporanHarianStats
        data={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />
      <LaporanHarianProgressTable />
    </PageContainer>
  )
}
