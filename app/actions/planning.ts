'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { weeklyPlans } from '@/lib/db/schema'
import { getSession } from '@/lib/auth'

export async function setPlanAction(
  weekStart: string,
  dayOfWeek: number,
  sessionTemplateId: number | null
) {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié' }

  // Upsert: preserve scheduledTime when switching session, clear it when removing
  await db
    .insert(weeklyPlans)
    .values({
      userId: session.userId,
      weekStart,
      dayOfWeek,
      sessionTemplateId,
      scheduledTime: null,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .onConflictDoUpdate({
      target: [weeklyPlans.userId, weeklyPlans.weekStart, weeklyPlans.dayOfWeek],
      set: {
        sessionTemplateId,
        // Keep existing time when assigning a session, clear it when removing
        scheduledTime: sessionTemplateId === null ? null : sql`scheduled_time`,
      },
    })

  revalidatePath('/dashboard')
}

export async function setScheduledTimeAction(
  weekStart: string,
  dayOfWeek: number,
  scheduledTime: string | null
) {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié' }

  await db
    .update(weeklyPlans)
    .set({ scheduledTime: scheduledTime || null })
    .where(
      and(
        eq(weeklyPlans.userId, session.userId),
        eq(weeklyPlans.weekStart, weekStart),
        eq(weeklyPlans.dayOfWeek, dayOfWeek)
      )
    )

  revalidatePath('/dashboard')
}
