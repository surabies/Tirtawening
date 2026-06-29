import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'

import { TRPCProvider } from './react'
import { trpcClient } from './client'

export function AppTRPCProvider({
  children,
  queryClient,
}: {
  children: ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
