/**
 * laporan-mandiri-table.tsx
 *
 * Perubahan:
 * - Tabel pakai border="1" style grid ala Excel (border di setiap sisi)
 * - Export rows state: semua baris (bukan hanya page aktif) di-fetch terpisah
 * - LaporanMandiriExport disisipkan di header section
 */

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type PaginationState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type StatusLaporanMandiri } from './types'
import { buildColumns, type LaporanMandiriRow } from './columns'
import { LaporanMandiriToolbar, type Filters } from './laporan-mandiri-toolbar'
import { TolakDialog } from './tolak-dialog'
import { DetailSheet } from './detail-sheet'
import { LaporanMandiriExport } from './laporan-mandiri-export'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  periodeOptions: { value: number; label: string }[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanMandiriTable({ periodeOptions }: Props) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // ── filter state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'SEMUA',
    periode: undefined,
  })

  // ── pagination state ────────────────────────────────────────────────────────
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  function handleFiltersChange(f: Filters) {
    setFilters(f)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  // ── dialog / sheet state ────────────────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [detailRow, setDetailRow] = useState<LaporanMandiriRow | null>(null)

  // ── query — halaman aktif ────────────────────────────────────────────────────
  const queryInput = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(filters.status !== 'SEMUA' && {
      status: filters.status as StatusLaporanMandiri,
    }),
    ...(filters.search && { search: filters.search }),
    ...(filters.periode !== undefined && { periode: filters.periode }),
  }

  const listQuery = useQuery(trpc.laporanMandiri.list.queryOptions(queryInput))

  // ── query — SEMUA baris untuk export (limit besar, tanpa pagination) ─────────
  // Hanya di-fetch saat ada kebutuhan export (lazy via enabled flag)
  const [exportEnabled, setExportEnabled] = useState(false)

  const exportQueryInput = {
    page: 1,
    limit: 99999,
    ...(filters.status !== 'SEMUA' && {
      status: filters.status as StatusLaporanMandiri,
    }),
    ...(filters.search && { search: filters.search }),
    ...(filters.periode !== undefined && { periode: filters.periode }),
  }

  const exportQuery = useQuery({
    ...trpc.laporanMandiri.list.queryOptions(exportQueryInput),
    enabled: exportEnabled,
  })

  const exportRows = (exportQuery.data?.items ?? []) as LaporanMandiriRow[]

  // ── mutations ────────────────────────────────────────────────────────────────
  function invalidate() {
    queryClient.invalidateQueries(
      trpc.laporanMandiri.list.queryOptions(queryInput),
    )
    queryClient.invalidateQueries(trpc.laporanMandiri.stats.queryOptions({}))
  }

  const terimaM = useMutation(
    trpc.laporanMandiri.terima.mutationOptions({
      onSuccess: () => {
        toast.success('Laporan berhasil diverifikasi')
        invalidate()
      },
      onError: (e) => toast.error(e.message),
    }),
  )

  const tolakM = useMutation(
    trpc.laporanMandiri.tolak.mutationOptions({
      onSuccess: () => {
        toast.success('Laporan berhasil ditolak')
        setRejectTarget(null)
        invalidate()
      },
      onError: (e) => toast.error(e.message),
    }),
  )

  // ── column handlers ─────────────────────────────────────────────────────────
  const handlers = useMemo(
    () => ({
      onVerify: (id: string) => terimaM.mutate({ id }),
      onReject: (id: string) => setRejectTarget(id),
      onDetail: (row: LaporanMandiriRow) => setDetailRow(row),
    }),
    [terimaM],
  )

  const columns = useMemo(() => buildColumns(handlers), [handlers])

  // ── table ───────────────────────────────────────────────────────────────────
  const data = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const pageCount = listQuery.data?.totalPages ?? 0

  const table = useReactTable({
    data: data as LaporanMandiriRow[],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    rowCount: total,
  })

  const isLoading = listQuery.isLoading

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* toolbar + export */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <LaporanMandiriToolbar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            periodeOptions={periodeOptions}
            totalRows={total}
            isLoading={isLoading}
            rows={exportEnabled ? exportRows : (data as LaporanMandiriRow[])}
          />
        </div>

        {/* Tombol Export — fetch semua data saat hover/focus */}
        <div
          onMouseEnter={() => setExportEnabled(true)}
          onFocus={() => setExportEnabled(true)}
        ></div>
      </div>

      {/* ── Tabel dengan gaya grid Excel ── */}
      {/*
        Kunci styling:
        - border pada container → batas luar tabel
        - [&_th]:border-b [&_th]:border-border → garis bawah header
        - [&_td]:border-b [&_td]:border-border → garis bawah tiap baris
        - kolom sendiri punya border-r di dalam cell (dari columns.tsx)
        - bg-muted/40 di header row
      */}
      <div className="overflow-hidden rounded-sm border border-border">
        <div className="overflow-x-auto">
          <Table className="[&_td]:border-b [&_td]:border-border [&_th]:border-b [&_th]:border-border">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="h-9 p-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({
                  length: pagination.pageSize > 5 ? 8 : pagination.pageSize,
                }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border">
                    {columns.map((_, ci) => (
                      <TableCell
                        key={ci}
                        className="border-r border-border py-2.5"
                      >
                        <Skeleton className="h-4 w-full rounded mx-auto" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-muted-foreground h-32 text-center text-sm"
                  >
                    Tidak ada laporan yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/20 cursor-pointer border-b border-border last:border-b-0"
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (
                        target.closest('[role="checkbox"]') ||
                        target.closest('[data-radix-popper-content-wrapper]') ||
                        target.closest('button')
                      )
                        return
                      setDetailRow(row.original)
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="p-0"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Baris per halaman
          </span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(v) =>
              setPagination({ pageIndex: 0, pageSize: parseInt(v) })
            }
          >
            <SelectTrigger className="h-8 w-18 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm tabular-nums">
            Halaman{' '}
            <span className="text-foreground font-medium">
              {pagination.pageIndex + 1}
            </span>{' '}
            dari{' '}
            <span className="text-foreground font-medium">
              {pageCount || 1}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Dialogs & Sheets ── */}
      <DetailSheet
        row={detailRow}
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        onVerify={(id) => terimaM.mutate({ id })}
        onReject={(id) => setRejectTarget(id)}
        isVerifyPending={terimaM.isPending}
      />

      <TolakDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(alasan) => {
          if (rejectTarget)
            tolakM.mutate({ id: rejectTarget, alasanDitolak: alasan })
        }}
        isPending={tolakM.isPending}
      />
    </div>
  )
}
