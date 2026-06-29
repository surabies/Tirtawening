import * as React from 'react'

import { cn } from '@/lib/utils'
import { layout } from '@/lib/layout'

import { PageContent } from './page-content'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode

  header?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode

  fluid?: boolean
}

export function PageContainer({
  children,
  header,
  toolbar,
  footer,
  fluid = false,
  className,
  ...props
}: PageContainerProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-1 flex-col',
        layout.pageGap,
        layout.pagePadding,
        layout.pagePaddingY,
        !fluid && `mx-auto ${layout.pageMaxWidth}`,
        className,
      )}
      {...props}
    >
      {header}

      {toolbar}

      <PageContent>{children}</PageContent>

      {footer}
    </section>
  )
}
