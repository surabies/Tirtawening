# Prisma Schema — tirtacater / mytirta

Schema ini dipecah per-domain (multi-file Prisma schema, GA sejak Prisma ORM ≥6.7,
dipakai di sini dengan **Prisma v7**). `schema.prisma` di folder ini hanya berisi
`generator` + `datasource` — wajib ada di folder schema saat multi-file dipakai.

## Peta file → domain

| File | Isi |
|---|---|
| `schema.prisma` | root — generator + datasource saja |
| `wilayah.prisma` | Hierarki PDAM: WilayahAdm → WilayahDist → SeksiCater → Rute / WilayahSeksi → Zona |
| `wilayah-pemerintahan.prisma` | Kecamatan, Kelurahan |
| `auth.prisma` | Role, UserStatus, User + boilerplate Auth.js (Account, Session, VerificationToken, Authenticator) |
| `organisasi.prisma` | KodeDivisi, Divisi → Bagian → SubBagian |
| `pencatat.prisma` | Pencatat (jembatan nama lapangan ↔ akun User) |
| `tarif.prisma` | GolonganTarif, TarifGolongan, TarifBlok |
| `pelanggan.prisma` | StatusPelanggan, Pelanggan |
| `potensi-pelanggan.prisma` | StatusPotensi, PotensiPelanggan |
| `meter.prisma` | UkuranMeter, Meter |
| `pembacaan.prisma` | KondisiCatat, KategoriPembacaan, StatusLaporanMandiri, LaporanHarianPetugas, PembacaanMeter, LaporanMandiri |
| `tagihan.prisma` | StatusTagihan, Tagihan |
| `mutasi.prisma` | JenisMutasi, MutasiPelanggan (PBPK) |
| `pemutusan.prisma` | JenisPemutusan, Pemutusan (r-nomor) |
| `kinerja.prisma` | TargetKinerja |
| `audit.prisma` | AuditLog |
| `konfigurasi.prisma` | Konfigurasi (key-value operasional) |

## Sumber data lapangan

- `ProgresCater-PW5.csv` (22.523 baris — closing bulanan)
- `lapdatametertes.csv` (22.553 baris — laporan harian petugas)
- `PBPK202605-PW5.csv` (11 baris — pasang baru & ubah kontrak)
- `r-nomor.csv` (19 baris — riwayat pemutusan TSM/SPT)
- `Area_layanan_Wilayah_5.geojson` (32 baris — batas Kelurahan/Kecamatan PW5)
- `Data_progres_verifikasi_pelanggan_PW_5_2026.geojson` (1.875 baris — hasil survei lapangan mWater)

## Temuan kritis — analisis relasi antar CSV

- 30 orphan `lapdatameter` = 19 DICABUT + 11 PBPK baru → **NORMAL**
- 681 `nomorMeter` duplikat → ditangani via `Meter.isAktif` (histori tetap ada)
- 116 `nprs` duplikat (satu lokasi, beda pelanggan) → karena itu **bukan** `@unique`
- 19 `r-nomor` tidak ada di `ProgresCater` → dicabut sebelum closing → **NORMAL**
- `kd_petugas` di CSV adalah nama panggilan ("IWAN", "DADANG", "-") → model `Pencatat`
  dipakai sebagai jembatan ke `User`

## Temuan kritis — analisis geojson survei (PW5 2026)

- 3 dari 32 Kelurahan punya geometri `MultiPolygon` sungguhan (PASIR KALIKI, TURANGGA,
  KARASAK punya 2–4 bagian terpisah) → kolom `area` **wajib** `MultiPolygon`, bukan
  `Polygon`, atau insert akan gagal/data hilang.
- 219 titik "Eks Pelanggan" di survei adalah histori cabut lama (rentang 1994–2025);
  banyak `nolg`-nya **tidak ada** di tabel `Pelanggan` (di luar jendela data CSV utama)
  → `Pemutusan.pelangganId` dibuat optional, pola sama seperti
  `LaporanHarianPetugas.nomorLangganan`.
- Field "Nomor Eks Pelanggan" sering berisi >1 nomor / catatan dalam kurung / nama
  enumerator (bukan nomor) → diparse defensif, teks asli tetap disimpan untuk audit
  (`Pemutusan.catatanSurveiAsli`).

## Catatan perbaikan saat modularisasi

- Banner section di atas model `TargetKinerja` pada `schema.prisma` lama tertulis
  salah copy-paste ("PEMUTUSAN LAYANAN — r-nomor"). Sudah diperbaiki jadi
  "TARGET KINERJA" di `kinerja.prisma`. Tidak ada perubahan pada field, tipe,
  relasi, atau index — murni perbaikan komentar.
