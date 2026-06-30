SELECT 
  periode, 
  COUNT(DISTINCT "nomorLangganan") AS jumlah_pelanggan,
  COUNT(*) AS jumlah_total_data
FROM "LaporanHarianPetugas"
GROUP BY periode
ORDER BY periode DESC;

-- periode dan pelanggan

SELECT 
    periode, 
    COUNT(DISTINCT "nomorLangganan")::int AS jumlah_pelanggan
FROM "LaporanHarianPetugas"
GROUP BY periode
ORDER BY periode DESC;

-- melihat data bergeser

SELECT * FROM "LaporanHarianPetugas" 
WHERE periode < 200000;