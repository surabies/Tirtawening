import { createFileRoute } from '@tanstack/react-router'
import { CekTagihanView } from '#/components/features/cek-tagihan/cek-tagihan-view'

export const Route = createFileRoute('/_public/cek-tagihan/')({
  component: CekTagihanView,
})
