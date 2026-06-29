// src/routes/auth/_components/auth-left-panel.tsx
import { cn } from '@/lib/utils'
import { InteractiveGridPattern } from './-interactive-grid'

interface AuthLeftPanelProps {
  quote?: string
  author?: string
}

export function AuthLeftPanel({
  quote = 'Sistem ini membantu kami mengelola data pelanggan PDAM dengan lebih efisien dan terstruktur.',
  author = 'Tim Tirtawening',
}: AuthLeftPanelProps) {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden p-10 lg:flex dark:border-r">
      {/* Background — pakai CSS var langsung agar ikut theme light/dark */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--sidebar)' }}
      />

      {/* Interactive Grid dengan mask via inline style */}
      <InteractiveGridPattern
        className={cn('inset-x-0 inset-y-[0%] h-full skew-y-12')}
        style={{
          maskImage:
            'radial-gradient(400px circle at center, white, transparent)',
          WebkitMaskImage:
            'radial-gradient(400px circle at center, white, transparent)',
        }}
      />

      {/* Logo */}
      <div
        className="relative z-20 flex items-center text-lg font-medium"
        style={{ color: 'var(--sidebar-foreground)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-6 w-6"
        >
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        Tirtawening
      </div>

      {/* Quote */}
      <div
        className="relative z-20 mt-auto"
        style={{ color: 'var(--sidebar-foreground)' }}
      >
        <blockquote className="space-y-2">
          <p className="text-lg">&ldquo;{quote}&rdquo;</p>
          <footer
            className="text-sm"
            style={{
              color:
                'color-mix(in oklab, var(--sidebar-foreground) 70%, transparent)',
            }}
          >
            — {author}
          </footer>
        </blockquote>
      </div>
    </div>
  )
}
