import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const STATS = [
  {
    label: 'Total Pemutusan',
    value: '1.322',
    description: 'Jumlah pemutusan tercatat untuk periode berjalan.',
  },
  {
    label: 'TSM & SPT',
    value: '842',
    description:
      'Rekap pemutusan berdasarkan jenis TSM/SPT yang baru saja diproses.',
  },
  {
    label: 'Data ProgresCater',
    value: '4 file',
    description:
      'Berkas impor terakhir yang tersedia untuk proses closing bulanan.',
  },
]

export function ClosingSummary() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {STATS.map((stat) => (
        <Card key={stat.label} className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>{stat.value}</CardTitle>
            <CardDescription>{stat.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
