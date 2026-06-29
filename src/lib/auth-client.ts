// src/lib/auth-client.ts
// ============================================================
// BetterAuth — Client Config
//
// PENTING: tetap pakai 'better-auth/react' meskipun framework-nya
// TanStack Start (bukan Next.js). Pemisahan client di Better Auth
// berdasarkan UI library (React/Vue/Svelte/vanilla), bukan
// meta-framework. 'better-auth/client' (vanilla) mengekspos
// `useSession` sebagai nanostores Atom — BUKAN React hook — makanya
// `authClient.useSession()` jadi "not callable" kalau dipakai
// seperti hook React biasa.
// ============================================================

import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/client/plugins'
import { dashClient, sentinelClient } from '@better-auth/infra/client'
import type { auth } from './auth'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL ?? 'http://localhost:3000',

  plugins: [
    twoFactorClient({
      twoFactorPage: '/auth/two-factor',
    }),
    dashClient(),
    sentinelClient({
      // Otomatis solve Proof-of-Work challenge dari sentinel
      autoSolveChallenge: true,
    }),
  ],
})

// ── Named exports untuk kemudahan import ─────────────────────
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// ── Infer tipe session dari server auth ───────────────────────
export type ClientSession = typeof auth.$Infer.Session
