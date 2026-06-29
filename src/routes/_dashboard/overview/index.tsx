import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/overview/')({
  component: () => <div className="p-6"><h1>Overview</h1></div>,
})
