// src/routes/__root.tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from '@/server/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { getSession } from '@/lib/auth.functions'
import type { AuthUser, Session } from '@/lib/auth'

import NotFound from '@/components/not-found'

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )

const ReactQueryDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )

interface MyRouterContext {
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<AppRouter>
  session?: {
    session: Session
    user: AuthUser
  } | null
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Tirtawening' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  beforeLoad: async () => {
    const session = await getSession()
    return { session: session ?? null }
  },

  component: RootDocument,

  notFoundComponent: () => <NotFound />,
})

function RootDocument() {
  return (
    <html lang="id" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased h-full">
        <Outlet />
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
