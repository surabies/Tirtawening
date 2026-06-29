import type { ReactNode } from "react"

interface DetailFieldProps {
  icon: ReactNode
  label: string
  value: string
}

/** Baris info berlabel dengan ikon, dipakai di kartu-kartu detail. */
export function DetailField({ icon, label, value }: DetailFieldProps) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm leading-snug text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  )
}
