import { useState } from 'react'
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
import { useQuery } from '@tanstack/react-query'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTanggal(tanggal: string): string {
  // tanggal dalam format yyyy-mm-dd
  const [year, month, day] = tanggal.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanHarianProgressTable() {
  const trpc = useTRPC()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const { data, isLoading } = useQuery(
    trpc.laporanHarian.progress.queryOptions({ page, limit }),
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Progres Pencatatan per Petugas
        </h3>
        <span className="text-muted-foreground text-xs">
          {total.toLocaleString('id-ID')} entri
        </span>
      </div>

      <div className="overflow-hidden rounded-sm border border-border">
        <div className="overflow-x-auto">
          <Table className="[&_td]:border-b [&_td]:border-border [&_th]:border-b [&_th]:border-border">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-9">Tanggal</TableHead>
                <TableHead className="h-9">Petugas</TableHead>
                <TableHead className="h-9 text-right">Jumlah SL</TableHead>
                <TableHead className="h-9 text-right">Total m³</TableHead>
                <TableHead className="h-9 text-right">
                  Rata-rata m³/SL
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border">
                    {Array.from({ length: 5 }).map((_, ci) => (
                      <TableCell key={ci} className="py-2.5">
                        <Skeleton className="h-4 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-32 text-center text-sm"
                  >
                    Belum ada data pencatatan.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow
                    key={`${row.pencatatId ?? 'unknown'}-${row.tanggal}`}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="py-2.5 text-sm">
                      {formatTanggal(row.tanggal)}
                    </TableCell>
                    <TableCell className="py-2.5 text-sm font-medium">
                      {row.namaPetugas}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums">
                      {row.jumlahSl.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums">
                      {row.totalM3.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-sm tabular-nums text-muted-foreground">
                      {(row.totalM3 / row.jumlahSl).toFixed(1)}
                    </TableCell>
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
            value={limit.toString()}
            onValueChange={(v) => {
              setLimit(parseInt(v))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-18 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 200].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm tabular-nums">
            Halaman <span className="text-foreground font-medium">{page}</span>{' '}
            dari{' '}
            <span className="text-foreground font-medium">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
