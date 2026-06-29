import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function createTRPCContext(opts: { headers: Headers }) {
  let session = null

  try {
    session = await auth.api.getSession({
      headers: opts.headers,
    })
  } catch {
    session = null
  }

  return {
    headers: opts.headers,
    session,
    prisma,
  }
}
