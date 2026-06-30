Query untuk Melihat Data Sesuai Logika Siklus PDAM

SELECT 
  id,
  "pelangganId",
  "totalTagihan",
  "jumlahRekTunggak",
  "nominalTunggak",
  status AS status_db_sekarang,
  CASE 
    WHEN COALESCE("jumlahRekTunggak", 0) = 0 THEN 'SUDAH_BAYAR (Lunas)'
    WHEN "jumlahRekTunggak" = 1 THEN 'BELUM_BAYAR (Tagihan Berjalan)'
    ELSE 'JATUH_TEMPO (Menunggak > 1 Bulan)'
  END AS status_asli_lapangan
FROM "Tagihan"
ORDER BY "jumlahRekTunggak" DESC;