// seed/04-pbpk.ts
// Fase 4: Import PBPK — Pasang Baru (PB) & Perubahan Kontrak (PK)
//
// Alur:
//   PB → buat Pelanggan baru + Meter baru + MutasiPelanggan
//   PK → update Pelanggan yang ada + MutasiPelanggan
//        jika Pelanggan belum ada di DB (pelanggan lama pasang kembali)
//        → buat Pelanggan baru + Meter baru + MutasiPelanggan PK
//
// Field tglaktif = Excel date serial float → dikonversi via excelDateToJs()
// kode_wilayah "KC30401" → rute "KC304", noUrut 1

import { prisma } from "./client"
import { JenisMutasi } from "@/generated/prisma/client"
import {
  readCsv,
  log,
  normalizeNolg,
  normalizeNotelp,
  normalizeMerk,
  mapTarif,
  mapUkuranMeter,
  excelDateToJs,
} from "./utils"

/**
 * Decode kode_wilayah: "KC30401" → { ruteKode: "KC304", noUrut: 1 }
 */
function decodeKodeWilayah(
  raw: string
): { ruteKode: string; noUrut: number } | null {
  if (!raw || raw.length < 3) return null
  const noUrut = parseInt(raw.slice(-2))
  const ruteKode = raw.slice(0, -2)
  if (isNaN(noUrut) || !ruteKode) return null
  return { ruteKode, noUrut }
}

