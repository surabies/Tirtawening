'use client'

import { useState } from 'react'
import { LaporMeterForm } from './lapor-meter-form'
import { LaporMeterSukses } from './lapor-meter-sukses'

export type HasilLaporan = {
  nomorLangganan: string
  nama: string
  periode: string
  stand: number
  fotoUrl: string
}

export function LaporMeterView() {
  const [hasil, setHasil] = useState<HasilLaporan | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-12">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgb(0,0,0,0.06)]">
          {!hasil ? (
            <LaporMeterForm onSuccess={setHasil} />
          ) : (
            <LaporMeterSukses hasil={hasil} onReset={() => setHasil(null)} />
          )}
        </div>

        <footer className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Laporan akan diverifikasi petugas dalam 1×24 jam
          <br />
          <a
            href="tel:0221234567"
            className="mt-0.5 inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
          >
            (022) 123-4567
          </a>
        </footer>
      </main>
    </div>
  )
}
