import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessionTemplates } from '@/lib/db/schema'
import { getSession } from '@/lib/auth'
import { TemplateList } from '@/components/TemplateList'
import { TemplateForm } from '@/components/TemplateForm'

export default async function TemplatesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const templates = await db.query.sessionTemplates.findMany({
    where: eq(sessionTemplates.userId, session.userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Séances Types
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Créez et gérez vos modèles de séances réutilisables.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Nouvelle séance type
          </h2>
          <TemplateForm />
        </div>
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Mes séances ({templates.length})
          </h2>
          <TemplateList templates={templates} />
        </div>
      </div>
    </div>
  )
}
