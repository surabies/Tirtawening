// src/components/layout/navbar/navbar-context.tsx
import { createContext, useContext, useState, type ReactNode } from 'react'

interface NavbarContextValue {
  /** Slot konten bebas (filter pills, dll) */
  content: ReactNode
  setContent: (node: ReactNode) => void
  /** Judul halaman — dikirim dari halaman lewat useNavbar().setPageTitle() */
  pageTitle: string
  setPageTitle: (title: string) => void
  /** Sub-judul / deskripsi opsional */
  pageDescription: string
  setPageDescription: (desc: string) => void
}

const NavbarContext = createContext<NavbarContextValue | null>(null)

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [pageDescription, setPageDescription] = useState('')

  return (
    <NavbarContext.Provider
      value={{
        content,
        setContent,
        pageTitle,
        setPageTitle,
        pageDescription,
        setPageDescription,
      }}
    >
      {children}
    </NavbarContext.Provider>
  )
}

export function useNavbar() {
  const ctx = useContext(NavbarContext)
  if (!ctx) throw new Error('useNavbar harus dipakai di dalam NavbarProvider')
  return ctx
}
