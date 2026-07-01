// src/components/theme/theme-provider.tsx
//
// Theme provider ringan, tanpa dependency next-themes, dibuat khusus supaya
// cocok dengan TanStack Start (SSR + client hydration).
//
// Cara pakai:
//   1. Bungkus root <html> kamu di `src/routes/__root.tsx` dengan <ThemeProvider>
//   2. Taruh <ThemeScript /> di dalam <head>, SEBELUM script lain,
//      supaya class "dark"/"light" diset ke <html> sebelum React hydrate.
//      Ini mencegah flash-of-wrong-theme (FOUC) saat reload.
//   3. Panggil useTheme() di komponen mana pun untuk baca/ubah theme.

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
  } from 'react'
  
  type Theme = 'light' | 'dark' | 'system'
  
  interface ThemeContextValue {
    /** Preferensi yang tersimpan: bisa 'system' */
    theme: Theme
    /** Theme yang benar-benar diterapkan ke DOM: 'light' | 'dark' saja */
    resolvedTheme: 'light' | 'dark'
    setTheme: (theme: Theme) => void
  }
  
  const ThemeContext = createContext<ThemeContextValue | null>(null)
  
  const STORAGE_KEY = 'tirtacater-theme'
  
  function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  
  function applyThemeClass(resolved: 'light' | 'dark') {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.style.colorScheme = resolved
  }
  
  export function ThemeProvider({ children }: { children: ReactNode }) {
    // Default 'system' aman untuk SSR — nilai asli diselaraskan di useEffect
    // client-side (ThemeScript sudah menangani DOM class-nya lebih dulu,
    // jadi tidak ada flash meskipun state React ini "telat" satu tick).
    const [theme, setThemeState] = useState<Theme>('system')
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  
    // Sinkronkan dari localStorage setelah mount (client only)
    useEffect(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
      const initial = stored ?? 'system'
      setThemeState(initial)
      const resolved = initial === 'system' ? getSystemTheme() : initial
      setResolvedTheme(resolved)
    }, [])
  
    // Terapkan ke DOM setiap kali theme berubah
    useEffect(() => {
      const resolved = theme === 'system' ? getSystemTheme() : theme
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }, [theme])
  
    // Ikuti perubahan preferensi OS kalau mode 'system' aktif
    useEffect(() => {
      if (theme !== 'system') return
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        const resolved = getSystemTheme()
        setResolvedTheme(resolved)
        applyThemeClass(resolved)
      }
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }, [theme])
  
    const setTheme = (next: Theme) => {
      setThemeState(next)
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  
    return (
      <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
        {children}
      </ThemeContext.Provider>
    )
  }
  
  export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme harus dipakai di dalam ThemeProvider')
    return ctx
  }
  
  // ---------------------------------------------------------------------------
  // ThemeScript — inline script yang jalan SEBELUM React hydrate.
  // Taruh ini di <head> route root (__root.tsx), sebelum <Scripts /> TanStack.
  // Ini satu-satunya bagian yang boleh "unsafe" (dangerouslySetInnerHTML)
  // karena memang harus jalan sinkron sebelum paint pertama.
  // ---------------------------------------------------------------------------
  
  const themeScript = `
  (function () {
    try {
      var key = '${STORAGE_KEY}';
      var stored = localStorage.getItem(key);
      var theme = stored === 'light' || stored === 'dark' ? stored : null;
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      var root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      root.style.colorScheme = theme;
    } catch (e) {}
  })();
  `
  
  export function ThemeScript() {
    // eslint-disable-next-line react/no-danger
    return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  }