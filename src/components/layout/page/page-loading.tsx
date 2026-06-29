import * as React from 'react'

import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface PageLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function PageLoading({
  title = 'Loading...',
  description = 'Please wait while we load the page.',
  className,
  ...props
}: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-4 py-16',
        className,
      )}
      {...props}
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" />

      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
