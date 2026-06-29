import * as React from 'react'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PageErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  error?: Error
  onRetry?: () => void
}

export function PageError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while loading this page.',
  error,
  onRetry,
  className,
  ...props
}: PageErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-5 py-16',
        className,
      )}
      {...props}
    >
      <AlertTriangle className="size-10 text-destructive" />

      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="text-sm text-muted-foreground">{description}</p>

        {process.env.NODE_ENV === 'development' && error && (
          <pre className="mt-4 overflow-auto rounded-md bg-muted p-3 text-left text-xs">
            {error.message}
          </pre>
        )}
      </div>

      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  )
}
