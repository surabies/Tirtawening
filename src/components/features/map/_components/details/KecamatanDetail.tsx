import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, ChevronRight, Info, Layers, Users } from 'lucide-react'
import { useMapSelection } from '../MapSelectionContext'
import { StatCard } from '../shared/StatCard'
import { DetailSkeleton } from './DetailSkeleton'
import { ErrorState } from '../shared/ErrorState'
import type { DetailViewProps } from '../types/types'

/** Panel detail untuk wilayah kecamatan yang dipilih di peta. */
export function KecamatanDetail({ id, onClose }: DetailViewProps) {
  const trpc = useTRPC()
  const { setSelected } = useMapSelection()
  const { data, isLoading, isError } = useQuery(
    trpc.peta.getKecamatanDetail.queryOptions({ id }),
  )

  if (isLoading) return <DetailSkeleton rows={5} />
  if (isError || !data) return <ErrorState onClose={onClose} />

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Layers className="size-3.5 shrink-0 text-blue-500" />
              <span className="mt-1 text-xs text-muted-foreground">
                Kecamatan · {data.kode || '-'}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {data.nama || 'Tanpa Nama'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data._count?.kelurahan ?? 0} kelurahan
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

        {/* Statistik */}
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Distribusi Pelanggan
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StatCard
            label="Total Pelanggan"
            value={(data.totalPelanggan ?? 0).toLocaleString('id-ID')}
            icon={<Users className="size-3.5 text-muted-foreground" />}
          />
          <StatCard
            label="Aktif"
            value={(data.aktif ?? 0).toLocaleString('id-ID')}
            icon={<Activity className="size-3.5 text-green-500" />}
            accent="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Non-aktif"
            value={(data.nonAktif ?? 0).toLocaleString('id-ID')}
            icon={<Activity className="size-3.5 text-red-400" />}
            accent="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="MBR"
            value={(data.mbr ?? 0).toLocaleString('id-ID')}
            icon={<Info className="size-3.5 text-blue-400" />}
            accent="text-blue-600 dark:text-blue-400"
          />
        </div>

        {/* List kelurahan */}
        {data.kelurahan && data.kelurahan.length > 0 && (
          <>
            <Separator className="mb-3" />
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Kelurahan
            </p>
            <div className="flex flex-col gap-1">
              {data.kelurahan.map((kel) => (
                <div
                  key={kel.id}
                  // Pakai setSelected dari useMapSelection() langsung (context
                  // yang sama dipakai MapClientView), supaya klik benar-benar
                  // memindahkan seleksi ke detail Kelurahan.
                  onClick={() => setSelected({ type: 'kelurahan', id: kel.id })}
                  className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {kel.kode}
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {kel.nama}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {(kel._count?.pelanggan ?? 0).toLocaleString('id-ID')}
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground transition-colors group-hover:text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}
