'use client'

import { useTransition, useState, useEffect } from 'react'
import type { SessionTemplate, WeeklyPlan } from '@/lib/db/schema'
import { setPlanAction, setScheduledTimeAction } from '@/app/actions/planning'
import { Moon, Zap, Clock } from 'lucide-react'
import { CustomSelect, type SelectOption } from '@/components/ui/CustomSelect'

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
  const [localTime, setLocalTime] = useState(plan?.scheduledTime ?? '')

  // Sync when plan changes from server revalidation
  useEffect(() => {
    setLocalTime(plan?.scheduledTime ?? '')
  }, [plan?.scheduledTime])

  const template = plan?.sessionTemplate ?? null
  const isRest = plan !== null && plan.sessionTemplateId === null
  const hasSession = template !== null

  const handleChange = (value: string) => {
    startTransition(() => {
      const templateId = value === 'rest' || value === '' ? null : Number(value)
      setPlanAction(weekStart, dayOfWeek, templateId)
    })
  }

  const handleTimeChange = (value: string) => {
    setLocalTime(value)
    startTransition(() => {
      setScheduledTimeAction(weekStart, dayOfWeek, value || null)
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

      {/* Time picker — only when a session is assigned */}
      {hasSession && (
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="time"
            value={localTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={isPending}
            className="flex-1 bg-transparent text-xs outline-none min-w-0"
            style={{
              color: localTime ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              colorScheme: 'dark',
            }}
            aria-label="Heure de la séance"
          />
          {localTime && (
            <button
              onClick={() => handleTimeChange('')}
              className="text-xs leading-none"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Effacer l'heure"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Selector */}
      <CustomSelect
        size="sm"
        disabled={isPending}
        value={hasSession ? String(plan!.sessionTemplateId) : isRest ? 'rest' : ''}
        onChange={handleChange}
        placeholder="— Planifier —"
        options={[
          { value: 'rest', label: '😴 Repos', accent: 'muted' },
          ...templates.map<SelectOption>((t) => ({
            value: String(t.id),
            label: `${t.type === 'cardio' ? '🏃' : '💪'} ${t.title}`,
            accent: t.type === 'cardio' ? 'pink' : 'purple',
          })),
        ]}
      />
    </div>
  )
}
