import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DetailSkeleton } from './DetailSkeleton'
import { ErrorState } from '../shared/ErrorState'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { DetailViewProps } from '../types/types'

export function PemutusanDetail({ id, onClose }: DetailViewProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.peta.getPemutusanDetail.queryOptions({ id }),
  )

  if (isLoading) return <DetailSkeleton rows={11} />
  if (isError || !data) return <ErrorState onClose={onClose} />

  const pemutusanColors: Record<string, string> = {
    TSM: 'text-pink-700 bg-pink-50 border-pink-200 dark:bg-pink-950/50 dark:text-pink-400',
    SPT: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400',
    LAINNYA:
      'text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-950/50 dark:text-slate-400',
  }
  const badgeColor =
    pemutusanColors[data.jenis] ?? 'text-muted-foreground bg-muted'
  const labelNama =
    data.pelanggan?.nama || data.catatanSurveiAsli || 'Eks Pelanggan'
  const labelAlamat = data.pelanggan?.alamat || 'Alamat tidak terekam database'

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Badge
            variant="outline"
            className={`px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
          >
            {`PUTUS: ${data.jenis || 'LAINNYA'}`}
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
                No. Langganan
              </TableCell>
              <TableCell className="align-top font-mono font-semibold text-foreground">
                {data.nomorLangganan || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Nama Eks Pelanggan
              </TableCell>
              <TableCell className="align-top font-semibold text-foreground">
                {labelNama}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Alamat Terakhir
              </TableCell>
              <TableCell className="align-top leading-normal text-foreground">
                {labelAlamat}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Sumber Data
              </TableCell>
              <TableCell className="align-top font-medium text-foreground">
                {data.sumberData || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Periode Putus
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.periode || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                No. SPT
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.nomorSPT || '—'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Catatan Histori
              </TableCell>
              <TableCell className="align-top leading-normal text-foreground italic">
                {data.catatan || 'Tidak ada keterangan tambahan'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Koordinat Lapangan
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
