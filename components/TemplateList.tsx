'use client'

import { useTransition } from 'react'
import type { SessionTemplate } from '@/lib/db/schema'
import { deleteTemplateAction } from '@/app/actions/sessions'
import { Trash2, Dumbbell, Heart } from 'lucide-react'

interface Props {
  templates: SessionTemplate[]
}

function TemplateItem({ template }: { template: SessionTemplate }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div
      className="rounded-xl p-4 flex items-start justify-between gap-3 transition-all"
      style={{
        background: 'var(--color-bg-card)',
        border: template.type === 'cardio'
          ? '1px solid rgba(255,0,255,0.2)'
          : '1px solid rgba(157,0,255,0.2)',
      }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
          style={{
            background: template.type === 'cardio'
              ? 'rgba(255,0,255,0.1)'
              : 'rgba(157,0,255,0.1)',
          }}
        >
          {template.type === 'cardio'
            ? <Heart size={14} style={{ color: 'var(--color-neon-pink)' }} />
            : <Dumbbell size={14} style={{ color: 'var(--color-neon-purple)' }} />
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {template.title}
            </p>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={
                template.type === 'cardio'
                  ? { background: 'rgba(255,0,255,0.15)', color: 'var(--color-neon-pink)' }
                  : { background: 'rgba(157,0,255,0.15)', color: 'var(--color-neon-purple)' }
              }
            >
              {template.type}
            </span>
          </div>
          {template.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {template.description}
            </p>
          )}
        </div>
      </div>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => deleteTemplateAction(template.id))}
        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 flex-shrink-0 disabled:opacity-50"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function TemplateList({ templates }: Props) {
  if (templates.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
      >
        <Dumbbell size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Aucune séance type créée
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <TemplateItem key={t.id} template={t} />
      ))}
    </div>
  )
}
