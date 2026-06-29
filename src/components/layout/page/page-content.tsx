import * as React from 'react'

import { cn } from '@/lib/utils'

export interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function PageContent({
  children,
  className,
  ...props
}: PageContentProps) {
  return (
    <main
      className={cn('flex min-h-0 w-full flex-1 flex-col', className)}
      {...props}
    >
      {children}
    </main>
  )
}
