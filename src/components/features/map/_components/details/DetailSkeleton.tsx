import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface DetailSkeletonProps {
  rows: number
}

/** Skeleton loading generik untuk panel detail (Pelanggan/Kelurahan/Kecamatan). */
export function DetailSkeleton({ rows }: DetailSkeletonProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-48" />
      <Separator />
      {Array.from({ length: rows ?? 4 }).map((_, i) => (
        <div key={i} className="flex gap-2.5">
          <Skeleton className="mt-0.5 size-3.5 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
