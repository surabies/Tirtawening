import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavbar } from '@/components/layout/navbar'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { LaporanHarianMatrixTable } from '@/components/features/laporan-harian/laporan-harian-table'

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/_dashboard/laporan-harian/')({
  component: LaporanHarianPage,
})

// ── Page ──────────────────────────────────────────────────────────────────────

function LaporanHarianPage() {
  const { setContent } = useNavbar()

  useEffect(() => {
    setContent(null)
    return () => setContent(null)
  }, [setContent])

  return (
    <PageContainer
      header={
        <PageHeader
          title="Laporan Harian Pencatatan"
          description="Progres pencatatan stand meter per petugas, per tanggal."
        />
      }
    >
      <LaporanHarianMatrixTable />
    </PageContainer>
  )
}
