import { NextResponse } from 'next/server'

// Returns the VAPID public key at runtime (avoids Next.js build-time NEXT_PUBLIC_ requirement)
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? ''
  return NextResponse.json({ publicKey })
}
