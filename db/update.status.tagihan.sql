-- 1. Set SUDAH_BAYAR jika rekening tunggakan = 0
UPDATE "Tagihan"
SET status = 'SUDAH_BAYAR'
WHERE COALESCE("jumlahRekTunggak", 0) = 0;

-- 2. Set BELUM_BAYAR jika rekening tunggakan = 1 (Tagihan aktif bulan ini)
UPDATE "Tagihan"
SET status = 'BELUM_BAYAR'
WHERE "jumlahRekTunggak" = 1;

-- 3. Set JATUH_TEMPO jika rekening tunggakan > 1 (Mulai menunggak)
UPDATE "Tagihan"
SET status = 'JATUH_TEMPO'
WHERE "jumlahRekTunggak" > 1;