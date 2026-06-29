import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  onClose: () => void
}

/** Tampilan saat data detail gagal dimuat atau tidak ditemukan. */
export function ErrorState({ onClose }: ErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertCircle className="mb-2 size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        Data tidak ditemukan.
      </p>
      <p className="mb-4 max-w-[200px] text-xs text-muted-foreground">
        Mungkin data telah dihapus atau terjadi kesalahan jaringan.
      </p>
      <button
        onClick={onClose}
        className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
      >
        Tutup & Kembali
      </button>
    </div>
  )
}
