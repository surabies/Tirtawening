/**
 * columns.tsx — Laporan Mandiri
 *
 * Perubahan dari versi sebelumnya:
 * - Nama Pelanggan & Nama Pelapor jadi kolom terpisah (bukan sub-baris)
 * - No. Telepon kolom sendiri
 * - Semua header dan cell CENTER
 * - Border grid ala Excel (border-r di setiap kolom)
 */

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  ImageIcon,
} from 'lucide-react'
import { type StatusLaporanMandiri } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LaporanMandiriRow = {
  id: string
  nomorLangganan: string
  periode: number
  standDilaporkan: number
  namaPelapor: string
  nomorPelapor: string
  status: StatusLaporanMandiri
  fotoUrl: string
  alasanDitolak: string | null
  verifiedAt: Date | null
  createdAt: Date
  pelanggan: {
    nama: string
    alamat: string
    seksiCater: { kode: string; nama: string } | null
  }
  verifiedBy: { name: string | null } | null
  pembacaan: { id: string; pemakaianM3: number } | null
}

// ── Status map ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  StatusLaporanMandiri,
  { label: string; className: string }
> = {
  MENUNGGU: {
    label: 'Menunggu',
    className:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  DIVERIFIKASI: {
    label: 'Diverifikasi',
    className:
      'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  DITOLAK: {
    label: 'Ditolak',
    className:
      'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300',
  },
  DIGUNAKAN: {
    label: 'Digunakan',
    className:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
}

const BULAN_SHORT = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function formatPeriode(yyyymm: number): string {
  return `${BULAN_SHORT[yyyymm % 100]} ${Math.floor(yyyymm / 100)}`
}

function formatDate(d: Date | null): string {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Grid class helpers ────────────────────────────────────────────────────────
// Setiap kolom punya border kanan — menciptakan grid ala Excel.
// flex + h-full WAJIB di sini: TableHead/TableCell parent sudah "p-0",
// jadi div ini yang menentukan background & alignment penuh 1 sel.
// Tanpa h-full, div cuma setinggi teks-nya → sisa tinggi sel kelihatan
// bg row (bg-muted/40) nongol tipis di atas/bawah — itu yang bikin
// header kelihatan ada "bg tipis" & teks nggak center vertikal.
const CELL =
  'flex h-full flex-col items-center justify-center border-r border-border text-center'
const HEAD =
  'flex h-full items-center justify-center border-r border-border bg-muted/60 text-center text-[11px] font-semibold uppercase tracking-wide'

// ── Column factory ────────────────────────────────────────────────────────────

type ActionHandlers = {
  onVerify: (id: string) => void
  onReject: (id: string) => void
  onDetail: (row: LaporanMandiriRow) => void
}

export function buildColumns(
  handlers: ActionHandlers,
): ColumnDef<LaporanMandiriRow>[] {
  return [
    // ── 0. Checkbox ───────────────────────────────────────────────────────────
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex justify-center items-center h-full px-2 border-r border-border bg-muted/60">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Pilih semua"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center items-center h-full px-2 border-r border-border">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Pilih baris"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 44,
    },

    // ── 1. No. Langganan ──────────────────────────────────────────────────────
    {
      id: 'nomorLangganan',
      accessorKey: 'nomorLangganan',
      header: () => <div className={HEAD}>No. Langganan</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5 px-2`}>
          <span className="font-mono text-xs font-semibold tracking-tight">
            {row.original.nomorLangganan}
          </span>
        </div>
      ),
      size: 130,
    },

    // ── 2. Nama Pelanggan ─────────────────────────────────────────────────────
    {
      id: 'namaPelanggan',
      accessorFn: (row) => row.pelanggan.nama,
      header: () => <div className={HEAD}>Nama Pelanggan</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5 px-3`}>
          <span
            className="block max-w-[155px] truncate text-xs font-medium mx-auto"
            title={row.original.pelanggan.nama}
          >
            {row.original.pelanggan.nama}
          </span>
        </div>
      ),
      size: 170,
    },

    // ── 3. Nama Pelapor ───────────────────────────────────────────────────────
    {
      id: 'namaPelapor',
      accessorKey: 'namaPelapor',
      header: () => <div className={HEAD}>Nama Pelapor</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5 px-3`}>
          <span
            className="block max-w-[130px] truncate text-xs mx-auto"
            title={row.original.namaPelapor}
          >
            {row.original.namaPelapor}
          </span>
        </div>
      ),
      size: 150,
    },

    // ── 4. No. Telepon ────────────────────────────────────────────────────────
    {
      id: 'nomorPelapor',
      accessorKey: 'nomorPelapor',
      header: () => <div className={HEAD}>No. Telepon</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5 px-2`}>
          <span className="font-mono text-xs">{row.original.nomorPelapor}</span>
        </div>
      ),
      size: 125,
    },

    // ── 5. Periode ────────────────────────────────────────────────────────────
    {
      id: 'periode',
      accessorKey: 'periode',
      header: () => <div className={HEAD}>Periode</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5`}>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
            {formatPeriode(row.original.periode)}
          </span>
        </div>
      ),
      size: 88,
    },

    // ── 6. Stand (m³) ─────────────────────────────────────────────────────────
    {
      id: 'standDilaporkan',
      accessorKey: 'standDilaporkan',
      header: () => <div className={HEAD}>Stand (m³)</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5`}>
          <p className="tabular-nums text-sm font-semibold leading-none">
            {row.original.standDilaporkan.toLocaleString('id-ID')}
          </p>
          {row.original.pembacaan && (
            <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{row.original.pembacaan.pemakaianM3} m³
            </p>
          )}
        </div>
      ),
      size: 100,
    },

    // ── 7. Status ─────────────────────────────────────────────────────────────
    {
      id: 'status',
      accessorKey: 'status',
      header: () => <div className={HEAD}>Status</div>,
      cell: ({ row }) => {
        const s = STATUS_MAP[row.original.status]
        return (
          <div className={`${CELL} py-2.5 px-2`}>
            <Badge
              variant="outline"
              className={`whitespace-nowrap text-[11px] font-medium rounded-sm ${s.className}`}
            >
              {s.label}
            </Badge>
          </div>
        )
      },
      size: 115,
    },

    // ── 8. Dikirim ────────────────────────────────────────────────────────────
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () => <div className={HEAD}>Dikirim</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5`}>
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        </div>
      ),
      size: 100,
    },

    // ── 9. Diproses ───────────────────────────────────────────────────────────
    {
      id: 'verifiedAt',
      accessorKey: 'verifiedAt',
      header: () => <div className={HEAD}>Diproses</div>,
      cell: ({ row }) => (
        <div className={`${CELL} py-2.5`}>
          <p className="text-xs tabular-nums">
            {formatDate(row.original.verifiedAt)}
          </p>
          {row.original.verifiedBy?.name && (
            <p className="mt-0.5 text-[10px] text-muted-foreground truncate max-w-[90px] mx-auto">
              {row.original.verifiedBy.name}
            </p>
          )}
        </div>
      ),
      size: 110,
    },

    // ── 10. Aksi ──────────────────────────────────────────────────────────────
    {
      id: 'actions',
      header: () => <div className="bg-muted/60 text-center h-full" />,
      cell: ({ row }) => {
        const { status, fotoUrl } = row.original
        const bisa = status === 'MENUNGGU'
        return (
          <div className="flex justify-center items-center h-full py-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">Aksi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => handlers.onDetail(row.original)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(fotoUrl, '_blank')}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Buka Foto Meter
                </DropdownMenuItem>
                {bisa && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handlers.onVerify(row.original.id)}
                      className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verifikasi
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handlers.onReject(row.original.id)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableHiding: false,
      size: 48,
    },
  ]
}
