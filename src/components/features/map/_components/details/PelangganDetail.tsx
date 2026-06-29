import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DetailSkeleton } from './DetailSkeleton'
import { ErrorState } from '../shared/ErrorState'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import {
  PELANGGAN_STATUS_BADGE,
  PELANGGAN_STATUS_BADGE_FALLBACK,
} from '../types/constants'
import type { DetailViewProps } from '../types/types'

/** Panel detail pelanggan dengan layout baris terpisah standar Shadcn UI Table agar seragam. */
export function PelangganDetail({ id, onClose }: DetailViewProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.peta.getPelangganDetail.queryOptions({ id }),
  )

  if (isLoading) return <DetailSkeleton rows={10} />
  if (isError || !data) return <ErrorState onClose={onClose} />

  // Mapping warna fallback aman jika status tidak terdaftar
  const currentStatusColor =
    PELANGGAN_STATUS_BADGE[data.status] ?? PELANGGAN_STATUS_BADGE_FALLBACK

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Header: Hanya Badge Status & Tombol Tutup */}
        <div className="mb-4 flex items-center justify-between">
          <Badge
            variant="outline"
            className={`px-2.5 py-0.5 text-xs font-medium ${currentStatusColor}`}
          >
            {data.status ? data.status.replace(/_/g, ' ') : 'UNKNOWN'}
          </Badge>
          <button
            onClick={onClose}
            className="p-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <Separator className="mb-4" />

        {/* Tabel Data Utama - Full Standar Uniform Style */}
        <Table>
          <TableBody className="text-xs">
            {/* Nomor Langganan */}
            <TableRow>
              <TableCell className="w-1/3 align-top font-semibold text-muted-foreground">
                No. Langganan
              </TableCell>
              <TableCell className="align-top font-mono font-semibold text-foreground">
                {data.nomorLangganan || '—'}
              </TableCell>
            </TableRow>

            {/* Nama Pelanggan */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Nama Pelanggan
              </TableCell>
              <TableCell className="align-top font-semibold text-foreground">
                {data.nama || '—'}
              </TableCell>
            </TableRow>

            {/* Alamat Utama */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Alamat Jalan
              </TableCell>
              <TableCell className="align-top leading-normal text-foreground">
                {data.alamat || '—'}
              </TableCell>
            </TableRow>

            {/* RT */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                RT
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.rt || '—'}
              </TableCell>
            </TableRow>

            {/* RW */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                RW
              </TableCell>
              <TableCell className="align-top font-mono text-foreground">
                {data.rw || '—'}
              </TableCell>
            </TableRow>

            {/* Kelurahan */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Kelurahan
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.kelurahan?.nama || '—'}
              </TableCell>
            </TableRow>

            {/* Kecamatan */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Kecamatan
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.kecamatan?.nama || '—'}
              </TableCell>
            </TableRow>

            {/* Telepon (Opsional) */}
            {data.notelp && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Telepon
                </TableCell>
                <TableCell className="align-top font-mono text-foreground">
                  {data.notelp}
                </TableCell>
              </TableRow>
            )}

            {/* Golongan */}
            <TableRow>
              <TableCell className="align-top font-semibold text-muted-foreground">
                Golongan Tarif
              </TableCell>
              <TableCell className="align-top text-foreground">
                {data.tarifGolongan
                  ? `${data.tarifGolongan.kode} — ${data.tarifGolongan.nama}`
                  : '—'}
              </TableCell>
            </TableRow>

            {/* Penghuni (Opsional) */}
            {data.jumlahPenghuni != null && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Jumlah Penghuni
                </TableCell>
                <TableCell className="align-top text-foreground">
                  {data.jumlahPenghuni} jiwa
                </TableCell>
              </TableRow>
            )}

            {/* Koordinat */}
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

            {/* Status MBR (Opsional) */}
            {data.isMBR && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Status MBR
                </TableCell>
                <TableCell className="align-top text-foreground">
                  Ya {data.kodeMBR ? `(${data.kodeMBR})` : ''}
                </TableCell>
              </TableRow>
            )}

            {/* Seksi Cater */}
            {data.seksiCater && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Seksi Cater
                </TableCell>
                <TableCell className="align-top text-foreground">
                  {data.seksiCater.nama}
                </TableCell>
              </TableRow>
            )}

            {/* Rute */}
            {data.rute && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Rute Pembacaan
                </TableCell>
                <TableCell className="align-top text-foreground">
                  {data.rute.kode}{' '}
                  {data.rute.noUrut ? `(No. Urut: ${data.rute.noUrut})` : ''}
                </TableCell>
              </TableRow>
            )}

            {/* Zona */}
            {data.zona && (
              <TableRow>
                <TableCell className="align-top font-semibold text-muted-foreground">
                  Zona Distribusi
                </TableCell>
                <TableCell className="align-top text-foreground">
                  {data.zona.nama}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}
