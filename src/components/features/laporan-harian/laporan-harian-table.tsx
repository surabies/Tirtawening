import { useState } from 'react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  KATEGORI_STYLES,
  resolveKategoriTanggal,
  resolveLabelTanggal,
} from './laporan-harian-kategori'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NAMA_BULAN = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function buildPeriodeOptions(bulanTerakhir = 12) {
  const now = new Date()
  const opts: { value: number; label: string }[] = []
  for (let i = 0; i < bulanTerakhir; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyymm = d.getFullYear() * 100 + (d.getMonth() + 1)
    opts.push({
      value: yyyymm,
      label: `${NAMA_BULAN[d.getMonth() + 1]} ${d.getFullYear()}`,
    })
  }
  return opts
}

function formatPeriodeLabel(periode: number): string {
  const month = periode % 100
  const year = Math.floor(periode / 100)
  return `${NAMA_BULAN[month]} ${year}`
}

function formatAngka(n: number): string {
  return n.toLocaleString('id-ID')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LaporanHarianMatrixTable() {
  const trpc = useTRPC()
  const periodeOptions = buildPeriodeOptions(12)
  const [periode, setPeriode] = useState<number>(periodeOptions[0].value)

  const { data, isLoading } = useQuery(
    trpc.laporanHarian.matrix.queryOptions({ periode }),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Laporan Periode Cater Per Tanggal
        </h3>

        <div className="flex items-center gap-3">
          <KategoriLegend />
          <Select
            value={periode.toString()}
            onValueChange={(v) => setPeriode(parseInt(v))}
          >
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : !data || data.items.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
          Belum ada data pencatatan untuk periode {formatPeriodeLabel(periode)}.
        </div>
      ) : (
        <MatrixTable data={data} periode={periode} />
      )}
    </div>
  )
}

// ── Legend kategori (biar yang lihat tabel tahu arti warnanya) ───────────────

function KategoriLegend() {
  return (
    <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
      {Object.values(KATEGORI_STYLES).map((k) => (
        <span key={k.label} className="flex items-center gap-1.5">
          <span
            className={cn('size-2.5 rounded-full', k.headerClassName)}
            aria-hidden
          />
          {k.label}
        </span>
      ))}
    </div>
  )
}

// ── Matrix table itself ──────────────────────────────────────────────────────

type MatrixData = NonNullable<
  ReturnType<
    typeof useQuery<{
      periode: number
      jumlahHari: number
      hariInfo: {
        tanggal: number
        isHariKerja: boolean
        isWeekend: boolean
        liburNasional: string | null
      }[]
      items: {
        pencatatId: string
        namaPetugas: string
        harian: number[]
        totalCatat: number
        target: number
        selisih: number
      }[]
      total: {
        harian: number[]
        totalCatat: number
        target: number
        selisih: number
      }
    }>
  >['data']
>

