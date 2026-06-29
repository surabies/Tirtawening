"use client"

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HasilLaporan } from "./lapor-meter-view"

interface LaporMeterSuksesProps {
  hasil: HasilLaporan
  onReset: () => void
}

export function LaporMeterSukses({ hasil, onReset }: LaporMeterSuksesProps) {
  return (
    <div className="space-y-6 px-5 py-8">
      {/* Icon sukses */}
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Laporan Terkirim
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Laporan stand meter Anda telah kami terima dan akan diverifikasi
            dalam 1×24 jam.
          </p>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* Detail laporan */}
      <div className="space-y-3">
        {[
          { label: "Nama Pelanggan", value: hasil.nama },
          { label: "No. Pelanggan", value: hasil.nomorLangganan, mono: true },
          { label: "Periode", value: hasil.periode },
          {
            label: "Stand Dilaporkan",
            value: `${hasil.stand.toLocaleString("id-ID")} m³`,
            mono: true,
          },
        ].map(({ label, value, mono }) => (
          <div
            key={label}
            className="flex items-start justify-between border-b border-dashed border-border/50 pb-3"
          >
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
            <p
              className={`text-right text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Foto */}
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Foto Terkirim
        </p>
        <img
          src={hasil.fotoUrl}
          alt="Foto stand meter"
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: 200 }}
        />
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="h-11 w-full rounded-xl"
      >
        Lapor Meter Lain
      </Button>
    </div>
  )
}
