// prisma/seed/inspect.ts
// Jalankan: npx tsx prisma/seed/inspect.ts

import { prisma } from "./client";
import { readCsv, normalizeNolg } from "./utils";

async function main() {
  console.log("============================================================");
  console.log(" TIRTACATER — INSPEKSI DATA");
  console.log("============================================================\n");

  // ── 1. Jumlah keseluruhan per tabel ────────────────────────────────────────
  console.log("📊 JUMLAH DATA PER TABEL");
  console.log("─".repeat(40));

  const counts = await Promise.all([
    prisma.wilayahAdm.count(),
    prisma.wilayahDist.count(),
    prisma.seksiCater.count(),
    prisma.wilayahSeksi.count(),
    prisma.zona.count(),
    prisma.rute.count(),
    prisma.kecamatan.count(),
    prisma.kelurahan.count(),
    prisma.tarifGolongan.count(),
    prisma.pencatat.count(),
    prisma.konfigurasi.count(),
    prisma.pelanggan.count(),
    prisma.meter.count(),
    prisma.pembacaanMeter.count(),
    prisma.tagihan.count(),
    prisma.laporanHarianPetugas.count(),
  ]);

  const tables = [
    "WilayahAdm", "WilayahDist", "SeksiCater", "WilayahSeksi",
    "Zona", "Rute", "Kecamatan", "Kelurahan",
    "TarifGolongan", "Pencatat", "Konfigurasi",
    "Pelanggan", "Meter", "PembacaanMeter", "Tagihan",
    "LaporanHarianPetugas",
  ];

  tables.forEach((t, i) => {
    console.log(`  ${t.padEnd(22)} : ${counts[i].toLocaleString("id-ID")} records`);
  });

  // ── 2. Analisis skip 272 di lapdatameter ───────────────────────────────────
  console.log("\n\n🔍 ANALISIS SKIP 272 — LAPDATAMETER");
  console.log("─".repeat(40));

  const csvPath = "./data/lapdatametertes.csv";
  const rows = readCsv(csvPath);

  let skipKosong   = 0;
  let skipPeriode  = 0;
  const skipDetail: Array<{ baris: number; nolg: string; periode: string; alasan: string }> = [];

  rows.forEach((row, idx) => {
    const nolg    = normalizeNolg(row["No Pel"]);
    const periode = row["Periode"]?.trim();

    if (!nolg || nolg === "00000000000") {
      skipKosong++;
      if (skipDetail.length < 10) {
        skipDetail.push({ baris: idx + 2, nolg: row["No Pel"] ?? "(kosong)", periode: periode ?? "", alasan: "nolg kosong / 00000000000" });
      }
    } else if (!periode || isNaN(parseInt(periode))) {
      skipPeriode++;
      if (skipDetail.length < 10) {
        skipDetail.push({ baris: idx + 2, nolg, periode: periode ?? "(kosong)", alasan: "periode tidak valid" });
      }
    }
  });

  console.log(`  Total skip    : 272`);
  console.log(`  nolg kosong   : ${skipKosong}`);
  console.log(`  periode invalid: ${skipPeriode}`);

  if (skipDetail.length > 0) {
    console.log("\n  Contoh baris yang di-skip (maks 10):");
    console.log(`  ${"Baris".padEnd(7)} ${"No Pel".padEnd(14)} ${"Periode".padEnd(10)} Alasan`);
    console.log("  " + "─".repeat(60));
    skipDetail.forEach(d => {
      console.log(`  ${String(d.baris).padEnd(7)} ${d.nolg.padEnd(14)} ${d.periode.padEnd(10)} ${d.alasan}`);
    });
  }

  // ── 3. Cek pelanggan di lapdatameter yang tidak ada di DB ─────────────────
  console.log("\n\n🔗 CEK REFERENSI INTEGRITY — LAPDATAMETER");
  console.log("─".repeat(40));

  const nolgDiDB = new Set(
    (await prisma.pelanggan.findMany({ select: { nomorLangganan: true } }))
      .map(p => p.nomorLangganan)
  );

  const nolgTidakAdaDiDB = new Set<string>();
  rows.forEach(row => {
    const nolg = normalizeNolg(row["No Pel"]);
    if (nolg && nolg !== "00000000000" && !nolgDiDB.has(nolg)) {
      nolgTidakAdaDiDB.add(nolg);
    }
  });

  console.log(`  Pelanggan di lapdatameter tapi tidak ada di DB: ${nolgTidakAdaDiDB.size}`);
  if (nolgTidakAdaDiDB.size > 0 && nolgTidakAdaDiDB.size <= 30) {
    console.log(`  Daftar: ${[...nolgTidakAdaDiDB].join(", ")}`);
  } else if (nolgTidakAdaDiDB.size > 30) {
    console.log(`  Contoh 10 pertama: ${[...nolgTidakAdaDiDB].slice(0, 10).join(", ")}`);
  }

  console.log("\n============================================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());