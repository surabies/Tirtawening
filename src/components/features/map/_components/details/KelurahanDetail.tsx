import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
// Menambahkan ikon MapPin, UserMinus, dan UserPlus untuk metrik baru
import {
  Activity,
  Info,
  Layers,
  Users,
  MapPin,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { StatCard } from '../shared/StatCard'
import { DetailSkeleton } from './DetailSkeleton'
import { ErrorState } from '../shared/ErrorState'
import type { DetailViewProps } from '../types/types'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

/** Panel detail untuk wilayah kelurahan yang dipilih di peta. */
export function KelurahanDetail({ id, onClose }: DetailViewProps) {
  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.peta.getKelurahanDetail.queryOptions({ id }),
  )

  if (isLoading) return <DetailSkeleton rows={4} />
  if (isError || !data) return <ErrorState onClose={onClose} />

  // Metrik eksisting
  const totalPelanggan = data._count?.pelanggan ?? 0
  const persentaseAktif =
    totalPelanggan > 0 ? Math.round((data.aktif / totalPelanggan) * 100) : 0

  // Metrik tambahan (sesuaikan nama properti ini dengan yang ada di router TRPC Anda)
  const eksPelanggan = data.eksPelanggan ?? 0
  const potensiPelanggan = data.potensiPelanggan ?? 0
  // Jika "keseluruhan" adalah akumulasi semua titik di database, Anda bisa mengambilnya dari data,
  // atau menjumlahkan metrik yang ada jika itu logikanya. Di sini kita asumsikan dari data backend.
  const titikKeseluruhan =
    data.keseluruhan ?? totalPelanggan + eksPelanggan + potensiPelanggan

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Layers className="size-3.5 shrink-0 text-violet-500" />
              <span className="text-xs text-muted-foreground">
                Kelurahan · {data.kode || 'No Kode'}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {data.nama || 'Tanpa Nama'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kec. {data.kecamatan?.nama || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <Separator className="mb-4" />

        {/* Statistik Pelanggan & Titik Keseluruhan */}
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Distribusi Pelanggan
        </p>

        {/* Rincian per kategori */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StatCard
            label="Keseluruhan Titik"
            value={titikKeseluruhan.toLocaleString('id-ID')}
            icon={<MapPin className="size-3.5 text-violet-500" />}
            accent="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label="Aktif"
            value={(data.aktif ?? 0).toLocaleString('id-ID')}
            icon={<Activity className="size-3.5 text-green-500" />}
            accent="text-green-600 dark:text-green-400"
          />

          {/* Metrik Baru: Potensi */}
          <StatCard
            label="Potensi"
            value={potensiPelanggan.toLocaleString('id-ID')}
            icon={<UserPlus className="size-3.5 text-amber-500" />}
            accent="text-amber-600 dark:text-amber-400"
          />
          {/* Metrik Baru: Eks Pelanggan */}
          <StatCard
            label="Eks Pelanggan"
            value={eksPelanggan.toLocaleString('id-ID')}
            icon={<UserMinus className="size-3.5 text-orange-500" />}
            accent="text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* Progress bar aktif */}
        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Tingkat keaktifan (dari Total Pelanggan)</span>
            <span>{persentaseAktif}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${persentaseAktif}%` }}
            />
          </div>
        </div>

        {/* Rute list */}
        {data.rutes && data.rutes.length > 0 && (
          <>
            <Separator className="mb-3" />
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Rute Cater
            </p>

            {/* Menggunakan Shadcn UI Table tanpa border luar */}
            <Table className="w-full">
              <TableBody>
                {data.rutes.map((rute) => (
                  <TableRow
                    key={rute.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    {/* Kolom Kode Rute */}
                    <TableCell className="px-2 py-2 text-xs font-medium text-foreground">
                      {rute.kode}
                    </TableCell>

                    {/* Kolom Jumlah Pelanggan (Rata Kanan) */}
                    <TableCell className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                      {((rute as any)._count?.pelanggan ?? 0).toLocaleString(
                        'id-ID',
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </ScrollArea>
  )
}
