import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { LEGEND_STATUS_ITEMS } from '../types/constants'
import { KELURAHAN_PALETTE, KECAMATAN_LINE_COLOR } from '../types/wilayah.color'
import { useMapLayer } from './Maplayercontext'
import type { MapLayerState } from './Maplayercontext'
import logo from '@/assets/images/logo.png'

// ── Toggle visual sederhana — tidak bergantung pada Radix data-state ────────
// Switch bawaan Shadcn di project ini memakai data-checked/data-unchecked
// yang tidak selalu di-emit Radix, menyebabkan background tidak muncul.
// Komponen ini murni HTML + Tailwind, zero dependency.
function LayerToggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={[
        'relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer',
        'items-center rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-input dark:bg-input/80',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none block h-[14px] w-[14px] rounded-full',
          'bg-background shadow-sm ring-0',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-[14px]' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ── Satu baris toggle ─────────────────────────────────────────────────────────
function LayerRow({
  checked,
  layerKey,
  children,
}: {
  checked: boolean
  layerKey: keyof MapLayerState
  children: React.ReactNode
}) {
  const { toggleLayer } = useMapLayer()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <LayerToggle
        checked={checked}
        onToggle={() => toggleLayer(layerKey)}
        label={`Toggle ${layerKey}`}
      />
    </div>
  )
}

/** LegendCard — legenda status + filter layer dengan toggle. */
export function LegendCard() {
  const [open, setOpen] = useState(true)
  const { layers } = useMapLayer()

  return (
    <div className="rounded-md border border-border/50 bg-card p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors dark:shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
      {/* Bagian Kiri: Logo + Nama Brand */}
      <div className="mb-1.5 flex items-center justify-center gap-2">
        <img
          src={logo}
          alt="Logo Tirtacater"
          width={50}
          height={50}
          className="mb-3 rounded-full border border-border/40 bg-card p-1.5 shadow-[0_2px_12px_rgb(0,0,0,0.06)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
        />
      </div>
      <p className="mb-3 text-center text-xs font-bold tracking-wider text-muted-foreground uppercase">
        Legenda
      </p>

      {/* ── Status pelanggan ── */}
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />

          <p className="shrink-0 text-xs font-medium text-muted-foreground/80">
            Status Pelanggan
          </p>

          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {LEGEND_STATUS_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className={`size-2.5 shrink-0 rounded-full ${item.color}`}
              />
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* ── Filter layer — collapsible ── */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between border-t border-border/50 pt-3 text-left">
          <p className="text-xs font-medium text-muted-foreground/80">
            Filter Layer
          </p>
          <ChevronDown
            className={[
              'size-3.5 text-muted-foreground transition-transform duration-200',
              open ? 'rotate-180' : '',
            ].join(' ')}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-visible">
          <div className="mt-3 space-y-4">
            {/* ── Wilayah ── */}
            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                Wilayah
              </p>
              <div className="space-y-2.5">
                {/* Batas Kelurahan */}
                <LayerRow checked={layers.kelurahan} layerKey="kelurahan">
                  <div className="flex shrink-0 gap-0.5">
                    {KELURAHAN_PALETTE.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="inline-block size-2.5 rounded-sm"
                        style={{ backgroundColor: c, opacity: 0.85 }}
                      />
                    ))}
                  </div>
                  <span className="truncate text-xs text-foreground">
                    Batas Kelurahan
                  </span>
                </LayerRow>

                {/* Batas Kecamatan */}
                <LayerRow checked={layers.kecamatan} layerKey="kecamatan">
                  <svg
                    width="20"
                    height="10"
                    viewBox="0 0 20 10"
                    className="shrink-0"
                  >
                    <line
                      x1="0"
                      y1="5"
                      x2="20"
                      y2="5"
                      stroke={KECAMATAN_LINE_COLOR}
                      strokeWidth="2.5"
                      strokeDasharray="5 2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="truncate text-xs text-foreground">
                    Batas Kecamatan
                  </span>
                </LayerRow>
              </div>
            </div>

            {/* ── Titik Pelanggan ── */}
            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                Titik Pelanggan
              </p>
              <div className="space-y-2.5">
                {/* Aktif */}
                <LayerRow
                  checked={layers.pelangganAktif}
                  layerKey="pelangganAktif"
                >
                  <span className="size-2.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="text-xs text-foreground">Aktif</span>
                </LayerRow>

                {/* Potensial */}
                <LayerRow
                  checked={layers.pelangganPotensi}
                  layerKey="pelangganPotensi"
                >
                  <span className="size-2.5 shrink-0 rounded-full bg-violet-500" />
                  <span className="text-xs text-foreground">Potensial</span>
                </LayerRow>

                {/* Eks Pelanggan */}
                <LayerRow checked={layers.pelangganEks} layerKey="pelangganEks">
                  <span className="size-2.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="text-xs text-foreground">Eks Pelanggan</span>
                </LayerRow>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
