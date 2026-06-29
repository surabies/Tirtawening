import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/unauthorized')({
  component: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Akses Ditolak</h1>
        <p className="text-muted-foreground">
          Akun kamu belum memiliki izin untuk mengakses sistem.
        </p>
        <Link to="/login">Kembali ke halaman masuk</Link>
      </div>
    </div>
  ),
})
