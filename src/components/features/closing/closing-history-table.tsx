import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DUMMY_HISTORY = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  periode: `2026-${String(index + 1).padStart(2, '0')}`,
  tanggal: `2026-${String(index + 1).padStart(2, '0')}-10`,
  totalPemutusan: 100 + index * 12,
  status: index % 2 === 0 ? 'Selesai' : 'Menunggu',
}))

export function ClosingHistoryTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periode</TableHead>
            <TableHead>Tanggal Closing</TableHead>
            <TableHead>Total Pemutusan</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DUMMY_HISTORY.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.periode}</TableCell>
              <TableCell>{row.tanggal}</TableCell>
              <TableCell>{row.totalPemutusan}</TableCell>
              <TableCell>{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
