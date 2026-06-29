import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { Layers, X } from 'lucide-react'
import { useMap } from '@/components/ui/map'
import { STATUS_DOT_COLOR, STATUS_ORDER } from './types/constants'
import { KELURAHAN_PALETTE, KECAMATAN_LINE_COLOR } from './types/wilayah.color'
import type { PelangganStatusCounts } from './types/types'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────
// Konstanta ukuran sheet/drawer
// ─────────────────────────────────────────────────────────
const SHEET_MIN_W = 200 // px — lebar minimum sheet desktop
const SHEET_MAX_W = 380 // px — lebar maksimum sheet desktop
const SHEET_DEFAULT_W = 280 // px — lebar awal

const DRAWER_MIN_H = 72 // px — tinggi minimum drawer mobile (hanya drag handle + header)
const DRAWER_MAX_H_RATIO = 0.85 // 85% tinggi viewport
const DRAWER_DEFAULT_H = 360 // px — tinggi awal drawer

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface MapOverlayProps {
  polygonCount: number
  pelangganCount: number
  statusCounts: PelangganStatusCounts
  layerLegend?: ReactNode
  visibility: {
    kelurahan: boolean
    kecamatan: boolean
    pelanggan: boolean // Pelanggan Aktif
    potensi: boolean // Pelanggan Potensial
    pemutusan: boolean // Eks Pelanggan
    [key: string]: any
  }
  onVisibilityChange: (key: string, value: boolean) => void
}

