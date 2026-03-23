import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-32ch'
)

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let userId: number
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    userId = payload.userId as number
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const body = await req.json()
  const { endpoint, keys } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
  }

  // Upsert by endpoint (handles re-subscription on same device)
  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: keys.p256dh, auth: keys.auth },
    })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { endpoint } = await req.json()
  if (endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  }
  return NextResponse.json({ ok: true })
}
