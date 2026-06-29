/**
 * export-utils.ts
 * Utility export Laporan Mandiri ke Excel (.xlsx) dan PDF.
 *
 * Dependensi:
 *   pnpm add xlsx jspdf jspdf-autotable
 *
 * Import di komponen:
 *   import { exportToExcel, exportToPDF } from './export-utils'
 */

import { type LaporanMandiriRow } from './columns'

// ── Helpers ───────────────────────────────────────────────────────────────────

const BULAN = [
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
  return `${BULAN[yyyymm % 100]} ${Math.floor(yyyymm / 100)}`
}

function formatPeriodeShort(yyyymm: number): string {
  return `${BULAN_SHORT[yyyymm % 100]} ${Math.floor(yyyymm / 100)}`
}

function formatDate(d: Date | null | string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: 'Menunggu',
  DIVERIFIKASI: 'Diverifikasi',
  DITOLAK: 'Ditolak',
  DIGUNAKAN: 'Digunakan',
}

// Nama file: LaporanMandiri_Jun2026_20260629_143022.xlsx
function makeFilename(periode: number | undefined, ext: string): string {
  const now = new Date()
  const ts = now
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14) // YYYYMMDDHHmmss — sebelumnya slice(0,15) ikut nyangkut titik milidetik
    .replace(/(\d{8})(\d{6})/, '$1_$2')

  const p = periode ? `_${formatPeriodeShort(periode).replace(' ', '')}` : ''
  return `LaporanMandiri${p}_${ts}.${ext}`
}

// ── Row flattener (shared antara Excel dan PDF) ───────────────────────────────

type FlatRow = {
  'No. Langganan': string
  'Nama Pelanggan': string
  'Nama Pelapor': string
  'No. Telepon': string
  Periode: string
  'Stand (m³)': number
  'Pemakaian (m³)': string
  Status: string
  Dikirim: string
  Diproses: string
  'Diproses Oleh': string
  'Alasan Ditolak': string
}

function flattenRows(rows: LaporanMandiriRow[]): FlatRow[] {
  return rows.map((r) => ({
    'No. Langganan': r.nomorLangganan,
    'Nama Pelanggan': r.pelanggan.nama,
    'Nama Pelapor': r.namaPelapor,
    'No. Telepon': r.nomorPelapor,
    Periode: formatPeriode(r.periode),
    'Stand (m³)': r.standDilaporkan,
    'Pemakaian (m³)': r.pembacaan ? String(r.pembacaan.pemakaianM3) : '-',
    Status: STATUS_LABEL[r.status] ?? r.status,
    Dikirim: formatDate(r.createdAt),
    Diproses: formatDate(r.verifiedAt),
    'Diproses Oleh': r.verifiedBy?.name ?? '-',
    'Alasan Ditolak': r.alasanDitolak ?? '-',
  }))
}

// ── EXPORT EXCEL ──────────────────────────────────────────────────────────────

