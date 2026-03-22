'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { createSession, deleteSession } from '@/lib/auth'

export async function loginAction(_prevState: { error?: string } | null, formData: FormData) {
  const username = formData.get('username')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!username || !password) {
    return { error: 'Identifiants requis' }
  }

  const user = await db.query.users.findFirst({ where: eq(users.username, username) })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: 'Identifiants incorrects' }
  }

  await createSession({ userId: user.id, username: user.username })
  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}
