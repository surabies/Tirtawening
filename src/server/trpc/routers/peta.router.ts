import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { db } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'

/**
 * Ambil jumlah pelanggan untuk satu nilai StatusPelanggan dari hasil
 * `groupBy`. Mengembalikan 0 jika status tersebut tidak punya baris sama
 * sekali (groupBy tidak mengembalikan baris dengan count 0).
 */
function getCountByStatus(
  groups: { status: string; _count: { _all: number } }[],
  status: string,
) {
  return groups.find((g) => g.status === status)?._count._all ?? 0
}

/**
 * Sama seperti getCountByStatus, tapi untuk hasil groupBy yang dikelompokkan
 * berdasarkan kolom `jenis` (dipakai untuk JenisPemutusan: TSM/SPT/LAINNYA).
 */
function getCountByJenis(
  groups: { jenis: string; _count: { _all: number } }[],
  jenis: string,
) {
  return groups.find((g) => g.jenis === jenis)?._count._all ?? 0
}

export const petaRouter = createTRPCRouter({
  // ── List pelanggan untuk marker di peta ───────────────────────────────────
  getPelangganList: protectedProcedure
    .input(
      z.object({
        take: z.number().default(1000),
        skip: z.number().default(0),
        search: z.string().optional(),
        // FIX: filter status agar frontend bisa toggle layer per status
        // (mis. sembunyikan CABUT_PERMANEN/TUTUP_SPT dari layer "aktif" tanpa
        // perlu endpoint terpisah). Tanpa filter ini, endpoint selalu
        // mengembalikan SEMUA status sekaligus — termasuk yang sudah putus.
        status: z
          .array(
            z.enum(['AKTIF', 'TUTUP_SEMENTARA', 'TUTUP_SPT', 'CABUT_PERMANEN']),
          )
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const searchFilter = input.search
        ? Prisma.sql`AND (pel."nomorLangganan" ILIKE ${`%${input.search}%`} OR pel.nama ILIKE ${`%${input.search}%`})`
        : Prisma.empty
      const statusFilter =
        input.status && input.status.length > 0
          ? Prisma.sql`AND pel.status::text = ANY(${input.status}::text[])`
          : Prisma.empty

      // FIX: list + total dijalankan paralel — keduanya independen, tidak
      // perlu menunggu satu sama lain.
      const [pelangganList, total] = await Promise.all([
        db.$queryRaw<
          Array<{
            id: string
            nomorLangganan: string
            nama: string
            alamat: string | null
            status: string
            geoLat: number | null
            geoLong: number | null
          }>
        >(Prisma.sql`
          SELECT
            pel.id,
            pel."nomorLangganan",
            pel.nama,
            pel.alamat,
            pel.status,
            COALESCE(ST_Y(pel."koordinat"), pel."geoLat") AS "geoLat",
            COALESCE(ST_X(pel."koordinat"), pel."geoLong") AS "geoLong"
          FROM "Pelanggan" pel
          WHERE pel."deletedAt" IS NULL
          AND (
            pel.status::text != 'AKTIF' 
            OR NOT EXISTS (SELECT 1 FROM "Pemutusan" pm WHERE pm."pelangganId" = pel.id)
          )
          ${searchFilter}
          ${statusFilter}
          ORDER BY pel."nomorLangganan" ASC
          LIMIT ${input.take} OFFSET ${input.skip}
        `),
        db.pelanggan.count({
          where: {
            deletedAt: null,
            // LOGIKA TAMBAHAN: Sama dengan filter di queryRaw
            NOT: {
              AND: [
                { status: 'AKTIF' },
                { pemutusan: { some: {} } }, // Jika ada record di Pemutusan
              ],
            },
            ...(input.status && input.status.length > 0
              ? { status: { in: input.status } }
              : {}),
            ...(input.search
              ? {
                  OR: [
                    {
                      nomorLangganan: {
                        contains: input.search,
                        mode: 'insensitive',
                      },
                    },
                    { nama: { contains: input.search, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
        }),
      ])

      return {
        data: pelangganList,
        total,
      }
    }),

  // ── Detail satu pelanggan (klik titik di peta) ──────────────────────────
  getPelangganDetail: protectedProcedure
    .input(
      z.object({ id: z.string().min(1, 'ID pelanggan tidak boleh kosong') }),
    )
    .query(async ({ input }) => {
      // FIX PERBAIKAN: Menggunakan findFirst menggantikan findUnique karena klausa 'where'
      // melibatkan kriteria non-unique ('deletedAt: null'). Langkah ini menghindari Prisma
      // melontarkan runtime error yang menyebabkan detail popup data mengembalikan nilai null / '---'.
      const pelanggan = await db.pelanggan.findFirst({
        where: { id: input.id, deletedAt: null },
        select: {
          id: true,
          nomorLangganan: true,
          nama: true,
          alamat: true,
          rt: true,
          rw: true,
          notelp: true,
          jumlahPenghuni: true,
          // geoLat/geoLong TIDAK di-select di sini (kolom legacy yang bisa
          // berisi placeholder Excel date serial). Diganti raw query di
          // bawah yang mengutamakan kolom spasial "koordinat" (PostGIS).
          status: true,
          isMBR: true,
          kodeMBR: true,
          tarifGolongan: { select: { kode: true, nama: true } },
          seksiCater: { select: { id: true, nama: true } },
          // FIX: model Rute tidak punya kolom `nama` — hanya `kode` & `noUrut`.
          rute: { select: { id: true, kode: true, noUrut: true } },
          zona: { select: { id: true, nama: true } },
          kelurahan: { select: { id: true, nama: true } },
          kecamatan: { select: { id: true, nama: true } },
        },
      })

      if (!pelanggan) return null

      // FIX: koordinat akurat harus diturunkan dari kolom spasial PostGIS
      // ("koordinat"), bukan dari geoLat/geoLong legacy yang kerap berisi
      // sampah (~46168.x = placeholder Excel date serial). geoLat/geoLong
      // legacy hanya dipakai sebagai fallback jika "koordinat" masih NULL.
      const [coord] = await db.$queryRaw<
        Array<{ geoLat: number | null; geoLong: number | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(ST_Y("koordinat"), "geoLat") AS "geoLat",
          COALESCE(ST_X("koordinat"), "geoLong") AS "geoLong"
        FROM "Pelanggan"
        WHERE id = ${input.id}
      `)

      return {
        ...pelanggan,
        geoLat: coord?.geoLat ?? null,
        geoLong: coord?.geoLong ?? null,
      }
    }),

  // ── Detail kelurahan + statistik pelanggan ──────────────────────────────
  getKelurahanDetail: protectedProcedure
    .input(
      z.object({ id: z.string().min(1, 'ID kelurahan tidak boleh kosong') }),
    )
    .query(async ({ input }) => {
      const kelurahan = await db.kelurahan.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          kode: true,
          nama: true,
          kecamatan: { select: { id: true, nama: true } },
          _count: {
            select: { pelanggan: { where: { deletedAt: null } } },
          },
        },
      })

      if (!kelurahan) return null

      // Agregasi status pelanggan dalam SATU query (groupBy)
      // FIX: Tambahkan query untuk menghitung Eks Pelanggan (Pemutusan)
      const [
        statusGroups,
        mbr, // FIX 1: Ubah nama menjadi 'mbr' agar langsung klop dengan return di bawah
        potensiGroups,
        pelangganNonAktifIds,
        pemutusanTanpaPelanggan, // FIX 2: Daftarkan variabel ke-5 di sini
      ] = await Promise.all([
        // 1. Group By Status Pelanggan
        db.pelanggan.groupBy({
          by: ['status'],
          where: { kelurahanId: input.id, deletedAt: null },
          _count: { _all: true },
        }),

        // 2. Count Pelanggan MBR
        db.pelanggan.count({
          where: { kelurahanId: input.id, deletedAt: null, isMBR: true },
        }),

        // 3. Group By Status Potensi
        db.potensiPelanggan.groupBy({
          by: ['status'],
          where: { kelurahanId: input.id },
          _count: { _all: true },
        }),

        // 4. Cari ID Pelanggan yang Dinonaktifkan
        db.pemutusan.findMany({
          where: {
            kelurahanId: input.id,
            pelangganId: { not: null },
            pelanggan: { status: { not: 'AKTIF' } },
          },
          select: { pelangganId: true },
          distinct: ['pelangganId'],
        }),

        // 5. FIX 2 (Lanjutan): Tambah query untuk menghitung pemutusan tanpa pelanggan
        db.pemutusan.count({
          where: {
            kelurahanId: input.id,
            pelangganId: null, // Pemutusan yang tidak terikat ke data pelanggan resmi
          },
        }),
      ])
      const aktif = getCountByStatus(statusGroups, 'AKTIF')
      const tutupSementara = getCountByStatus(statusGroups, 'TUTUP_SEMENTARA')
      const tutupSpt = getCountByStatus(statusGroups, 'TUTUP_SPT')
      const cabutPermanen = getCountByStatus(statusGroups, 'CABUT_PERMANEN')
      const nonAktif = kelurahan._count.pelanggan - aktif
      const eksPelanggan = pemutusanTanpaPelanggan + pelangganNonAktifIds.length

      const potensiTotal = potensiGroups.reduce(
        (sum, g) => sum + g._count._all,
        0,
      )
      const potensi = {
        total: potensiTotal,
        prospek: getCountByStatus(potensiGroups, 'PROSPEK'),
        menungguSurvei: getCountByStatus(potensiGroups, 'MENUNGGU_SURVEI'),
        validasi: getCountByStatus(potensiGroups, 'VALIDASI'),
        ditolak: getCountByStatus(potensiGroups, 'DITOLAK'),
      }

      // Menghitung jumlah keseluruhan titik di kelurahan ini
      const keseluruhan =
        kelurahan._count.pelanggan + potensiTotal + eksPelanggan

      // Rute yang ada di kelurahan ini.
      const rutes = await db.rute.findMany({
        where: {
          pelanggan: {
            some: { kelurahanId: input.id, deletedAt: null },
          },
        },
        select: {
          id: true,
          kode: true,
          noUrut: true,
          _count: {
            select: {
              pelanggan: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { kode: 'asc' },
      })

      return {
        ...kelurahan,
        aktif,
        tutupSementara,
        tutupSpt,
        cabutPermanen,
        nonAktif,
        mbr,
        rutes,
        potensi,
        // ── Metrik Tambahan untuk Frontend ──
        potensiPelanggan: potensiTotal,
        eksPelanggan,
        keseluruhan,
      }
    }),

  // ── Detail kecamatan + statistik + list kelurahan ───────────────────────
  getKecamatanDetail: protectedProcedure
    .input(
      z.object({ id: z.string().min(1, 'ID kecamatan tidak boleh kosong') }),
    )
    .query(async ({ input }) => {
      const kecamatan = await db.kecamatan.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          kode: true,
          nama: true,
          _count: { select: { kelurahan: true } },
          kelurahan: {
            select: {
              id: true,
              kode: true,
              nama: true,
              _count: {
                select: { pelanggan: { where: { deletedAt: null } } },
              },
            },
            orderBy: { nama: 'asc' },
          },
        },
      })

      if (!kecamatan) return null

      // PotensiPelanggan tidak punya kolom kecamatanId langsung (hanya
      // kelurahanId & ruteId), jadi diagregasi lewat daftar kelurahanId
      // di bawah kecamatan ini — sudah tersedia dari query di atas.
      const kelurahanIds = kecamatan.kelurahan.map((k) => k.id)

      const [statusGroups, mbr, potensiGroups] = await Promise.all([
        db.pelanggan.groupBy({
          by: ['status'],
          where: { kecamatanId: input.id, deletedAt: null },
          _count: { _all: true },
        }),
        db.pelanggan.count({
          where: { kecamatanId: input.id, deletedAt: null, isMBR: true },
        }),
        db.potensiPelanggan.groupBy({
          by: ['status'],
          where: { kelurahanId: { in: kelurahanIds } },
          _count: { _all: true },
        }),
      ])

      const aktif = getCountByStatus(statusGroups, 'AKTIF')
      const tutupSementara = getCountByStatus(statusGroups, 'TUTUP_SEMENTARA')
      const tutupSpt = getCountByStatus(statusGroups, 'TUTUP_SPT')
      const cabutPermanen = getCountByStatus(statusGroups, 'CABUT_PERMANEN')
      // Total pelanggan diturunkan langsung dari hasil groupBy (sum semua
      // status), jadi tidak perlu query count tambahan untuk totalnya.
      const totalPelanggan = statusGroups.reduce(
        (sum, g) => sum + g._count._all,
        0,
      )
      const nonAktif = totalPelanggan - aktif

      const potensi = {
        total: potensiGroups.reduce((sum, g) => sum + g._count._all, 0),
        prospek: getCountByStatus(potensiGroups, 'PROSPEK'),
        menungguSurvei: getCountByStatus(potensiGroups, 'MENUNGGU_SURVEI'),
        validasi: getCountByStatus(potensiGroups, 'VALIDASI'),
        ditolak: getCountByStatus(potensiGroups, 'DITOLAK'),
      }

      return {
        ...kecamatan,
        totalPelanggan,
        aktif,
        tutupSementara,
        tutupSpt,
        cabutPermanen,
        nonAktif,
        mbr,
        potensi,
      }
    }),

  // ── Statistik agregat pelanggan untuk panel overlay di peta ────────────
  getPelangganStats: protectedProcedure.query(async () => {
    const statusGroups = await db.pelanggan.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    })

    const total = statusGroups.reduce((sum, g) => sum + g._count._all, 0)

    return {
      total,
      aktif: getCountByStatus(statusGroups, 'AKTIF'),
      tutupSementara: getCountByStatus(statusGroups, 'TUTUP_SEMENTARA'),
      tutupSpt: getCountByStatus(statusGroups, 'TUTUP_SPT'),
      cabutPermanen: getCountByStatus(statusGroups, 'CABUT_PERMANEN'),
    }
  }),
  // ── List titik pelanggan potensial untuk layer prospek di peta ─────────
  getPotensiPelangganList: protectedProcedure
    .input(
      z.object({
        take: z.number().default(1000),
        skip: z.number().default(0),
        search: z.string().optional(),
        status: z
          .enum(['PROSPEK', 'DITOLAK', 'MENUNGGU_SURVEI', 'VALIDASI'])
          .optional(),
        ruteId: z.string().optional(),
        kelurahanId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const searchFilter = input.search
        ? Prisma.sql`AND alamat ILIKE ${`%${input.search}%`}`
        : Prisma.empty
      const statusFilter = input.status
        ? Prisma.sql`AND status::text = ${input.status}`
        : Prisma.empty
      const ruteFilter = input.ruteId
        ? Prisma.sql`AND "ruteId" = ${input.ruteId}`
        : Prisma.empty
      const kelurahanFilter = input.kelurahanId
        ? Prisma.sql`AND "kelurahanId" = ${input.kelurahanId}`
        : Prisma.empty

      // "koordinat" bertipe Unsupported(geometry) → tidak bisa di-select
      // lewat Prisma Client biasa, wajib raw query. Karena filter di bawah
      // butuh dipakai dua kali (list & count) tapi tabel ini tidak punya
      // fallback legacy lat/long seperti Pelanggan, count tetap dihitung
      // via raw SQL juga agar konsisten dengan kondisi "koordinat IS NOT NULL".
      const [potensiList, totalRows] = await Promise.all([
        db.$queryRaw<
          Array<{
            id: string
            alamat: string
            status: string
            geoLat: number | null
            geoLong: number | null
          }>
        >(Prisma.sql`
          SELECT
            id,
            alamat,
            status,
            ST_Y("koordinat") AS "geoLat",
            ST_X("koordinat") AS "geoLong"
          FROM "PotensiPelanggan"
          WHERE "koordinat" IS NOT NULL
          ${searchFilter}
          ${statusFilter}
          ${ruteFilter}
          ${kelurahanFilter}
          ORDER BY "createdAt" DESC
          LIMIT ${input.take} OFFSET ${input.skip}
        `),
        db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "PotensiPelanggan"
          WHERE "koordinat" IS NOT NULL
          ${searchFilter}
          ${statusFilter}
          ${ruteFilter}
          ${kelurahanFilter}
        `),
      ])

      return {
        data: potensiList,
        total: Number(totalRows[0]?.count ?? 0),
      }
    }),

  // ── Detail satu titik potensi (klik marker prospek di peta) ────────────
  getPotensiPelangganDetail: protectedProcedure
    .input(z.object({ id: z.string().min(1, 'ID potensi tidak boleh kosong') }))
    .query(async ({ input }) => {
      const potensi = await db.potensiPelanggan.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          alamat: true,
          status: true,
          catatan: true,
          petugasId: true,
          rute: { select: { id: true, kode: true, noUrut: true } },
          kelurahan: {
            select: {
              id: true,
              nama: true,
              kecamatan: { select: { id: true, nama: true } },
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!potensi) return null

      const [coord] = await db.$queryRaw<
        Array<{ geoLat: number | null; geoLong: number | null }>
      >(Prisma.sql`
        SELECT ST_Y("koordinat") AS "geoLat", ST_X("koordinat") AS "geoLong"
        FROM "PotensiPelanggan"
        WHERE id = ${input.id}
      `)

      return {
        ...potensi,
        geoLat: coord?.geoLat ?? null,
        geoLong: coord?.geoLong ?? null,
      }
    }),

  // ── Statistik agregat titik potensi untuk panel overlay di peta ────────
  getPotensiPelangganStats: protectedProcedure.query(async () => {
    const statusGroups = await db.potensiPelanggan.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    const total = statusGroups.reduce((sum, g) => sum + g._count._all, 0)

    return {
      total,
      prospek: getCountByStatus(statusGroups, 'PROSPEK'),
      menungguSurvei: getCountByStatus(statusGroups, 'MENUNGGU_SURVEI'),
      validasi: getCountByStatus(statusGroups, 'VALIDASI'),
      ditolak: getCountByStatus(statusGroups, 'DITOLAK'),
    }
  }),
  // ── List titik pemutusan/eks-pelanggan untuk layer di peta ─────────────
  getPemutusanList: protectedProcedure
    .input(
      z.object({
        take: z.number().default(1000),
        skip: z.number().default(0),
        search: z.string().optional(),
        jenis: z.enum(['TSM', 'SPT', 'LAINNYA']).optional(),
        sumberData: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const searchFilter = input.search
        ? Prisma.sql`AND (pm."nomorLangganan" ILIKE ${`%${input.search}%`} OR pel."nomorLangganan" ILIKE ${`%${input.search}%`} OR pel.nama ILIKE ${`%${input.search}%`})`
        : Prisma.empty
      const jenisFilter = input.jenis
        ? Prisma.sql`AND pm.jenis::text = ${input.jenis}`
        : Prisma.empty
      const sumberFilter = input.sumberData
        ? Prisma.sql`AND pm."sumberData" = ${input.sumberData}`
        : Prisma.empty

      const coordWhere = Prisma.sql`
        COALESCE(ST_Y(pm."koordinatVerifikasi"), ST_Y(pel."koordinat"), pel."geoLat") IS NOT NULL
        AND COALESCE(ST_X(pm."koordinatVerifikasi"), ST_X(pel."koordinat"), pel."geoLong") IS NOT NULL
      `

      // TAHAP 1: Ambil ID & Koordinat via PostGIS Raw Query
      const [rawCoords, totalRows] = await Promise.all([
        db.$queryRaw<
          Array<{
            id: string
            geoLat: number | null
            geoLong: number | null
          }>
        >(Prisma.sql`
          SELECT
            pm.id,
            COALESCE(ST_Y(pm."koordinatVerifikasi"), ST_Y(pel."koordinat"), pel."geoLat") AS "geoLat",
            COALESCE(ST_X(pm."koordinatVerifikasi"), ST_X(pel."koordinat"), pel."geoLong") AS "geoLong"
          FROM "Pemutusan" pm
          LEFT JOIN "Pelanggan" pel ON pel.id = pm."pelangganId"
          WHERE ${coordWhere}
          ${searchFilter}
          ${jenisFilter}
          ${sumberFilter}
          ORDER BY pm."tanggalCabut" DESC NULLS LAST, pm."createdAt" DESC
          LIMIT ${input.take} OFFSET ${input.skip}
        `),
        db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count
          FROM "Pemutusan" pm
          LEFT JOIN "Pelanggan" pel ON pel.id = pm."pelangganId"
          WHERE ${coordWhere}
          ${searchFilter}
          ${jenisFilter}
          ${sumberFilter}
        `),
      ])

      const ids = rawCoords.map((item) => item.id)

      // TAHAP 2: Tarik data & Relasi Berjenjang murni menggunakan Prisma Client
      const pemutusanDetails = await db.pemutusan.findMany({
        where: { id: { in: ids } },
        include: {
          pelanggan: true,
          kelurahan: {
            include: {
              kecamatan: true, // Otomatis ter-load lewat relasi DB kawan!
            },
          },
        },
      })

      // TAHAP 3: Satukan koordinat PostGIS dengan Object Prisma & Flattening untuk Frontend
      const mappedData = rawCoords.map((raw) => {
        const item = pemutusanDetails.find((d) => d.id === raw.id)
        return {
          id: raw.id,
          pelangganId: item?.pelangganId ?? null,
          nomorLangganan:
            item?.nomorLangganan ?? item?.pelanggan?.nomorLangganan ?? null,
          nama:
            item?.pelanggan?.nama ?? item?.catatanSurveiAsli ?? 'Eks Pelanggan',
          alamat: item?.pelanggan?.alamat ?? null,

          // --- PERUBAHAN DI SINI ---
          // Kita paksa statusnya menjadi "EKS_PELANGGAN" agar konsisten
          status: 'EKS_PELANGGAN',

          // Simpan jenis asli di properti lain jika masih dibutuhkan untuk info detail
          jenisAsli: item?.jenis ?? 'LAINNYA',
          // --------------------------

          periode: item?.periode ?? 0,
          sumberData: item?.sumberData ?? 'UNKNOWN',
          tanggalCabut: item?.tanggalCabut ?? null,
          tanggalTutup: item?.tanggalTutup ?? null,
          geoLat: raw.geoLat,
          geoLong: raw.geoLong,
          kelurahanId: item?.kelurahan?.id ?? null,
          namaKelurahan: item?.kelurahan?.nama ?? null,
          namaKecamatan: item?.kelurahan?.kecamatan?.nama ?? null,
        }
      })

      return {
        data: mappedData,
        total: Number(totalRows[0]?.count ?? 0),
      }
    }),

  // ── Detail satu titik pemutusan (klik marker eks-pelanggan di peta) ────
  getPemutusanDetail: protectedProcedure
    .input(
      z.object({ id: z.string().min(1, 'ID pemutusan tidak boleh kosong') }),
    )
    .query(async ({ input }) => {
      // Ambil data utama & relasi wilayah bertingkat murni via Prisma ORM
      const pemutusan = await db.pemutusan.findUnique({
        where: { id: input.id },
        include: {
          pelanggan: true,
          kelurahan: {
            include: {
              kecamatan: true,
            },
          },
        },
      })

      if (!pemutusan) return null

      // Koordinat tetap diambil via raw query super ringan (tanpa JOIN wilayah)
      const [coord] = await db.$queryRaw<
        Array<{ geoLat: number | null; geoLong: number | null }>
      >(Prisma.sql`
        SELECT
          COALESCE(ST_Y(pm."koordinatVerifikasi"), ST_Y(pel."koordinat"), pel."geoLat") AS "geoLat",
          COALESCE(ST_X(pm."koordinatVerifikasi"), ST_X(pel."koordinat"), pel."geoLong") AS "geoLong"
        FROM "Pemutusan" pm
        LEFT JOIN "Pelanggan" pel ON pel.id = pm."pelangganId"
        WHERE pm.id = ${input.id}
      `)

      return {
        ...pemutusan,
        geoLat: coord?.geoLat ?? null,
        geoLong: coord?.geoLong ?? null,
        // Menyediakan helper data wilayah flat jika komponen UI membutuhkannya
        namaKelurahan: pemutusan.kelurahan?.nama ?? null,
        namaKecamatan: pemutusan.kelurahan?.kecamatan?.nama ?? null,
      }
    }),

  // ── Statistik agregat titik pemutusan untuk panel overlay di peta ──────
  getPemutusanStats: protectedProcedure.query(async () => {
    const [jenisGroups, sumberGroups, kelurahanGroups] = await Promise.all([
      db.pemutusan.groupBy({
        by: ['jenis'],
        _count: { _all: true },
      }),
      db.pemutusan.groupBy({
        by: ['sumberData'],
        _count: { _all: true },
      }),
      // Grouping data pemutusan berdasarkan kelurahanId
      db.pemutusan.groupBy({
        by: ['kelurahanId'],
        _count: { _all: true },
        where: { kelurahanId: { not: null } },
      }),
    ])

    // Ambil detail nama Kelurahan & Kecamatan dari ID hasil grouping menggunakan Prisma
    const kelurahanIds = kelurahanGroups.map((g) => g.kelurahanId as string)
    const wilayahDetails = await db.kelurahan.findMany({
      where: { id: { in: kelurahanIds } },
      include: { kecamatan: true },
    })

    const perWilayah = kelurahanGroups.map((g) => {
      const detail = wilayahDetails.find((w) => w.id === g.kelurahanId)
      return {
        kelurahanId: g.kelurahanId,
        namaKelurahan: detail?.nama ?? 'Tidak Diketahui',
        namaKecamatan: detail?.kecamatan?.nama ?? 'Tidak Diketahui',
        jumlah: g._count._all,
      }
    })

    const total = jenisGroups.reduce((sum, g) => sum + g._count._all, 0)

    return {
      total,
      tsm: getCountByJenis(jenisGroups, 'TSM'),
      spt: getCountByJenis(jenisGroups, 'SPT'),
      lainnya: getCountByJenis(jenisGroups, 'LAINNYA'),
      perSumberData: sumberGroups.map((g) => ({
        sumberData: g.sumberData,
        jumlah: g._count._all,
      })),
      perWilayah, // Statistik per wilayah kelurahan & kecamatan siap pakai kawan!
    }
  }),
  // ── GeoJSON wilayah (kelurahan) untuk layer di peta ──────────────────
  getWilayahGeoJson: protectedProcedure.query(async () => {
    const rows = await db.$queryRaw<
      Array<{ id: string; kode: string; nama: string; area: string | null }>
    >(Prisma.sql`
      SELECT id, kode, nama, ST_AsGeoJSON(area) AS area
      FROM "Kelurahan"
      WHERE area IS NOT NULL
      ORDER BY nama ASC
    `)

    const features = rows
      .filter((row) => row.area)
      .map((row) => ({
        type: 'Feature',
        geometry: JSON.parse(row.area!),
        properties: {
          id: row.id,
          kode: row.kode,
          nama: row.nama,
        },
      }))

    return {
      type: 'FeatureCollection',
      features,
    }
  }),

  // ── GeoJSON wilayah (kecamatan) untuk layer di peta ──────────────────
  getKecamatanGeoJson: protectedProcedure.query(async () => {
    const rows = await db.$queryRaw<
      Array<{ id: string; kode: string; nama: string; area: string | null }>
    >(Prisma.sql`
      SELECT id, kode, nama, ST_AsGeoJSON(area) AS area
      FROM "Kecamatan"
      WHERE area IS NOT NULL
      ORDER BY nama ASC
    `)

    const features = rows
      .filter((row) => row.area)
      .map((row) => ({
        type: 'Feature',
        // AMAN: Cek tipe data terlebih dahulu sebelum melakukan parsing manual
        geometry:
          typeof row.area === 'string' ? JSON.parse(row.area) : row.area,
        properties: {
          id: row.id,
          kode: row.kode,
          nama: row.nama,
        },
      }))

    return {
      type: 'FeatureCollection',
      features,
    }
  }),
})
