import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  accent?: string
}

/** Kartu statistik kecil (label + nilai + ikon) dipakai di Kelurahan & Kecamatan. */
export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-base font-semibold ${accent ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}
