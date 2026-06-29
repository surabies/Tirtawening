import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/pelanggan/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/pelanggan/"!</div>
}
