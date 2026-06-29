import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import type { HasilLaporan } from '../types/hasil-laporan'

export function useLaporMeter(onSuccess: (hasil: HasilLaporan) => void) {
  const trpc = useTRPC()
  const periode = new Date().getFullYear() * 100 + (new Date().getMonth() + 1)

  const [nomorLangganan, setNomorLangganan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [standInput, setStandInput] = useState('')
  const [namaPelapor, setNamaPelapor] = useState('')
  const [nomorPelapor, setNomorPelapor] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: pelanggan, isFetching: isCariLoading } = useQuery({
    ...trpc.laporanMandiri.cariPelanggan.queryOptions({ query: searchQuery }),
    enabled: searchQuery.length >= 5,
  })

  const { data: existingLaporan } = useQuery({
    ...trpc.laporanMandiri.cekPeriode.queryOptions({
      pelangganId: pelanggan?.id ?? '',
      periode,
    }),
    enabled: !!pelanggan?.id,
  })

  const { mutate: submit, isPending: isSubmitting } = useMutation(
    trpc.laporanMandiri.submit.mutationOptions({
      onSuccess: (data) => {
        onSuccess({
          nomorLangganan: data.nomorLangganan,
          nama: pelanggan?.nama ?? '',
          periode: getPeriodeLabel(periode),
          stand: data.standDilaporkan,
          fotoUrl: data.fotoUrl,
        })
      },
      onError: (err) => {
        setError(err.message)
        setIsUploading(false)
      },
    }),
  )

  // Foto diupload lewat tRPC (server) — bukan langsung dari client —
  // karena uploadFotoMeter memakai SDK cloudinary yang Node-only.
  const { mutateAsync: uploadFoto } = useMutation(
    trpc.laporanMandiri.uploadFoto.mutationOptions(),
  )

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      if (file) setError('File harus berupa gambar.')
      return
    }
    setFotoFile(file)
    try {
      const compressed = await compressImage(file)
      setFotoPreview(compressed)
      setError(null)
    } catch {
      setError('Gagal memproses gambar.')
    }
  }

  const handleCariPelanggan = () => {
    if (nomorLangganan.trim().length >= 5) setSearchQuery(nomorLangganan.trim())
  }

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!pelanggan) return setError('Cari nomor pelanggan terlebih dahulu.')
    if (!standInput || isNaN(Number(standInput)))
      return setError('Stand meter harus berupa angka.')
    if (!fotoPreview) return setError('Foto stand meter wajib diunggah.')
    if (!namaPelapor.trim() || !nomorPelapor.trim())
      return setError('Data pelapor wajib diisi.')
    if (existingLaporan)
      return setError(
        `Laporan periode ${getPeriodeLabel(periode)} sudah dikirim.`,
      )

    try {
      setIsUploading(true)
      const { url, publicId } = await uploadFoto({
        base64: fotoPreview,
        periode: String(periode),
        tipeFoto: 'stand',
        nomorLangganan: pelanggan.nomorLangganan,
      })

      submit({
        pelangganId: pelanggan.id,
        nomorLangganan: pelanggan.nomorLangganan,
        periode,
        standDilaporkan: Number(standInput),
        fotoUrl: url,
        fotoPublicId: publicId,
        nomorPelapor: nomorPelapor.trim(),
        namaPelapor: namaPelapor.trim(),
      })
    } catch {
      setError('Gagal mengupload foto.')
      setIsUploading(false)
    }
  }, [
    pelanggan,
    standInput,
    fotoPreview,
    namaPelapor,
    nomorPelapor,
    existingLaporan,
    periode,
    submit,
    uploadFoto,
  ])

  return {
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
  }
}

// Helper functions (tetap di file hook atau pindahkan ke utils)
export function getPeriodeLabel(periode: number): string {
  const year = Math.floor(periode / 100)
  const month = periode % 100
  return new Date(year, month - 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = document.createElement('img')
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
