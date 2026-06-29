// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prisma } from '@/lib/prisma'
import { dash, sentinel } from '@better-auth/infra'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      // ── Role & Status ──────────────────────────────────────
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
      status: {
        type: 'string',
        defaultValue: 'ACTIVE',
        input: false,
      },

      // ── Relasi ID (UUID database) ──────────────────────────
      divisiId: {
        type: 'string',
        required: false,
        input: false,
      },
      bagianId: {
        type: 'string',
        required: false,
        input: false,
      },
      subBagianId: {
        type: 'string',
        required: false,
        input: false,
      },

      // ── Kode statis untuk nav access check ────────────────
      divisiKode: {
        type: 'string',
        required: false,
        input: false,
      },
      subBagianKode: {
        type: 'string',
        required: false,
        input: false,
      },

      // ── Audit ──────────────────────────────────────────────
      lastLoginAt: {
        type: 'date',
        required: false,
        input: false,
      },
      loginCount: {
        type: 'number',
        defaultValue: 0,
        input: false,
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
              divisi: { select: { kode: true } },
              subBagian: { select: { kode: true } },
            },
          })

          if (user) {
            await prisma.user.update({
              where: { id: session.userId },
              data: {
                divisiKode: user.divisi?.kode ?? null,
                subBagianKode: user.subBagian?.kode ?? null,
              },
            })
          }

          return { data: session }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  trustedOrigins: [
    'http://localhost:3000',
    process.env.BETTER_AUTH_URL ?? '',
  ].filter(Boolean),

  // PENTING: tanstackStartCookies() harus selalu paling TERAKHIR
  plugins: [
    twoFactor({
      totpOptions: { period: 30, digits: 6 },
      backupCodeOptions: { amount: 10, length: 8 },
    }),
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY!,
    }),
    sentinel({
      apiKey: process.env.BETTER_AUTH_API_KEY!,
    }),
    tanstackStartCookies(), // ← selalu terakhir
  ],
})

export type Session = typeof auth.$Infer.Session.session
export type AuthUser = typeof auth.$Infer.Session.user
