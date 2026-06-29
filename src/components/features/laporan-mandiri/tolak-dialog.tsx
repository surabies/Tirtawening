import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (alasan: string) => void
  isPending?: boolean
}

export function TolakDialog({ open, onClose, onConfirm, isPending }: Props) {
  const [alasan, setAlasan] = useState('')
  const isValid = alasan.trim().length >= 10

  function handleConfirm() {
    if (!isValid) return
    onConfirm(alasan.trim())
  }

  function handleClose() {
    setAlasan('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Laporan</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="alasan">
            Alasan penolakan{' '}
            <span className="text-muted-foreground font-normal">
              (minimal 10 karakter)
            </span>
          </Label>
          <Textarea
            id="alasan"
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Contoh: Foto tidak jelas, angka stand tidak terbaca…"
            rows={3}
            className="resize-none"
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {alasan.length} karakter
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Menyimpan…' : 'Tolak Laporan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
