// Shared low-level UI primitives used across hasil-tagihan tabs.
// Keep these pure — no business logic, no data fetching.

import { cn } from "@/lib/utils"
import { formatRupiah } from "./hasil-tagihan.types"

// ─── Field Label ──────────────────────────────────────────────────────────────

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}

// ─── Field Value ──────────────────────────────────────────────────────────────

interface FieldValueProps {
  children: React.ReactNode
  mono?: boolean
  className?: string
}

export function FieldValue({
  children,
  mono = false,
  className,
}: FieldValueProps) {
  return (
    <p
      className={cn(
        "text-sm font-medium text-foreground",
        mono && "font-mono",
        className
      )}
    >
      {children}
    </p>
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

export function StatusDot({ className }: { className: string }) {
  return (
    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", className)} />
  )
}

// ─── Biaya Row ────────────────────────────────────────────────────────────────

interface BiayaRowProps {
  label: string
  value: number | bigint
  accent?: boolean
  last?: boolean
}

export function BiayaRow({
  label,
  value,
  accent = false,
  last = false,
}: BiayaRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5",
        !last && "border-b border-dashed border-border/60"
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums",
          accent ? "text-destructive" : "text-foreground"
        )}
      >
        {formatRupiah(value)}
      </span>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}
