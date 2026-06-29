import * as React from 'react'
import { Heading } from '@/components/ui/heading'
import type { InfobarContent } from '@/components/ui/infobar'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  infoContent?: InfobarContent
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  infoContent,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={className} {...props}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Heading
          title={title}
          description={description}
          infoContent={infoContent}
        />

        {actions && <div className="w-full shrink-0 md:w-auto">{actions}</div>}
      </div>
    </header>
  )
}
