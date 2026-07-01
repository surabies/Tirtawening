import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { ClosingImportForm } from '@/components/features/closing/closing-import-form'

export const Route = createFileRoute('/_dashboard/closing/import/')({
  component: ClosingImportPage,
})

function ClosingImportPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Import ProgresCater"
          description="Unggah file ProgresCater untuk memperbarui data closing bulanan."
        />
      }
    >
      <ClosingImportForm />
    </PageContainer>
  )
}
