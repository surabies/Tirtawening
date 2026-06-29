import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          PERUMDA Tirtawening
        </h1>
        <p className="text-muted-foreground text-sm">
          Sistem Informasi Manajemen PDAM
        </p>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Masuk
      </Link>
    </div>
  )
}
