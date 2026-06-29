import * as React from 'react'

import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface PageEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

export function PageEmpty({
  title = 'No data found',
  description = 'There is nothing to display.',
  action,
  className,
  ...props
}: PageEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-5 py-16',
        className,
      )}
      {...props}
    >
      <Inbox className="size-10 text-muted-foreground" />

      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {action}
    </div>
  )
}
