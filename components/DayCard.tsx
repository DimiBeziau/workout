'use client'

import { useTransition } from 'react'
import type { SessionTemplate, WeeklyPlan } from '@/lib/db/schema'
import { setPlanAction } from '@/app/actions/planning'
import { Moon, Zap } from 'lucide-react'

interface WeeklyPlanWithTemplate extends WeeklyPlan {
  sessionTemplate?: SessionTemplate | null
}

interface Props {
  dayName: string
  dayDate: string
  dayOfWeek: number
  weekStart: string
  plan: WeeklyPlanWithTemplate | null
  templates: SessionTemplate[]
  isToday: boolean
}

export function DayCard({ dayName, dayDate, dayOfWeek, weekStart, plan, templates, isToday }: Props) {
  const [isPending, startTransition] = useTransition()

  const template = plan?.sessionTemplate ?? null
  const isRest = plan !== null && plan.sessionTemplateId === null
  const hasSession = template !== null

  const handleChange = (value: string) => {
    startTransition(() => {
      const templateId = value === 'rest' || value === '' ? null : Number(value)
      setPlanAction(weekStart, dayOfWeek, templateId)
    })
  }

  const borderStyle = isToday
    ? { border: '1px solid var(--color-neon-purple)', boxShadow: '0 0 12px rgba(157,0,255,0.2)' }
    : hasSession
    ? template.type === 'cardio'
      ? { border: '1px solid rgba(255,0,255,0.3)', boxShadow: '0 0 8px rgba(255,0,255,0.1)' }
      : { border: '1px solid rgba(157,0,255,0.3)', boxShadow: '0 0 8px rgba(157,0,255,0.1)' }
    : isRest
    ? { border: '1px solid var(--color-border-subtle)', opacity: 0.7 }
    : { border: '1px solid var(--color-border-subtle)' }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all"
      style={{
        background: isRest ? 'rgba(8,8,15,0.6)' : 'var(--color-bg-card)',
        ...borderStyle,
      }}
    >
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{
              color: isToday
                ? 'var(--color-neon-purple)'
                : 'var(--color-text-secondary)',
            }}
          >
            {dayName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {dayDate}
          </p>
        </div>
        {hasSession && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={
              template.type === 'cardio'
                ? {
                    background: 'rgba(255,0,255,0.15)',
                    color: 'var(--color-neon-pink)',
                    boxShadow: '0 0 6px rgba(255,0,255,0.3)',
                  }
                : {
                    background: 'rgba(157,0,255,0.15)',
                    color: 'var(--color-neon-purple)',
                    boxShadow: '0 0 6px rgba(157,0,255,0.3)',
                  }
            }
          >
            {template.type === 'cardio' ? 'Cardio' : 'Renfo'}
          </span>
        )}
        {isRest && <Moon size={14} style={{ color: 'var(--color-text-muted)' }} />}
      </div>

      {/* Session info */}
      {hasSession && (
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            <Zap
              size={12}
              className="inline mr-1"
              style={{
                color: template.type === 'cardio' ? 'var(--color-neon-pink)' : 'var(--color-neon-purple)',
              }}
            />
            {template.title}
          </p>
          {template.description && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {template.description}
            </p>
          )}
        </div>
      )}

      {isRest && !hasSession && (
        <div className="flex-1 flex items-center gap-1.5">
          <Moon size={12} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Repos
          </p>
        </div>
      )}

      {!hasSession && !isRest && (
        <div className="flex-1" />
      )}

      {/* Selector */}
      <select
        disabled={isPending}
        value={
          hasSession
            ? String(plan!.sessionTemplateId)
            : isRest
            ? 'rest'
            : ''
        }
        onChange={(e) => handleChange(e.target.value)}
        className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none transition-all disabled:opacity-50 cursor-pointer"
        style={{
          background: 'var(--color-bg-input)',
          border: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <option value="">— Planifier —</option>
        <option value="rest">😴 Repos</option>
        {templates.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.type === 'cardio' ? '🏃' : '💪'} {t.title}
          </option>
        ))}
      </select>
    </div>
  )
}
