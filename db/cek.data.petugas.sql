SELECT 
  "pencatatId",
  -- Total pencatatan riil bulan MARET (Bulan Berjalan yang sudah matang)
  COUNT(DISTINCT "nomorLangganan") FILTER (WHERE periode = 202603 AND "tanggalCatat" IS NOT NULL) AS riil_maret,
  -- Total pencatatan riil bulan FEBRUARI (Target acuan)
  COUNT(DISTINCT "nomorLangganan") FILTER (WHERE periode = 202602) AS target_februari,
  -- Selisih murni antar bulan yang sudah final
  (COUNT(DISTINCT "nomorLangganan") FILTER (WHERE periode = 202602) - 
   COUNT(DISTINCT "nomorLangganan") FILTER (WHERE periode = 202603 AND "tanggalCatat" IS NOT NULL)) AS selisih_murni
FROM "LaporanHarianPetugas"
WHERE "pencatatId" IS NOT NULL
GROUP BY "pencatatId";

-- Jalankan script di bawah, dan mari kita lihat apakah baris data Februari untuk Dani dan Didin memang zonk!
SELECT 
  "pencatatId",
  COUNT(*) AS total_baris_data,
  COUNT(DISTINCT "nomorLangganan") AS total_sl_unik,
  COUNT(*) FILTER (WHERE "tanggalCatat" IS NULL) AS jumlah_tanggal_null,
  COUNT(*) FILTER (WHERE "tanggalCatat" IS NOT NULL) AS jumlah_tanggal_terisi
FROM "LaporanHarianPetugas"
WHERE periode = 202602 -- masukan periode
GROUP BY "pencatatId"
ORDER BY total_sl_unik ASC;

-- cek pelanggan yang masih aktip dibulan berjalan

SELECT 
  "pencatatId",
  COUNT(DISTINCT "nomorLangganan") AS total_pelanggan_unik_berdasarkan_rute
FROM "LaporanHarianPetugas"
WHERE periode = 202603
  AND "pencatatId" IN ('cmqwbiele001il53cm1gsywak', 'cmqwbie3k001cl53cl7i7idn6')
GROUP BY "pencatatId";