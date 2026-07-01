import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page/page-container'
import { PageHeader } from '@/components/layout/page/page-header'
import { PencatatKpiGrid } from '@/components/features/kpi-pencatat/pencatat-kpi.grid.tsx'

export const Route = createFileRoute('/_dashboard/kpi-pencatat/')({
  component: PencatatKpiPage,
})

function PencatatKpiPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="KPI Pencatat Meter"
          description="Progres target, akurasi, dan temuan anomali per pencatat periode aktif."
        />
      }
    >
      <PencatatKpiGrid />
    </PageContainer>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> 8b696d79f286150c672cdb14837590f9f63f88d6
