// ── Enum lokal — JANGAN import dari @/generated/prisma/client di file client ──
// Prisma generated client menarik node:url ke bundle browser.
// Definisikan ulang di sini sebagai plain TS constant.

export const StatusLaporanMandiri = {
  MENUNGGU: 'MENUNGGU',
  DIVERIFIKASI: 'DIVERIFIKASI',
  DITOLAK: 'DITOLAK',
  DIGUNAKAN: 'DIGUNAKAN',
} as const

export type StatusLaporanMandiri =
  (typeof StatusLaporanMandiri)[keyof typeof StatusLaporanMandiri]