export async function seedPBPK(csvPath: string) {
  log("04-PBPK", `Baca file: ${csvPath}`)
  const rows = readCsv(csvPath)
  log("04-PBPK", `Total baris: ${rows.length}`)

  const allRute = await prisma.rute.findMany()
  const allKec = await prisma.kecamatan.findMany()
  const allKel = await prisma.kelurahan.findMany()
  const allTarif = await prisma.tarifGolongan.findMany()

  const cacheRute = new Map(allRute.map((r) => [r.kode, r.id]))
  const cacheKec = new Map(allKec.map((r) => [r.kode, r.id]))
  const cacheKel = new Map(allKel.map((r) => [r.kode, r.id]))
  const cacheTarif = new Map(allTarif.map((r) => [r.kodeAsli, r.id]))

  let stats = { pb: 0, pk: 0, pkBaru: 0, skip: 0 }

  for (const row of rows) {
    const nolg = normalizeNolg(row["nolg"] || row["nolangganan"])
    if (!nolg || nolg === "00000000000") {
      stats.skip++
      continue
    }

    const jenis = (row["mutasian"]?.trim().toUpperCase() as "PB" | "PK") ?? "PB"
    const periode = 202605
    const nometer = row["nometer"]?.trim()
    const tarifKode = row["kd_goltarif"]?.trim()
    const tarifId = cacheTarif.get(tarifKode ?? "") ?? null
    const kecId = cacheKec.get(row["kd_kecamatan"]?.trim() ?? "") ?? null
    const kelId = cacheKel.get(row["kd_kelurahan"]?.trim() ?? "") ?? null
    const notelp = normalizeNotelp(row["notelp"])
    const tanggalAktif = excelDateToJs(row["tglaktif"])

    const decoded = decodeKodeWilayah(row["kode_wilayah"]?.trim() ?? "")
    const ruteKode = decoded?.ruteKode ?? row["kd_rute"]?.trim()
    const noUrut = decoded?.noUrut ?? null

    let ruteId: string | null = null
    if (ruteKode) {
      if (!cacheRute.has(ruteKode)) {
        const seksi = await prisma.seksiCater.findFirst({
          where: { kode: "C5" },
        })
        if (seksi) {
          const rute = await prisma.rute.upsert({
            where: { kode: ruteKode },
            update: { noUrut },
            create: { kode: ruteKode, noUrut, seksiCaterId: seksi.id },
          })
          cacheRute.set(ruteKode, rute.id)
          ruteId = rute.id
        }
      } else {
        ruteId = cacheRute.get(ruteKode) ?? null
      }
    }

    const rt = row["rt"] ? String(row["rt"]).padStart(3, "0") : null
    const rw = row["rw"] ? String(row["rw"]).padStart(3, "0") : null

    const geoLong =
      row["geo_long"] && parseFloat(row["geo_long"]) < 200
        ? parseFloat(row["geo_long"])
        : null
    const geoLat =
      row["goe_lat"] && parseFloat(row["goe_lat"]) < 200
        ? parseFloat(row["goe_lat"])
        : null

    if (jenis === "PB") {
      // ── Pasang Baru ───────────────────────────────────────────────────
      const pelanggan = await prisma.pelanggan.upsert({
        where: { nomorLangganan: nolg },
        update: {
          nama: row["nama"]?.trim(),
          alamat: row["alamat"]?.trim(),
          rt,
          rw,
          notelp,
          geoLat,
          geoLong,
          jumlahPenghuni: row["jmlpenghuni"]
            ? parseInt(row["jmlpenghuni"])
            : null,
          tarifGolonganId: tarifId,
          kecamatanId: kecId,
          kelurahanId: kelId,
          ruteId,
        },
        create: {
          nomorLangganan: nolg,
          nomorPersil: nolg,
          nama: row["nama"]?.trim() ?? "",
          alamat: row["alamat"]?.trim() ?? "",
          rt,
          rw,
          notelp,
          geoLat,
          geoLong,
          jumlahPenghuni: row["jmlpenghuni"]
            ? parseInt(row["jmlpenghuni"])
            : null,
          tarifGolonganId: tarifId,
          kecamatanId: kecId,
          kelurahanId: kelId,
          ruteId,
        },
      })

      if (nometer) {
        const existingAktif = await prisma.meter.findFirst({
          where: { pelangganId: pelanggan.id, isAktif: true },
        })
        if (!existingAktif) {
          await prisma.meter.create({
            data: {
              nomorMeter: nometer,
              merkKode: normalizeMerk(row["kd_merkmeter"]),
              ukuran: mapUkuranMeter(row["kd_ukmeter"]),
              tanggalPasang: tanggalAktif,
              isAktif: true,
              pelangganId: pelanggan.id,
            },
          })
        }
      }
      stats.pb++

      const existingMutasi = await prisma.mutasiPelanggan.findFirst({
        where: { pelangganId: pelanggan.id, jenis: JenisMutasi.PB, periode },
      })
      if (!existingMutasi) {
        await prisma.mutasiPelanggan.create({
          data: {
            pelangganId: pelanggan.id,
            jenis: JenisMutasi.PB,
            periode,
            nomorMeterBaru: nometer ?? null,
            merkMeterBaru: normalizeMerk(row["kd_merkmeter"]),
            ukuranMeterBaru: mapUkuranMeter(row["kd_ukmeter"]),
            tarifBaru: mapTarif(tarifKode),
            ruteBaru: ruteKode ?? null,
            kodeWilayahBaru: row["kode_wilayah"]?.trim() ?? null,
            noUrut,
            jumlahPenghuni: row["jmlpenghuni"]
              ? parseInt(row["jmlpenghuni"])
              : null,
            tanggalAktif,
            statusAktif: row["sta_aktif"] ? parseInt(row["sta_aktif"]) : null,
            updaterKode: row["updater"]?.trim() ?? null,
          },
        })
      }
    } else if (jenis === "PK") {
      // ── Perubahan Kontrak ─────────────────────────────────────────────
      let pelanggan = await prisma.pelanggan.findUnique({
        where: { nomorLangganan: nolg },
      })

      if (!pelanggan) {
        // Pelanggan lama pasang kembali — tidak ada di DB periode ini
        // Buat sebagai pelanggan baru dengan mutasi PK
        log(
          "04-PBPK",
          `ℹ PK: pelanggan ${nolg} (${row["nama"]?.trim()}) tidak ada di DB → buat baru`
        )
        pelanggan = await prisma.pelanggan.create({
          data: {
            nomorLangganan: nolg,
            nomorPersil: nolg,
            nama: row["nama"]?.trim() ?? "",
            alamat: row["alamat"]?.trim() ?? "",
            rt,
            rw,
            notelp,
            geoLat,
            geoLong,
            jumlahPenghuni: row["jmlpenghuni"]
              ? parseInt(row["jmlpenghuni"])
              : null,
            tarifGolonganId: tarifId,
            kecamatanId: kecId,
            kelurahanId: kelId,
            ruteId,
          },
        })

        if (nometer) {
          await prisma.meter.create({
            data: {
              nomorMeter: nometer,
              merkKode: normalizeMerk(row["kd_merkmeter"]),
              ukuran: mapUkuranMeter(row["kd_ukmeter"]),
              tanggalPasang: tanggalAktif,
              isAktif: true,
              pelangganId: pelanggan.id,
            },
          })
        }
        stats.pkBaru++
      } else {
        // Pelanggan sudah ada — update data
        await prisma.pelanggan.update({
          where: { id: pelanggan.id },
          data: {
            tarifGolonganId: tarifId ?? undefined,
            ruteId: ruteId ?? undefined,
            notelp: notelp ?? undefined,
            jumlahPenghuni: row["jmlpenghuni"]
              ? parseInt(row["jmlpenghuni"])
              : undefined,
          },
        })

        if (nometer) {
          const aktif = await prisma.meter.findFirst({
            where: { pelangganId: pelanggan.id, isAktif: true },
          })
          if (aktif && aktif.nomorMeter !== nometer) {
            await prisma.meter.update({
              where: { id: aktif.id },
              data: { isAktif: false },
            })
            await prisma.meter.create({
              data: {
                nomorMeter: nometer,
                merkKode: normalizeMerk(row["kd_merkmeter"]),
                ukuran: mapUkuranMeter(row["kd_ukmeter"]),
                tanggalPasang: tanggalAktif,
                isAktif: true,
                pelangganId: pelanggan.id,
              },
            })
          }
        }
        stats.pk++
      }

      // Insert MutasiPelanggan PK — untuk kedua kasus (baru maupun update)
      const existingMutasi = await prisma.mutasiPelanggan.findFirst({
        where: { pelangganId: pelanggan.id, jenis: JenisMutasi.PK, periode },
      })
      if (!existingMutasi) {
        await prisma.mutasiPelanggan.create({
          data: {
            pelangganId: pelanggan.id,
            jenis: JenisMutasi.PK,
            periode,
            nomorMeterBaru: nometer ?? null,
            merkMeterBaru: normalizeMerk(row["kd_merkmeter"]),
            ukuranMeterBaru: mapUkuranMeter(row["kd_ukmeter"]),
            tarifBaru: mapTarif(tarifKode),
            ruteBaru: ruteKode ?? null,
            kodeWilayahBaru: row["kode_wilayah"]?.trim() ?? null,
            noUrut,
            jumlahPenghuni: row["jmlpenghuni"]
              ? parseInt(row["jmlpenghuni"])
              : null,
            tanggalAktif,
            statusAktif: row["sta_aktif"] ? parseInt(row["sta_aktif"]) : null,
            updaterKode: row["updater"]?.trim() ?? null,
          },
        })
      }
    }
  }

  log(
    "04-PBPK",
    `✓ PB: ${stats.pb}, PK update: ${stats.pk}, PK baru: ${stats.pkBaru}, Skip: ${stats.skip}`
  )
}
