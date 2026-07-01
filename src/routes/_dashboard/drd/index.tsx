// src/routes/_dashboard/drd/index.tsx
//
// Halaman DRD — satu tab per sheet Excel "DRD_JUNI_2026_PW5_fix.xlsx".
// Menggabungkan seluruh komponen fitur DRD (chart, card, tabel).

'use client'

import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DrdProgresChart } from '@/components/features/drd/drd-progres-chart'
import { DrdProgresTable } from '@/components/features/drd/drd-progres-table'
import { DrdTargetCard } from '@/components/features/drd/drd-target-card'
import { DrdTargetTable } from '@/components/features/drd/drd-target-table'
import { DrdPemakaianTable } from '@/components/features/drd/drd-pemakaian-table'
import { DrdMutasiTable } from '@/components/features/drd/drd-mutasi-table'
import { DrdDomestikTable } from '@/components/features/drd/drd-domestik-table'
import { PageContainer } from '#/components/layout/page/page-container'
import { PageHeader } from '#/components/layout/page/page-header'

export const Route = createFileRoute('/_dashboard/drd/')({
  component: DrdPage,
})

function DrdPage() {
  return (
    <PageContainer
      header={
        <PageHeader
          title="Laporan Mandiri"
          description="Monitoring laporan stand meter yang dikirim pelanggan secara mandiri."
        />
      }
    >
      <Tabs defaultValue="progres" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="progres">Progres</TabsTrigger>
          <TabsTrigger value="target">Target</TabsTrigger>
          <TabsTrigger value="pemakaian">Pemakaian per Golongan</TabsTrigger>
          <TabsTrigger value="mutasi">Penambahan SL</TabsTrigger>
          <TabsTrigger value="domestik">Domestik</TabsTrigger>
        </TabsList>

        <TabsContent value="progres" className="space-y-6">
          <DrdProgresChart />
          <DrdProgresTable />
        </TabsContent>

        <TabsContent value="target" className="space-y-6">
          <DrdTargetCard />
          <DrdTargetTable />
        </TabsContent>

        <TabsContent value="pemakaian">
          <DrdPemakaianTable />
        </TabsContent>

        <TabsContent value="mutasi">
          <DrdMutasiTable />
        </TabsContent>

        <TabsContent value="domestik">
          <DrdDomestikTable />
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
