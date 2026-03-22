'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
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

  // Upsert: delete existing then insert
  await db
    .delete(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, session.userId),
        eq(weeklyPlans.weekStart, weekStart),
        eq(weeklyPlans.dayOfWeek, dayOfWeek)
      )
    )

  await db.insert(weeklyPlans).values({
    userId: session.userId,
    weekStart,
    dayOfWeek,
    sessionTemplateId,
    createdAt: Math.floor(Date.now() / 1000),
  })

  revalidatePath('/dashboard')
}
