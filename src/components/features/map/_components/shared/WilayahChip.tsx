interface WilayahChipProps {
  label: string
  value: string
}

/** Chip label-value kecil untuk info wilayah PDAM (Seksi Cater, Rute, Zona). */
export function WilayahChip({ label, value }: WilayahChipProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate rounded bg-muted/60 px-2 py-0.5 font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}
