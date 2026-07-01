import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ClosingImportForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import file ProgresCater</CardTitle>
        <CardDescription>
          Pilih berkas CSV/Excel untuk mengunggah data closing dan memperbarui
          status pemutusan.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="closing-import">File ProgresCater</Label>
          <Input
            id="closing-import"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="p-0!"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Pastikan berkas ProgresCater sudah terformat sesuai template standar.
          Halaman ini masih berfungsi sebagai placeholder modular untuk logika
          import yang akan dikembangkan selanjutnya.
        </p>
      </CardContent>

      <CardFooter>
        <Button type="button">Mulai Import</Button>
      </CardFooter>
    </Card>
  )
}
