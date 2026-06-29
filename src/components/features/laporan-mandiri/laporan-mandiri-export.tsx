/**
 * laporan-mandiri-export.tsx
 *
 * Tombol dropdown export Laporan Mandiri ke Excel / PDF.
 * Tampil di navbar halaman atau di atas tabel.
 *
 * Usage:
 *   <LaporanMandiriExport rows={allRows} periode={filters.periode} />
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel, exportToPDF } from './export-utils'
import { type LaporanMandiriRow } from './columns'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  /** Semua baris yang akan diekspor (bukan hanya halaman aktif) */
  rows: LaporanMandiriRow[]
  /** Periode aktif filter — dipakai untuk nama file */
  periode?: number
  /** Disabled saat data masih loading */
  disabled?: boolean
  /** Size tombol */
  size?: 'sm' | 'default'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanMandiriExport({
  rows,
  periode,
  disabled,
  size = 'sm',
}: Props) {
  const [loadingXlsx, setLoadingXlsx] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const isLoading = loadingXlsx || loadingPdf
  const isEmpty = rows.length === 0

  async function handleExcelExport() {
    setLoadingXlsx(true)
    try {
      await exportToExcel(rows, { periode })
      toast.success(`Berhasil mengekspor ${rows.length} laporan ke Excel`)
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengekspor ke Excel. Coba lagi.')
    } finally {
      setLoadingXlsx(false)
    }
  }

  async function handlePdfExport() {
    setLoadingPdf(true)
    try {
      await exportToPDF(rows, { periode })
      toast.success(`Berhasil mengekspor ${rows.length} laporan ke PDF`)
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengekspor ke PDF. Coba lagi.')
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled || isEmpty || isLoading}
          className="gap-1.5 font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export
          {rows.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({rows.length.toLocaleString('id-ID')})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {rows.length.toLocaleString('id-ID')} laporan akan diekspor
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleExcelExport}
          disabled={loadingXlsx}
          className="gap-2"
        >
          {loadingXlsx ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          )}
          <div>
            <p className="text-sm font-medium">Excel (.xlsx)</p>
            <p className="text-xs text-muted-foreground">Semua kolom + meta</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handlePdfExport}
          disabled={loadingPdf}
          className="gap-2"
        >
          {loadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          ) : (
            <FileText className="h-4 w-4 text-red-600" />
          )}
          <div>
            <p className="text-sm font-medium">PDF (A4 Landscape)</p>
            <p className="text-xs text-muted-foreground">Siap cetak</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
