# Seed Script — tirtacater

Import data CSV lapangan ke database PostgreSQL.

## Struktur File

```
seed/
  index.ts          ← Entry point utama
  01-referensi.ts   ← Wilayah, Tarif, Pencatat, Konfigurasi
  02-progrescater.ts← Pelanggan, Meter, PembacaanMeter, Tagihan
  03-lapdatameter.ts← LaporanHarianPetugas
  04-pbpk.ts        ← MutasiPelanggan (Pasang Baru & Ubah Kontrak)
  05-rnomor.ts      ← Pemutusan (TSM & SPT)
  utils.ts          ← Helper: parseDate, normalizeNolg, mapKondisi, dst.
```

## Setup Awal

### 1. Install dependencies

```bash
pnpm add -D tsx
```

`tsx` diperlukan untuk menjalankan TypeScript langsung tanpa compile.

### 2. Letakkan file CSV

```
data/
  ProgresCater-PW5.csv
  lapdatametertes.csv
  PBPK202605-PW5.csv
  r-nomor.csv
```

### 3. Pastikan database sudah di-migrate

```bash
npx prisma migrate deploy
# atau untuk development:
npx prisma migrate dev
```

---

## Cara Menjalankan

### Import semua sekaligus (urutan otomatis)

```bash
npx tsx seed/index.ts
```

### Import fase tertentu saja

```bash
# Jalankan SEMUA fase sekaligus
npx tsx prisma/seed/index.ts

# ── Per fase ────────────────────────────────────────────────────

# Fase 01 — Referensi (wilayah, tarif, pencatat, konfigurasi)
# Aman diulang kapan saja (semua upsert)
SEED_PHASE=01 npx tsx prisma/seed/index.ts

# Fase 02 — ProgresCater (~22.523 baris, ~50 menit)
# Master pelanggan, meter, pembacaan, tagihan
SEED_PHASE=02 npx tsx prisma/seed/index.ts

# Fase 03 — Lapdatameter (laporan harian petugas)
# Aman diulang — sudah ada → update, belum ada → insert
SEED_PHASE=03 npx tsx prisma/seed/index.ts

# Fase 04 — PBPK (pasang baru & perubahan kontrak)
# PB → upsert pelanggan + meter baru
# PK → update pelanggan yang sudah ada
SEED_PHASE=04 npx tsx prisma/seed/index.ts

# Fase 05 — R-Nomor (riwayat pemutusan TSM & SPT)
# 19 nolg tidak ditemukan → normal, tetap dilanjutkan
SEED_PHASE=05 npx tsx prisma/seed/index.ts

# ── Mulai dari fase tertentu (misal terputus di 03) ─────────────
# Tidak ada flag bawaan, jalankan satu per satu mulai dari yang terputus:
SEED_PHASE=03 npx tsx prisma/seed/index.ts
SEED_PHASE=04 npx tsx prisma/seed/index.ts
SEED_PHASE=05 npx tsx prisma/seed/index.ts

---

## Urutan Fase & Alasan

| Fase | File | Keterangan |
|------|------|-----------|
| 01   | Hardcoded | Wilayah, tarif, 9 pencatat aktif, konfigurasi sistem |
| 02   | ProgresCater | **Master pelanggan** — harus jalan sebelum fase lain |
| 03   | lapdatameter | Laporan harian — pelanggan sudah ada dari fase 02 |
| 04   | PBPK | Pelanggan baru (PB) atau update kontrak (PK) |
| 05   | r-nomor | Pemutusan — update status pelanggan yang ada |

> **Penting:** Fase 03–05 bergantung pada fase 02. Jangan skip fase 02 saat pertama kali import.

---

## Keamanan dari Duplikat

Setiap fase dirancang idempotent — aman dijalankan berulang kali:

| Model | Constraint | Perilaku saat re-run |
|-------|-----------|---------------------|
| Pelanggan | `@@unique([nomorLangganan])` | `upsert` — update data terbaru |
| Meter | `findFirst({isAktif: true})` | Update jika sama, buat baru + nonaktifkan lama jika beda |
| PembacaanMeter | `@@unique([meterId, periode])` | `upsert` — update jika ada revisi |
| Tagihan | `@@unique([pembacaanId])` | `upsert` — update komponen biaya |
| LaporanHarianPetugas | `@@unique([nomorLangganan, periode])` | Update jika ada koreksi upload |
| MutasiPelanggan | `findFirst` sebelum `create` | Skip jika sudah ada |
| Pemutusan | `findFirst` sebelum `create` | Skip jika sudah ada |
| Wilayah/Tarif/Pencatat | `@@unique([kode/namaLapangan])` | `upsert` — tidak berubah |

---

## Troubleshooting

### Error: "Foreign key constraint failed"
Pastikan fase 01 sudah jalan sebelum fase 02. Semua wilayah dan tarif harus ada dulu.

### Error: "Unique constraint failed on Meter"
Ada dua meter aktif untuk satu pelanggan. Jalankan query ini untuk identifikasi:
```sql
SELECT "pelangganId", COUNT(*) 
FROM "Meter" 
WHERE "isAktif" = true 
GROUP BY "pelangganId" 
HAVING COUNT(*) > 1;
```

### Warning: "Pelanggan tidak ditemukan" di fase 05
Normal — 19 pelanggan di r-nomor sudah dicabut sebelum closing ProgresCater.
Data Pemutusan tidak diinsert untuk kasus ini (tidak ada FK yang bisa dirujuk).

### Fase 02 lambat?
Normal — 22.523 baris dengan ~5 query per baris = ~112.000 query.
Estimasi waktu: 3–8 menit tergantung spesifikasi server DB.
Untuk mempercepat, naikkan `BATCH_SIZE` di Konfigurasi (default 500).