export async function exportToExcel(
  rows: LaporanMandiriRow[],
  options?: {
    periode?: number
    /** Nama PDAM untuk header sheet */
    instansi?: string
  },
): Promise<void> {
  // Dynamic import — tidak masuk bundle kalau fitur tidak dipakai
  const XLSX = await import('xlsx')

  const flatRows = flattenRows(rows)
  const periodeLabel = options?.periode
    ? formatPeriode(options.periode)
    : 'Semua Periode'

  const instansi = options?.instansi ?? 'PERUMDA Tirtawening Kota Bandung'

  // ── Buat workbook ──
  const wb = XLSX.utils.book_new()

  // ── Meta header rows (di atas data) ──
  const headerMeta: (string | number)[][] = [
    [instansi],
    ['Laporan Mandiri Meter'],
    [`Periode: ${periodeLabel}`],
    [
      `Diekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    ],
    [`Jumlah data: ${rows.length} laporan`],
    [], // baris kosong pemisah
  ]

  // ── Sheet dari array of objects ──
  const ws = XLSX.utils.aoa_to_sheet(headerMeta)

  // Append data rows di bawah header meta
  XLSX.utils.sheet_add_json(ws, flatRows, {
    origin: headerMeta.length, // mulai di baris ke-7 (0-indexed = 6)
    skipHeader: false,
  })

  // ── Lebar kolom otomatis ──
  const colWidths: { wch: number }[] = [
    { wch: 14 }, // No. Langganan
    { wch: 28 }, // Nama Pelanggan
    { wch: 22 }, // Nama Pelapor
    { wch: 16 }, // No. Telepon
    { wch: 14 }, // Periode
    { wch: 12 }, // Stand
    { wch: 14 }, // Pemakaian
    { wch: 14 }, // Status
    { wch: 14 }, // Dikirim
    { wch: 14 }, // Diproses
    { wch: 22 }, // Diproses Oleh
    { wch: 40 }, // Alasan Ditolak
  ]
  ws['!cols'] = colWidths

  // ── Freeze panes — beku header ──
  ws['!freeze'] = { xSplit: 0, ySplit: headerMeta.length + 1 }

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Mandiri')

  // ── Download ──
  XLSX.writeFile(wb, makeFilename(options?.periode, 'xlsx'))
}

// ── EXPORT PDF ────────────────────────────────────────────────────────────────

export async function exportToPDF(
  rows: LaporanMandiriRow[],
  options?: {
    periode?: number
    instansi?: string
    /**
     * Ukuran kertas. Lebar tiap kolom dihitung PROPORSIONAL dari lebar
     * halaman yang sebenarnya (bukan mm tetap), jadi tabel selalu pas
     * mengisi halaman & No. Telp nggak ke-wrap di ukuran kertas apa pun.
     */
    paperSize?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid'
    /** Default landscape — kolomnya banyak, paling pas di orientasi lebar */
    orientation?: 'landscape' | 'portrait'
  },
): Promise<void> {
  // Dynamic import
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const periodeLabel = options?.periode
    ? formatPeriode(options.periode)
    : 'Semua Periode'
  const instansi = options?.instansi ?? 'PERUMDA Tirtawening Kota Bandung'
  const paperSize = options?.paperSize ?? 'a4'
  const orientation = options?.orientation ?? 'landscape'

  const doc = new jsPDF({ orientation, unit: 'mm', format: paperSize })

  // ── Margin & lebar halaman aktual — basis hitung lebar kolom ──
  const MARGIN = 14
  const pageWidth = doc.internal.pageSize.getWidth()
  const usableWidth = pageWidth - MARGIN * 2

  // ── Header teks ──
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(instansi, MARGIN, 14)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Laporan Mandiri Meter — ${periodeLabel}`, MARGIN, 20)
  doc.text(
    `Diekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}  |  Jumlah data: ${rows.length} laporan`,
    MARGIN,
    26,
  )

  // ── Kolom PDF (lebih ringkas dari Excel, tanpa alasan ditolak) ──
  const columns = [
    { header: 'No.', dataKey: 'no' },
    { header: 'No. Langganan', dataKey: 'noLangganan' },
    { header: 'Nama Pelanggan', dataKey: 'namaPelanggan' },
    { header: 'Nama Pelapor', dataKey: 'namaPelapor' },
    { header: 'No. Telp', dataKey: 'noTelp' },
    { header: 'Periode', dataKey: 'periode' },
    { header: 'Stand (m³)', dataKey: 'stand' },
    { header: 'Pakai (m³)', dataKey: 'pakai' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Dikirim', dataKey: 'dikirim' },
    { header: 'Diproses', dataKey: 'diproses' },
  ]

  const body = rows.map((r, i) => ({
    no: i + 1,
    noLangganan: r.nomorLangganan,
    namaPelanggan: r.pelanggan.nama,
    namaPelapor: r.namaPelapor,
    noTelp: r.nomorPelapor,
    periode: formatPeriodeShort(r.periode),
    stand: r.standDilaporkan.toLocaleString('id-ID'),
    pakai: r.pembacaan ? r.pembacaan.pemakaianM3 : '-',
    status: STATUS_LABEL[r.status] ?? r.status,
    dikirim: formatDate(r.createdAt),
    diproses: formatDate(r.verifiedAt),
  }))

  // ── Lebar kolom sebagai BOBOT (proporsi), bukan mm tetap ──
  // Dinormalisasi ke `usableWidth` di bawah, jadi otomatis menyesuaikan
  // lebar halaman apa pun. Bobot "noTelp" sengaja dilebihkan supaya
  // 12 digit nomor HP (mis. 081220667809) selalu muat 1 baris, center,
  // nggak ke-wrap ke baris ke-2 seperti sebelumnya.
  const COLUMN_WEIGHTS: Record<string, number> = {
    no: 8,
    noLangganan: 26,
    namaPelanggan: 34,
    namaPelapor: 26,
    noTelp: 30,
    periode: 16,
    stand: 18,
    pakai: 18,
    status: 20,
    dikirim: 20,
    diproses: 20,
  }
  const totalWeight = Object.values(COLUMN_WEIGHTS).reduce((a, b) => a + b, 0)
  const widthOf = (key: string) =>
    (COLUMN_WEIGHTS[key] / totalWeight) * usableWidth

  autoTable(doc, {
    startY: 32,
    margin: { left: MARGIN, right: MARGIN },
    columns,
    body,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      no: { halign: 'center', cellWidth: widthOf('no') },
      noLangganan: {
        halign: 'center',
        font: 'courier',
        cellWidth: widthOf('noLangganan'),
      },
      namaPelanggan: { cellWidth: widthOf('namaPelanggan') },
      namaPelapor: { cellWidth: widthOf('namaPelapor') },
      noTelp: {
        halign: 'center',
        font: 'courier',
        fontSize: 7, // sedikit lebih kecil — extra aman dari wrap di kertas sempit
        cellWidth: widthOf('noTelp'),
      },
      periode: { halign: 'center', cellWidth: widthOf('periode') },
      stand: { halign: 'right', cellWidth: widthOf('stand') },
      pakai: { halign: 'right', cellWidth: widthOf('pakai') },
      status: { halign: 'center', cellWidth: widthOf('status') },
      dikirim: { halign: 'center', cellWidth: widthOf('dikirim') },
      diproses: { halign: 'center', cellWidth: widthOf('diproses') },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    // Footer total
    foot: [
      [
        {
          content: `Total: ${rows.length} laporan`,
          colSpan: columns.length,
          styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 },
        },
      ],
    ],
    showFoot: 'lastPage',
  })

  doc.save(makeFilename(options?.periode, 'pdf'))
}
