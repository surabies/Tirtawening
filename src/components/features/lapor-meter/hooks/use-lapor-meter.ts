import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTRPC } from '@/integrations/trpc/react'
import type { HasilLaporan } from '../types/hasil-laporan'

// ── Validation helpers ───────────────────────────────────────────────────────

/** Hanya huruf & spasi, otomatis Title Case tiap kata. */
function formatNamaInput(value: string): string {
  return value
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s/, '')
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

function validateNama(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Nama pelapor wajib diisi.'
  if (trimmed.length < 3) return 'Nama minimal 3 karakter.'
  if (/\d/.test(trimmed)) return 'Nama tidak boleh mengandung angka.'
  return null
}

function validateNomorTelepon(value: string): string | null {
  if (!value) return 'Nomor telepon wajib diisi.'
  if (!value.startsWith('08'))
    return 'Nomor telepon harus diawali 08, contoh: 081234567890.'
  if (value.length < 10) return 'Nomor telepon terlalu pendek.'
  if (value.length > 14) return 'Nomor telepon terlalu panjang.'
  return null
}

export function useLaporMeter(onSuccess: (hasil: HasilLaporan) => void) {
  const trpc = useTRPC()
  const periode = new Date().getFullYear() * 100 + (new Date().getMonth() + 1)

  const [nomorLangganan, setNomorLangganan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [standInput, setStandInput] = useState('')
  const [namaPelapor, setNamaPelaporRaw] = useState('')
  const [nomorPelapor, setNomorPelaporRaw] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── field-level errors (ditampilkan langsung di bawah masing-masing input) ──
  const [namaError, setNamaError] = useState<string | null>(null)
  const [teleponError, setTeleponError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const setNamaPelapor = (value: string) => {
    const formatted = formatNamaInput(value)
    setNamaPelaporRaw(formatted)
    setNamaError(formatted ? validateNama(formatted) : null)
  }

  const setNomorPelapor = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 14)
    setNomorPelaporRaw(digitsOnly)
    setTeleponError(digitsOnly ? validateNomorTelepon(digitsOnly) : null)
  }

  const handleNamaBlur = () => {
    setNamaPelaporRaw((prev) => toTitleCase(prev))
    setNamaError(validateNama(namaPelapor))
  }

  const {
    data: pelanggan,
    isFetching: isCariLoading,
    isFetched: isCariFetched,
  } = useQuery({
    ...trpc.laporanMandiri.cariPelanggan.queryOptions({ query: searchQuery }),
    enabled: searchQuery.length >= 5,
  })

  // Pencarian selesai, tidak ada hasil → nomor tidak ditemukan
  const notFound = hasSearched && isCariFetched && !isCariLoading && !pelanggan

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
      if (file) setError('File harus berupa gambar (JPG, PNG, atau HEIC).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran foto maksimal 10 MB.')
      return
    }
    setFotoFile(file)
    try {
      const compressed = await compressImage(file)
      setFotoPreview(compressed)
      setError(null)
    } catch {
      setError('Gagal memproses gambar. Coba foto lain.')
    }
  }

  const handleNomorLanggananChange = (value: string) => {
    // Hanya angka — nomor langganan PDAM selalu numerik
    const digits = value.replace(/\D/g, '').slice(0, 11)
    setNomorLangganan(digits)
    setHasSearched(false)
    setError(null)
  }

  const handleCariPelanggan = useCallback(() => {
    const trimmed = nomorLangganan.trim()
    if (trimmed.length < 5) {
      setError('Nomor pelanggan minimal 5 digit.')
      return
    }
    setError(null)
    setHasSearched(true)
    setSearchQuery(trimmed)
  }, [nomorLangganan])

  // Auto-search: jalan otomatis 500ms setelah user berhenti mengetik
  // (minimal 5 digit), atau langsung saat mencapai 11 digit penuh.
  useEffect(() => {
    const trimmed = nomorLangganan.trim()
    if (trimmed.length < 5) return

    if (trimmed.length === 11) {
      setHasSearched(true)
      setSearchQuery(trimmed)
      return
    }

    const timeout = setTimeout(() => {
      setHasSearched(true)
      setSearchQuery(trimmed)
    }, 500)

    return () => clearTimeout(timeout)
  }, [nomorLangganan])

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!pelanggan) return setError('Cari nomor pelanggan terlebih dahulu.')
    if (!standInput || isNaN(Number(standInput)))
      return setError('Stand meter harus berupa angka.')
    if (!fotoPreview) return setError('Foto stand meter wajib diunggah.')

    const namaErr = validateNama(namaPelapor)
    const teleponErr = validateNomorTelepon(nomorPelapor)
    setNamaError(namaErr)
    setTeleponError(teleponErr)
    if (namaErr) return setError(namaErr)
    if (teleponErr) return setError(teleponErr)

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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[lapor-meter] uploadFoto gagal:', err)
      setError('Gagal mengupload foto. Periksa koneksi internet dan coba lagi.')
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
    setNomorLangganan: handleNomorLanggananChange,
    standInput,
    setStandInput,
    namaPelapor,
    setNamaPelapor,
    handleNamaBlur,
    namaError,
    nomorPelapor,
    setNomorPelapor,
    teleponError,
    fotoPreview,
    setFotoPreview,
    setFotoFile,
    error,
    isUploading,
    isSubmitting,
    fileInputRef,
    pelanggan,
    isCariLoading,
    notFound,
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
