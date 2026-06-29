// seed/01-referensi.ts
// Fase 1: Seed semua tabel referensi
// Urutan: WilayahAdm → WilayahDist → SeksiCater + WilayahSeksi → Rute + Zona
//         → Kecamatan → Kelurahan → TarifGolongan → Pencatat → Konfigurasi
//
// Semua pakai upsert → aman dijalankan berulang kali (idempotent)

import { prisma } from './client'
import { GolonganTarif } from '@/generated/prisma/client'
import { log } from './utils'

export async function seedReferensi() {
  log('01-REFERENSI', 'Mulai seed data referensi...')

  // ── 1. WilayahAdm ──────────────────────────────────────────────────────────
  const wilAdmData = [
    { kode: 'K', nama: 'KAREES' },
    { kode: 'C', nama: 'CIBEUNYING' },
    { kode: 'T', nama: 'TEGALLEGA' },
    { kode: 'B', nama: 'BOJONEGARA' },
  ]

  for (const d of wilAdmData) {
    await prisma.wilayahAdm.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama },
      create: d,
    })
  }
  log('01-REFERENSI', `WilayahAdm: ${wilAdmData.length} records`)

  // ── 2. WilayahDist ─────────────────────────────────────────────────────────
  const wilDistData = [
    { kode: 'S', nama: 'BARAT 2', wilayahAdmKode: 'K' },
    { kode: 'B', nama: 'BARAT 1', wilayahAdmKode: 'T' },
    { kode: 'T', nama: 'TIMUR', wilayahAdmKode: 'T' },
    { kode: 'U', nama: 'UTARA', wilayahAdmKode: 'C' },
  ]

  for (const d of wilDistData) {
    const wilAdm = await prisma.wilayahAdm.findUnique({
      where: { kode: d.wilayahAdmKode },
    })
    if (!wilAdm) continue
    await prisma.wilayahDist.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama, wilayahAdmId: wilAdm.id },
      create: { kode: d.kode, nama: d.nama, wilayahAdmId: wilAdm.id },
    })
  }
  log('01-REFERENSI', `WilayahDist: ${wilDistData.length} records`)

  // ── 3. SeksiCater ──────────────────────────────────────────────────────────
  const seksiData = [
    { kode: 'C1', nama: 'WIL CATER 1', wilDistKode: 'T' },
    { kode: 'C4', nama: 'WIL CATER 4', wilDistKode: 'S' },
    { kode: 'C5', nama: 'WIL CATER 5', wilDistKode: 'S' },
  ]

  for (const d of seksiData) {
    const wilDist = await prisma.wilayahDist.findUnique({
      where: { kode: d.wilDistKode },
    })
    if (!wilDist) continue
    await prisma.seksiCater.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama, wilayahDistId: wilDist.id },
      create: { kode: d.kode, nama: d.nama, wilayahDistId: wilDist.id },
    })
  }
  log('01-REFERENSI', `SeksiCater: ${seksiData.length} records`)

  // ── 4. WilayahSeksi ────────────────────────────────────────────────────────
  const wilSeksiData = [
    { kode: 'B02', nama: 'WIL BARAT 2', wilDistKode: 'S' },
    { kode: 'B03', nama: 'WIL BARAT 3', wilDistKode: 'S' },
    { kode: 'B04', nama: 'WIL BARAT 4', wilDistKode: 'S' },
    { kode: 'B05', nama: 'WIL BARAT 5', wilDistKode: 'S' },
    { kode: 'T01', nama: 'WIL TIMUR 1', wilDistKode: 'S' },
    { kode: 'T02', nama: 'WIL TIMUR 2', wilDistKode: 'S' },
    { kode: 'T03', nama: 'WIL TIMUR 3', wilDistKode: 'T' },
    { kode: 'U01', nama: 'WIL UTARA 1', wilDistKode: 'U' },
    { kode: 'U03', nama: 'WIL UTARA 3', wilDistKode: 'U' },
  ]

  for (const d of wilSeksiData) {
    const wilDist = await prisma.wilayahDist.findUnique({
      where: { kode: d.wilDistKode },
    })
    if (!wilDist) continue
    await prisma.wilayahSeksi.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama, wilayahDistId: wilDist.id },
      create: { kode: d.kode, nama: d.nama, wilayahDistId: wilDist.id },
    })
  }
  log('01-REFERENSI', `WilayahSeksi: ${wilSeksiData.length} records`)

  // ── 5. Zona ────────────────────────────────────────────────────────────────
  const zonaData = [
    { kode: 'B02', nama: 'BSP02', wilSeksiKode: 'B02' },
    { kode: 'B03', nama: 'BSP03', wilSeksiKode: 'B03' },
    { kode: 'B05', nama: 'BSP05 BARAT 1', wilSeksiKode: 'B05' },
    { kode: 'B29', nama: 'ST LENGKONG TENGAH', wilSeksiKode: 'B04' },
    { kode: 'B30', nama: 'ST MUTUMANIKAM', wilSeksiKode: 'B04' },
    { kode: 'B34', nama: 'ST SURYALAYA', wilSeksiKode: 'B04' },
  ]

  for (const d of zonaData) {
    const wilSeksi = await prisma.wilayahSeksi.findUnique({
      where: { kode: d.wilSeksiKode },
    })
    if (!wilSeksi) continue
    await prisma.zona.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama, wilayahSeksiId: wilSeksi.id },
      create: { kode: d.kode, nama: d.nama, wilayahSeksiId: wilSeksi.id },
    })
  }
  log(
    '01-REFERENSI',
    `Zona: ${zonaData.length} records (sisanya di-seed di fase 02)`,
  )

  // ── 6. Kecamatan ───────────────────────────────────────────────────────────
  const kecamatanData = [
    { kode: 'KD', nama: 'REGOL' },
    { kode: 'KC', nama: 'LENGKONG' },
    { kode: 'BD', nama: 'ANDIR' },
    { kode: 'CD', nama: 'SUMUR BANDUNG' },
    { kode: 'TA', nama: 'ASTANA ANYAR' },
    { kode: 'TC', nama: 'BOJONGLOA KIDUL' },
    { kode: 'CC', nama: 'BANDUNG WETAN' },
  ]

  for (const d of kecamatanData) {
    await prisma.kecamatan.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama },
      create: d,
    })
  }
  log('01-REFERENSI', `Kecamatan: ${kecamatanData.length} records`)

  // ── 7. TarifGolongan ───────────────────────────────────────────────────────
  const tarifData: Array<{
    kode: GolonganTarif
    kodeAsli: string
    nama: string
    kategori: string
  }> = [
    {
      kode: GolonganTarif.GOL_1A,
      kodeAsli: '1A',
      nama: 'SOS.UMUM/CORSEN,R.IBADAH',
      kategori: 'Sosial',
    },
    {
      kode: GolonganTarif.GOL_1B,
      kodeAsli: '1B',
      nama: 'SOSIAL KHUSUS',
      kategori: 'Sosial',
    },
    {
      kode: GolonganTarif.GOL_2A1,
      kodeAsli: '2A1',
      nama: 'RMH.TANGGA GOL.A1',
      kategori: 'Rumah Tangga',
    },
    {
      kode: GolonganTarif.GOL_2A2,
      kodeAsli: '2A2',
      nama: 'RMH.TANGGA GOL.A2',
      kategori: 'Rumah Tangga',
    },
    {
      kode: GolonganTarif.GOL_2A3,
      kodeAsli: '2A3',
      nama: 'RMH.TANGGA GOL.A3',
      kategori: 'Rumah Tangga',
    },
    {
      kode: GolonganTarif.GOL_2A4,
      kodeAsli: '2A4',
      nama: 'RMH.TANGGA GOL.A4',
      kategori: 'Rumah Tangga',
    },
    {
      kode: GolonganTarif.GOL_2A5,
      kodeAsli: '2A5',
      nama: 'RMH.TANGGA GOL.A5',
      kategori: 'Rumah Tangga',
    },
    {
      kode: GolonganTarif.GOL_2B,
      kodeAsli: '2B',
      nama: 'INSTANSI PEMERINTAH',
      kategori: 'Pemerintah',
    },
    {
      kode: GolonganTarif.GOL_3A,
      kodeAsli: '3A',
      nama: 'NIAGA KECIL',
      kategori: 'Niaga',
    },
    {
      kode: GolonganTarif.GOL_3B,
      kodeAsli: '3B',
      nama: 'NIAGA MENENGAH/BESAR',
      kategori: 'Niaga',
    },
    {
      kode: GolonganTarif.GOL_3C,
      kodeAsli: '3C',
      nama: 'NIAGA',
      kategori: 'Niaga',
    },
    {
      kode: GolonganTarif.GOL_4A,
      kodeAsli: '4A',
      nama: 'INDUSTRI KECIL',
      kategori: 'Industri',
    },
    {
      kode: GolonganTarif.GOL_4B,
      kodeAsli: '4B',
      nama: 'IND.MNGH/BESAR/PERK.',
      kategori: 'Industri',
    },
  ]

  for (const d of tarifData) {
    await prisma.tarifGolongan.upsert({
      where: { kode: d.kode },
      update: { kodeAsli: d.kodeAsli, nama: d.nama, kategori: d.kategori },
      create: d,
    })
  }
  log('01-REFERENSI', `TarifGolongan: ${tarifData.length} records`)

  // ── 8. Pencatat ────────────────────────────────────────────────────────────
  const pencatatData = [
    { namaLapangan: 'IWAN', namaLengkap: null },
    { namaLapangan: 'DADANG', namaLengkap: null },
    { namaLapangan: 'DIDIN', namaLengkap: null },
    { namaLapangan: 'OMAY', namaLengkap: null },
    { namaLapangan: 'AGUS', namaLengkap: null },
    { namaLapangan: 'PERIYADI', namaLengkap: null },
    { namaLapangan: 'RUDY', namaLengkap: null },
    { namaLapangan: 'EDI', namaLengkap: null },
    { namaLapangan: 'DANI', namaLengkap: null },
  ]

  for (const d of pencatatData) {
    await prisma.pencatat.upsert({
      where: { namaLapangan: d.namaLapangan },
      update: {},
      create: d,
    })
  }
  log('01-REFERENSI', `Pencatat: ${pencatatData.length} records`)

  // ── 9. Konfigurasi Sistem ──────────────────────────────────────────────────
  const konfig = [
    {
      kunci: 'TARIF_BEBAN',
      nilai: '7000',
      tipe: 'number',
      deskripsi: 'Biaya beban/abonemen tetap per bulan (Rp)',
    },
    {
      kunci: 'TARIF_ADMIN',
      nilai: '10000',
      tipe: 'number',
      deskripsi: 'Biaya administrasi per bulan (Rp)',
    },
    {
      kunci: 'TARIF_AIR_KOTOR',
      nilai: '11100',
      tipe: 'number',
      deskripsi: 'Biaya air limbah per bulan (Rp)',
    },
    {
      kunci: 'HARI_JATUH_TEMPO',
      nilai: '20',
      tipe: 'number',
      deskripsi: 'Hari setelah tanggal faktur untuk jatuh tempo',
    },
    {
      kunci: 'DENDA_PERSEN',
      nilai: '2',
      tipe: 'number',
      deskripsi: 'Persentase denda keterlambatan per bulan (%)',
    },
    {
      kunci: 'AMBANG_ANOMALI_PERSEN',
      nilai: '50',
      tipe: 'number',
      deskripsi: 'Threshold penyimpangan pemakaian untuk flagging anomali (%)',
    },
    {
      kunci: 'BATCH_SIZE_IMPORT',
      nilai: '500',
      tipe: 'number',
      deskripsi: 'Jumlah baris per batch saat import CSV',
    },
  ]

  for (const d of konfig) {
    await prisma.konfigurasi.upsert({
      where: { kunci: d.kunci },
      update: { nilai: d.nilai, deskripsi: d.deskripsi },
      create: d,
    })
  }
  log('01-REFERENSI', `Konfigurasi: ${konfig.length} records`)

  log('01-REFERENSI', '✓ Selesai')
}
