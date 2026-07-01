import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/kpi-pencatat/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/kpi-pencatat/"!</div>
}
