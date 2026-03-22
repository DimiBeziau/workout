'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessionTemplates } from '@/lib/db/schema'
import { getSession } from '@/lib/auth'

export async function createTemplateAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié' }

  const title = formData.get('title')?.toString().trim()
  const type = formData.get('type')?.toString() as 'cardio' | 'renfo'
  const description = formData.get('description')?.toString().trim() ?? ''

  if (!title) return { error: 'Le titre est requis' }
  if (!['cardio', 'renfo'].includes(type)) return { error: 'Type invalide' }

  await db.insert(sessionTemplates).values({
    userId: session.userId,
    title,
    type,
    description,
    createdAt: Math.floor(Date.now() / 1000),
  })

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard')
  return null
}

export async function deleteTemplateAction(id: number) {
  const session = await getSession()
  if (!session) return

  await db
    .delete(sessionTemplates)
    .where(and(eq(sessionTemplates.id, id), eq(sessionTemplates.userId, session.userId)))

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard')
}
