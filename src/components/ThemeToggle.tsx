// src/components/layout/navbar/theme-toggle-icon.tsx
//
// Ini BUKAN sistem theme baru — logic-nya 100% sama dengan ThemeToggle.tsx
// kamu yang sudah ada (localStorage key "theme", cycle auto -> light -> dark,
// data-theme attr, media query listener untuk mode "auto").
//
// Bedanya cuma tampilan: dibuat jadi icon-button kecil (h-8 w-8) dengan
// sun/moon/monitor icon, supaya proporsional ditaruh di pojok navbar
// bersebelahan dengan avatar user — style chip/pill original kamu lebih
// cocok dipakai di landing page / area yang lebih lega.
//
// Kalau ternyata kamu mau tetap pakai versi chip original di navbar juga,
// tinggal import ThemeToggle asli kamu langsung di navbar.tsx, file ini
// bisa diabaikan/dihapus.

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }
  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
}

const LABELS: Record<ThemeMode, string> = {
  light: 'Terang',
  dark: 'Gelap',
  auto: 'Ikuti Sistem',
}

export function ThemeToggleIcon() {
  const [mode, setMode] = useState<ThemeMode>('auto')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  // Hindari mismatch icon saat hydration: sebelum mounted, render placeholder netral
  const Icon = mounted ? ICONS[mode] : Monitor
  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Klik untuk ganti ke light mode.'
      : `Theme mode: ${mode}. Klik untuk ganti mode.`

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="relative h-8 w-8 shrink-0"
    >
      <Icon className={cn('h-4 w-4 transition-transform', mounted && 'scale-100')} />
      <span className="sr-only">{LABELS[mounted ? mode : 'auto']}</span>
    </Button>
  )
}