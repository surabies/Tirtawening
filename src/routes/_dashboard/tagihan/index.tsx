import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { TagihanTable } from '@/components/features/tagihan/tagihan-table'

export const Route = createFileRoute('/_dashboard/tagihan/')({
  component: TagihanPage,
})

function TagihanPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Tagihan"
          description="Daftar tagihan pelanggan periode aktif."
        />
      }
    >
      <TagihanTable />
    </PageContainer>
  )
}
