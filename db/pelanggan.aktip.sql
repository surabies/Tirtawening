SELECT 
  status, 
  COUNT(*) AS jumlah_pelanggan
FROM "Pelanggan"
WHERE "deletedAt" IS NULL
GROUP BY status
ORDER BY jumlah_pelanggan DESC;

-- memisahkan Aktif vs Tidak Aktif secara langsung

SELECT 
  CASE 
    WHEN status = 'AKTIF' THEN 'AKTIF'
    ELSE 'TIDAK_AKTIF'
  END AS status_kategori,
  COUNT(*) AS jumlah_pelanggan
FROM "Pelanggan"
WHERE "deletedAt" IS NULL
GROUP BY 
  CASE 
    WHEN status = 'AKTIF' THEN 'AKTIF'
    ELSE 'TIDAK_AKTIF'
  END;

  -- Jalankan query ini di Neon SQL Editor untuk menampilkan daftar 106 pelanggan yang tidak aktif tersebut:

  SELECT 
  "nomorLangganan", 
  nama, 
  alamat, 
  status
FROM "Pelanggan"
WHERE "deletedAt" IS NULL 
  AND status != 'AKTIF';

  -- menghitung jumlah data keseluruhan semua di tabel pelanggan , yang aktip hasil akhir dari penggabungan periode misalnya

  SELECT COUNT(*) AS total_pelanggan_aktif
FROM "Pelanggan"
WHERE "deletedAt" IS NULL 
  AND status = 'AKTIF';