// ─────────────────────────────────────────────────────────
// Toggle switch kecil (sama seperti versi lama)
// ─────────────────────────────────────────────────────────
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
      className={cn(
        'relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer',
        'items-center rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none',
        checked ? 'bg-sky-500' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-[14px] w-[14px] rounded-full',
          'bg-white shadow-sm ring-0',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-[14px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// Konten utama overlay (dipakai bersama desktop & mobile)
// ─────────────────────────────────────────────────────────
function OverlayContent({
  statusCounts,
  layerLegend,
  visibility,
  onVisibilityChange,
}: MapOverlayProps) {
  return (
    <>
      {/* ── Status pelanggan ── */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {STATUS_ORDER.map((status) => {
          const isLayerVisible =
            status === 'AKTIF' ? visibility.pelanggan : visibility.pemutusan

          return (
            <div key={status} className="rounded-md bg-slate-50 p-2">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[9px] font-semibold tracking-wider text-slate-500 uppercase">
                  {status.replace(/_/g, ' ')}
                </span>
                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 shrink-0 rounded-full transition-opacity',
                    STATUS_DOT_COLOR[status],
                    !isLayerVisible && 'opacity-20',
                  )}
                />
              </div>
              <p
                className={cn(
                  'mt-1.5 text-base font-semibold text-slate-900 transition-opacity',
                  !isLayerVisible && 'opacity-40',
                )}
              >
                {(statusCounts[status] ?? 0).toLocaleString('id-ID')}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Legenda + Switch Layer ── */}
      <div className="mt-3 space-y-2.5 rounded-md border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
          Legenda & Kontrol Layer
        </p>

        {/* 1. Pelanggan Aktif */}
        <div className="flex h-7 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
            <span
              className={cn(
                'truncate',
                !visibility.pelanggan && 'text-slate-400 line-through',
              )}
            >
              Pelanggan Aktif
            </span>
          </div>
          <LayerToggle
            checked={!!visibility.pelanggan}
            onToggle={() =>
              onVisibilityChange('pelanggan', !visibility.pelanggan)
            }
            label="Toggle Pelanggan Aktif"
          />
        </div>

        {/* 2. Pelanggan Potensial */}
        <div className="flex h-7 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
            <span
              className={cn(
                'truncate',
                !visibility.potensi && 'text-slate-400 line-through',
              )}
            >
              Pelanggan Potensial
            </span>
          </div>
          <LayerToggle
            checked={!!visibility.potensi}
            onToggle={() => onVisibilityChange('potensi', !visibility.potensi)}
            label="Toggle Pelanggan Potensial"
          />
        </div>

        {/* 3. Eks Pelanggan */}
        <div className="flex h-7 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
            <span
              className={cn(
                'truncate',
                !visibility.pemutusan && 'text-slate-400 line-through',
              )}
            >
              Eks Pelanggan
            </span>
          </div>
          <LayerToggle
            checked={!!visibility.pemutusan}
            onToggle={() =>
              onVisibilityChange('pemutusan', !visibility.pemutusan)
            }
            label="Toggle Eks Pelanggan"
          />
        </div>

        {/* Divider wilayah */}
        <div className="my-1 border-t border-slate-200/60" />

        {/* 4. Batas Kelurahan */}
        <div className="flex h-7 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 gap-0.5">
              {KELURAHAN_PALETTE.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{
                    backgroundColor: color,
                    opacity: visibility.kelurahan ? 0.85 : 0.2,
                  }}
                />
              ))}
            </div>
            <span
              className={cn(
                'truncate',
                !visibility.kelurahan && 'text-slate-400 line-through',
              )}
            >
              Batas Kelurahan
            </span>
          </div>
          <LayerToggle
            checked={!!visibility.kelurahan}
            onToggle={() =>
              onVisibilityChange('kelurahan', !visibility.kelurahan)
            }
            label="Toggle Batas Kelurahan"
          />
        </div>

        {/* 5. Batas Kecamatan */}
        <div className="flex h-7 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <svg
              width="20"
              height="10"
              viewBox="0 0 20 10"
              fill="none"
              className={cn('shrink-0', !visibility.kecamatan && 'opacity-20')}
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
            <span
              className={cn(
                'truncate',
                !visibility.kecamatan && 'text-slate-400 line-through',
              )}
            >
              Batas Kecamatan
            </span>
          </div>
          <LayerToggle
            checked={!!visibility.kecamatan}
            onToggle={() =>
              onVisibilityChange('kecamatan', !visibility.kecamatan)
            }
            label="Toggle Batas Kecamatan"
          />
        </div>

        {/* Slot tambahan dari parent */}
        {layerLegend && (
          <div className="border-t border-slate-200 pt-2">{layerLegend}</div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Header bersama (ikon + judul + subtitle)
// ─────────────────────────────────────────────────────────
function OverlayHeader({
  polygonCount,
  pelangganCount,
  onClose,
}: {
  polygonCount: number
  pelangganCount: number
  onClose?: () => void
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-900">
        <Layers className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold tracking-[0.2em] text-slate-900 uppercase">
          Kelurahan
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {polygonCount} wilayah • {pelangganCount.toLocaleString('id-ID')}{' '}
          pelanggan
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Tutup panel"
          onClick={onClose}
          className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────
export function MapOverlay(props: MapOverlayProps) {
  const { polygonCount, pelangganCount } = props
  const { map } = useMap()

  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── Desktop sheet state ──
  const [sheetWidth, setSheetWidth] = useState(SHEET_DEFAULT_W)
  const isResizingSheet = useRef(false)
  const resizeStartX = useRef(0)
  const resizeStartW = useRef(0)

  // ── Mobile drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(DRAWER_DEFAULT_H)
  const isResizingDrawer = useRef(false)
  const resizeStartY = useRef(0)
  const resizeStartH = useRef(0)

  // ─── Deteksi fullscreen ───────────────────────────────
  useEffect(() => {
    if (!map) return
    const check = () => {
      try {
        setIsFullscreen(document.fullscreenElement === map.getContainer())
      } catch {
        setIsFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', check)
    check()
    return () => document.removeEventListener('fullscreenchange', check)
  }, [map])

  // ─── Desktop: drag resize lebar sheet ────────────────
  const onSheetResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizingSheet.current = true
      resizeStartX.current = e.clientX
      resizeStartW.current = sheetWidth

      const onMove = (ev: MouseEvent) => {
        if (!isResizingSheet.current) return
        // Handle ada di sisi kiri sheet → geser kiri = perlebar
        const delta = resizeStartX.current - ev.clientX
        const next = Math.min(
          SHEET_MAX_W,
          Math.max(SHEET_MIN_W, resizeStartW.current + delta),
        )
        setSheetWidth(next)
      }
      const onUp = () => {
        isResizingSheet.current = false
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [sheetWidth],
  )

  // ─── Mobile: drag resize tinggi drawer ───────────────
  const onDrawerResizeStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault()
      isResizingDrawer.current = true
      const startY =
        'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
      resizeStartY.current = startY
      resizeStartH.current = drawerHeight

      const maxH = Math.floor(window.innerHeight * DRAWER_MAX_H_RATIO)

      const onMove = (ev: TouchEvent | MouseEvent) => {
        if (!isResizingDrawer.current) return
        const y =
          'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY
        const delta = resizeStartY.current - y // seret ke atas = tinggi naik
        const next = Math.min(
          maxH,
          Math.max(DRAWER_MIN_H, resizeStartH.current + delta),
        )
        setDrawerHeight(next)
      }
      const onUp = () => {
        isResizingDrawer.current = false
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onUp)
    },
    [drawerHeight],
  )

  if (!isFullscreen) return null

  return (
    <>
      {/* ══════════════════════════════════════════════════
          DESKTOP: Sheet panel melekat di sisi kanan map
          Tersembunyi di mobile (hidden sm:flex)
      ══════════════════════════════════════════════════ */}
      <div
        aria-label="Panel layer peta"
        className="absolute inset-y-0 right-0 z-20 hidden flex-col sm:flex"
        style={{ width: sheetWidth }}
      >
        {/* Handle resize — garis tipis di sisi kiri panel */}
        <div
          role="separator"
          aria-label="Seret untuk mengubah lebar panel"
          onMouseDown={onSheetResizeStart}
          className={cn(
            'absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize',
            'flex items-center justify-center',
            'transition-colors hover:bg-sky-500/30 active:bg-sky-500/40',
          )}
        >
          {/* Visual grip dots */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="block h-0.5 w-3 rounded-full bg-slate-300/60"
              />
            ))}
          </div>
        </div>

        {/* Panel konten */}
        <div className="flex h-full flex-col overflow-hidden border-l border-slate-200/70 bg-white/95 backdrop-blur-xl">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-200/60 px-4 py-3">
            <OverlayHeader
              polygonCount={polygonCount}
              pelangganCount={pelangganCount}
            />
          </div>

          {/* Scrollable body */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4">
            <OverlayContent {...props} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE: FAB + Bottom Drawer
          Tersembunyi di desktop (flex sm:hidden)
      ══════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 z-20 flex sm:hidden"
        style={{ pointerEvents: 'none' }}
      >
        {/* FAB buka drawer — pojok kanan atas */}
        <button
          type="button"
          aria-label={drawerOpen ? 'Tutup panel layer' : 'Buka panel layer'}
          onClick={() => setDrawerOpen((v) => !v)}
          style={{ pointerEvents: 'auto' }}
          className={cn(
            'absolute top-3 right-3',
            'grid h-10 w-10 place-items-center rounded-lg',
            'border border-slate-200/60 bg-white/95 text-slate-800',
            'shadow-[0_4px_16px_rgba(15,23,42,0.18)] backdrop-blur-md',
            'transition-transform active:scale-95',
            drawerOpen && 'ring-2 ring-sky-500',
          )}
        >
          <Layers className="size-5" />
        </button>

        {/* Backdrop semi-transparan saat drawer terbuka */}
        {drawerOpen && (
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            style={{ pointerEvents: 'auto' }}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
          />
        )}

        {/* Bottom Drawer */}
        <div
          role="dialog"
          aria-label="Panel layer peta"
          aria-modal="true"
          style={{
            pointerEvents: drawerOpen ? 'auto' : 'none',
            height: drawerOpen ? drawerHeight : 0,
            transition: isResizingDrawer.current
              ? 'none'
              : 'height 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}
          className={cn(
            'absolute right-0 bottom-0 left-0',
            'flex flex-col rounded-t-2xl',
            'border-t border-slate-200/60 bg-white/98',
            'shadow-[0_-8px_32px_rgba(15,23,42,0.18)] backdrop-blur-xl',
            'overflow-hidden',
            !drawerOpen && 'pointer-events-none',
          )}
        >
          {/* ── Drag handle resize ── */}
          <div
            aria-label="Seret untuk mengubah tinggi drawer"
            onMouseDown={onDrawerResizeStart}
            onTouchStart={onDrawerResizeStart}
            className={cn(
              'flex shrink-0 cursor-row-resize flex-col items-center gap-1 py-2.5',
              'touch-none select-none',
            )}
          >
            <div className="h-1 w-8 rounded-full bg-slate-300" />
            <span className="text-[9px] tracking-wider text-slate-400 uppercase">
              Seret untuk resize
            </span>
          </div>

          {/* ── Header drawer ── */}
          <div className="shrink-0 border-t border-b border-slate-200/60 px-4 py-2.5">
            <OverlayHeader
              polygonCount={polygonCount}
              pelangganCount={pelangganCount}
              onClose={() => setDrawerOpen(false)}
            />
          </div>

          {/* ── Scrollable body drawer ── */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-6">
            <OverlayContent {...props} />
          </div>
        </div>
      </div>
    </>
  )
}
