import type { ReactNode } from 'react'

export type PageState = 'loading' | 'ready' | 'empty' | 'error'

export interface PageContainerProps {
  children: ReactNode

  className?: string
  contentClassName?: string
  headerClassName?: string

  fluid?: boolean
  maxWidth?: string

  state?: PageState

  access?: boolean

  header?: ReactNode
  toolbar?: ReactNode
  footer?: ReactNode

  loadingFallback?: ReactNode
  emptyFallback?: ReactNode
  errorFallback?: ReactNode
  accessFallback?: ReactNode
}
