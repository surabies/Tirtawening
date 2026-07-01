import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { ClosingHistoryTable } from '@/components/features/closing/closing-history-table'

export const Route = createFileRoute('/_dashboard/closing/history/')({
  component: ClosingHistoryPage,
})

function ClosingHistoryPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Histori Closing"
          description="Lihat daftar closing sebelumnya beserta status dan sumber data."
        />
      }
    >
      <ClosingHistoryTable />
    </PageContainer>
  )
}
