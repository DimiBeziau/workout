import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { eq, and, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { weeklyPlans, pushSubscriptions } from '@/lib/db/schema'

export async function GET(req: NextRequest) {
  // Configure VAPID inside the handler so it's not called at build time
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  // Protect with a shared secret header
  const secret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Window: sessions starting between now+9min and now+10min
  const windowStart = new Date(now.getTime() + 9 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000)

  // Fetch all plans that have a scheduled time and an assigned session
  const plans = await db.query.weeklyPlans.findMany({
    where: and(isNotNull(weeklyPlans.scheduledTime), isNotNull(weeklyPlans.sessionTemplateId)),
    with: { sessionTemplate: true },
  })

  const toNotify = plans.filter((plan) => {
    if (!plan.scheduledTime) return false

    const [hours, minutes] = plan.scheduledTime.split(':').map(Number)
    // Build local datetime: weekStart (YYYY-MM-DD) + dayOfWeek offset + HH:MM
    const [year, month, day] = plan.weekStart.split('-').map(Number)
    const sessionDate = new Date(year, month - 1, day + plan.dayOfWeek - 1, hours, minutes, 0, 0)

    return sessionDate >= windowStart && sessionDate < windowEnd
  })

  let sent = 0
  let removed = 0

  for (const plan of toNotify) {
    const subs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, plan.userId),
    })

    const payload = JSON.stringify({
      title: `🏋️ ${plan.sessionTemplate?.title ?? 'Séance'}`,
      body: `Dans ~10 min — ${plan.sessionTemplate?.type === 'cardio' ? 'Cardio' : 'Renforcement'}`,
      url: '/dashboard',
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        // Remove expired / unsubscribed endpoints
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
          removed++
        }
      }
    }
  }

  return NextResponse.json({
    checked: plans.length,
    notified: toNotify.length,
    sent,
    removed,
    window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
  })
}
