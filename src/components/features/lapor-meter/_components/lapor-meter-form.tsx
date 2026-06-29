'use client'
import { useLaporMeter, getPeriodeLabel } from '../hooks/use-lapor-meter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { HasilLaporan } from '../types/hasil-laporan'
import logo from '@/assets/images/logo.png'
import {
  Camera,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'

export function LaporMeterForm({
  onSuccess,
}: {
  onSuccess: (hasil: HasilLaporan) => void
}) {
  const {
    nomorLangganan,
    setNomorLangganan,
    standInput,
    setStandInput,
    namaPelapor,
    setNamaPelapor,
    nomorPelapor,
    setNomorPelapor,
    fotoPreview,
    setFotoPreview,
    setFotoFile,
    error,
    isUploading,
    isSubmitting,
    fileInputRef,
    pelanggan,
    isCariLoading,
    existingLaporan,
    periode,
    handleFotoChange,
    handleCariPelanggan,
    handleSubmit,
  } = useLaporMeter(onSuccess)

  const isLoading = isUploading || isSubmitting

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="flex flex-col items-center text-center">
        <img
          src={logo}
          alt="Logo Tirtacater"
          width={50}
          height={50}
          className="mb-3 rounded-full border border-border/40 bg-card p-1.5 shadow-[0_2px_12px_rgb(0,0,0,0.06)] dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
        />
        <h2 className="text-xl font-bold text-foreground">Lapor Stand Meter</h2>
        <p className="text-sm text-muted-foreground">
          Periode:{' '}
          <span className="font-medium text-foreground">
            {getPeriodeLabel(periode)}
          </span>
        </p>
      </div>

      <div className="h-px bg-border/60" />

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">
          Nomor Pelanggan
        </Label>
        <div className="flex gap-2">
          <Input
            value={nomorLangganan}
            onChange={(e) => setNomorLangganan(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCariPelanggan()}
            className="h-10 rounded-xl font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={handleCariPelanggan}
            disabled={isCariLoading}
          >
            {isCariLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {pelanggan && (
          <div className="mt-4 space-y-2.5 rounded-lg border border-green-200 bg-green-100 px-3 py-3 dark:border-green-800 dark:bg-green-900/30">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-sm font-semibold">{pelanggan.nama}</p>
            </div>
            <div className="grid grid-cols-2 text-xs">
              <div>
                <p className="text-muted-foreground uppercase">Alamat</p>
                <p>{pelanggan.alamat}</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase">Gol. Tarif</p>
                <p>{pelanggan.tarifGolongan?.kategori ?? '—'}</p>
              </div>
            </div>
          </div>
        )}
        {existingLaporan && (
          <div className="rounded-lg bg-amber-500/10 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Laporan periode ini sudah ada.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">
          Angka Stand Meter
        </Label>
        <Input
          value={standInput}
          onChange={(e) => setStandInput(e.target.value.replace(/\D/g, ''))}
          className="h-10 rounded-xl font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">
          Foto Stand Meter
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFotoChange}
        />
        {fotoPreview ? (
          <div className="relative">
            <img src={fotoPreview} className="w-full rounded-xl" />
            <button
              onClick={() => {
                setFotoPreview(null)
                setFotoFile(null)
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 hover:bg-muted/50"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm">Ambil foto</p>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase">
          Data Pelapor
        </Label>
        <Input
          placeholder="Nama lengkap"
          value={namaPelapor}
          onChange={(e) => setNamaPelapor(e.target.value)}
          className="h-10 rounded-xl"
        />
        <Input
          placeholder="Nomor telepon"
          value={nomorPelapor}
          onChange={(e) => setNomorPelapor(e.target.value)}
          className="h-10 rounded-xl"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !pelanggan || !!existingLaporan}
        className="h-12 w-full rounded-xl font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" /> Memproses...
          </>
        ) : (
          'Kirim Laporan'
        )}
      </Button>
    </div>
  )
}
