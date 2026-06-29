import { createFileRoute } from '@tanstack/react-router'
import { LaporMeterView } from '#/components/features/lapor-meter/_components/lapor-meter-view'

export const Route = createFileRoute('/_public/lapor-meter/')({
  component: LaporMeterView,
})
