import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { ClosingSummary } from '@/components/features/closing/closing-summary'

export const Route = createFileRoute('/_dashboard/closing/')({
  component: ClosingPage,
})

function ClosingPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Proses Closing Bulanan"
          description="Ringkasan status closing dan pemutusan untuk periode aktif."
        />
      }
    >
      <ClosingSummary />
    </PageContainer>
  )
}