function MatrixTable({ data, periode }: { data: MatrixData; periode: number }) {
  // Lebar kolom sticky dikunci PASTI (bukan cuma min-width) supaya offset
  // `left` kolom kedua selalu akurat di semua ukuran layar/zoom. Kalau cuma
  // pakai min-width, browser boleh melebarkan kolom sesuai konten (mis. nama
  // petugas panjang atau font rendering beda di tiap device), sementara
  // offset `left` kolom berikutnya tetap statis -> menyebabkan tabrakan/
  // tumpang tindih seperti yang terjadi di layar desktop kecil.
  const COL_NO_WIDTH = 'w-9 min-w-9 max-w-9'
  const COL_NAMA_WIDTH = 'w-[136px] min-w-[136px] max-w-[136px]'
  const COL_NAMA_LEFT = 'left-9' // harus sama persis dengan lebar kolom No

  // Header tabel pakai warna biru solid INDEPENDEN dari token --primary
  // project (lihat laporan-harian-theme.css), karena --primary project bisa
  // saja gelap/hitam sesuai tema yang dipilih, sementara tabel ini memang
  // didesain biru terlepas dari tema apa pun yang dipakai.
  const HEADER_BG = 'bg-[hsl(var(--laporan-header))]'
  const HEADER_TEXT = 'text-[hsl(var(--laporan-header-foreground))]'

  // Kolom sticky (No, Nama Cater) pakai box-shadow sebagai pemisah visual,
  // BUKAN border-right biasa. Border tipis di tepi elemen sticky rawan
  // "putus" sesaat saat browser melakukan sub-pixel repaint ketika tabel
  // discroll horizontal (karena posisi sticky dihitung ulang tiap frame),
  // sehingga warna background di belakangnya sempat keceplosan kelihatan.
  // box-shadow tidak punya masalah ini karena digambar sebagai layer terpisah
  // yang tidak ikut ke-recalculate posisinya.
  const STICKY_DIVIDER = 'shadow-[2px_0_0_0_hsl(var(--border))]'

  return (
    <div className="overflow-hidden rounded-none border border-border">
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-xs">
          <TableHeader>
            {/* Baris judul kolom Tanggal */}
            <TableRow className="hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className={cn(
                  'sticky left-0 z-20 h-auto border-b border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  STICKY_DIVIDER,
                  COL_NO_WIDTH,
                )}
              >
                No
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'sticky z-20 h-auto border-b border-border px-3 py-2 text-left font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  STICKY_DIVIDER,
                  COL_NAMA_WIDTH,
                  COL_NAMA_LEFT,
                )}
              >
                Nama Cater
              </TableHead>
              <TableHead
                colSpan={data.jumlahHari}
                className={cn(
                  'h-auto border-b border-r border-border py-1.5 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                )}
              >
                Tanggal
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-[80px] border-b border-r border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Total Catat
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-[70px] border-b border-r border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Target
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(
                  'h-auto min-w-[70px] border-b border-border px-2 py-2 text-center font-semibold',
                  HEADER_BG,
                  HEADER_TEXT,
                  'opacity-90',
                )}
              >
                Selisih
              </TableHead>
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {data.hariInfo.map((h) => {
                const kategori = resolveKategoriTanggal(
                  periode,
                  h.tanggal,
                  h.isHariKerja,
                  h.liburNasional,
                )
                const style = KATEGORI_STYLES[kategori]
                const label = resolveLabelTanggal(kategori, h.liburNasional)
                return (
                  <TableHead
                    key={h.tanggal}
                    title={label}
                    className={cn(
                      'h-auto min-w-[34px] border-b border-r border-border px-1 py-1.5 text-center font-semibold',
                      style.headerClassName,
                      style.headerTextClassName,
                    )}
                  >
                    {h.tanggal}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.items.map((row, idx) => (
              <TableRow key={row.pencatatId} className="group">
                <TableCell
                  className={cn(
                    'sticky left-0 z-10 truncate border-b border-border bg-card px-2 py-1.5 text-center tabular-nums group-hover:bg-muted/40',
                    STICKY_DIVIDER,
                    COL_NO_WIDTH,
                  )}
                >
                  {idx + 1}
                </TableCell>
                <TableCell
                  className={cn(
                    'sticky z-10 truncate border-b border-border bg-card px-3 py-1.5 font-medium uppercase group-hover:bg-muted/40',
                    STICKY_DIVIDER,
                    COL_NAMA_WIDTH,
                    COL_NAMA_LEFT,
                  )}
                  title={row.namaPetugas}
                >
                  {row.namaPetugas}
                </TableCell>
                {row.harian.map((value, i) => {
                  const hari = data.hariInfo[i]
                  const isKosongDiHariKerja = value === 0 && hari?.isHariKerja
                  return (
                    <TableCell
                      key={i}
                      className={cn(
                        'border-b border-r border-border px-1 py-1.5 text-center tabular-nums',
                        isKosongDiHariKerja
                          ? 'bg-destructive/10 text-muted-foreground'
                          : 'text-foreground',
                      )}
                    >
                      {value}
                    </TableCell>
                  )
                })}
                <TableCell className="border-b border-r border-border px-2 py-1.5 text-center font-semibold tabular-nums">
                  {formatAngka(row.totalCatat)}
                </TableCell>
                <TableCell className="border-b border-r border-border px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                  {formatAngka(row.target)}
                </TableCell>
                <TableCell
                  className={cn(
                    'border-b border-border px-2 py-1.5 text-center font-semibold tabular-nums',
                    row.selisih > 0
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {formatAngka(row.selisih)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow className="bg-muted/60 font-semibold hover:bg-muted/60">
              <TableCell
                className={cn(
                  'sticky left-0 z-10 border-b border-border bg-muted px-2 py-1.5 text-center',
                  STICKY_DIVIDER,
                  COL_NO_WIDTH,
                )}
                aria-hidden
              />
              <TableCell
                className={cn(
                  'sticky z-10 border-b border-border bg-muted px-3 py-1.5 text-left',
                  STICKY_DIVIDER,
                  COL_NAMA_WIDTH,
                  COL_NAMA_LEFT,
                )}
              >
                Total
              </TableCell>
              {data.total.harian.map((value, i) => (
                <TableCell
                  key={i}
                  className="border-r border-border px-1 py-1.5 text-center tabular-nums"
                >
                  {formatAngka(value)}
                </TableCell>
              ))}
              <TableCell className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {formatAngka(data.total.totalCatat)}
              </TableCell>
              <TableCell className="border-r border-border px-2 py-1.5 text-center tabular-nums">
                {formatAngka(data.total.target)}
              </TableCell>
              <TableCell
                className={cn(
                  'px-2 py-1.5 text-center tabular-nums',
                  data.total.selisih > 0
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {formatAngka(data.total.selisih)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
