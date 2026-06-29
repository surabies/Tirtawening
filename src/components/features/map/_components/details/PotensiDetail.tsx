import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DetailSkeleton } from './DetailSkeleton'
import { ErrorState } from '../shared/ErrorState'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { DetailViewProps } from '../types/types'

export function PotensiDetail({ id, onClose }: DetailViewProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.peta.getPotensiPelangganDetail.queryOptions({ id }),
  )

  if (isLoading) return <DetailSkeleton rows={9} />
  if (isError || !data) return <ErrorState onClose={onClose} />

  const potensiStatusColors: Record<string, string> = {
    PROSPEK:
      'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400',
    MENUNGGU_SURVEI:
      'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400',
    VALIDASI:
      'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400',
    DITOLAK:
      'text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400',
  }
  const badgeColor =
    potensiStatusColors[data.status] ?? 'text-muted-foreground bg-muted'

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Badge
            variant="outline"
            className={`px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
          >
            {data.status
              ? `POTENSI: ${data.status.replace(/_/g, ' ')}`
              : 'POTENSI'}
          </Badge>
          <button
            onClick={onClose}
            className="p-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          >
            ✕
          </button>
        </div>
        <Separator className="mb-4" />
        <Table>
          <TableBody className="text-xs">
            <TableRow>
              <TableCell className="w-1/3 align-top font-semibold text-muted-foreground">
                ID Potensi
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.id}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Alamat Lokasi
              </TableCell>
              <TableCell className="align-top leading-normal text-foreground">
                {data.alamat || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Kelurahan
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.kelurahan?.nama || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Kecamatan
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.kelurahan?.kecamatan?.nama || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Rute Terdekat
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.rute
                  ? `${data.rute.kode} ${data.rute.noUrut ? `(Urut: ${data.rute.noUrut})` : ''}`
                  : '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Petugas Lapangan
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.petugasId || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Catatan Survei
              </TableCell>
              <TableCell className="align-top leading-normal text-foreground italic">
                {data.catatan || 'Tidak ada catatan'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Koordinat
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.geoLat != null && data.geoLong != null
                  ? `${data.geoLat.toFixed(6)}, ${data.geoLong.toFixed(6)}`
                  : '—'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}
