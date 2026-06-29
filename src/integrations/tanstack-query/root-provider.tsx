import type { ReactNode } from 'react'

import { QueryClient } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import superjson from 'superjson'

import type { AppRouter } from '@/server/trpc/router'
import { AppTRPCProvider } from '@/integrations/trpc/provider'
import { trpcClient } from '@/integrations/trpc/client'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  })

  const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
  })

  return {
    queryClient,
    trpc,
  }
}

export default function TanstackQueryProvider({
  children,
  context,
}: {
  children: ReactNode
  context: ReturnType<typeof getContext>
}) {
  return (
    <AppTRPCProvider queryClient={context.queryClient}>
      {children}
    </AppTRPCProvider>
  )
}
