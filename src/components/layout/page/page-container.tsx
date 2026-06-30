import * as React from 'react'

import { cn } from '@/lib/utils'
import { layout } from '@/lib/layout'

import { PageContent } from './page-content'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode

  header?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode

  /**
   * Lebar penuh tanpa batas sama sekali (mengikuti lebar <main>).
   * Hindari untuk halaman biasa. Untuk halaman map/peta, pakai `maxWidth`
   * dengan nilai custom, bukan `fluid`, supaya tetap terbatas di monitor
   * ultra-wide.
   */
  fluid?: boolean

  /**
   * Override max-width default (layout.pageMaxWidth / max-w-7xl).
   * Berguna untuk halaman yang butuh lebih lega dari 1280px tapi tetap
   * harus dibatasi, misalnya 'max-w-[1600px]'.
   * Diabaikan jika `fluid` true.
   */
  maxWidth?: string
}

export function PageContainer({
  children,
  header,
  toolbar,
  footer,
  fluid = false,
  maxWidth,
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
        !fluid && `mx-auto ${maxWidth ?? layout.pageMaxWidth}`,
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
