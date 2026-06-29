import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/pencatatan/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/pencatatan/"!</div>
}
