import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SessionTemplate, WeeklyPlan } from '@/lib/db/schema'
import { parseDate, addDays, DAY_NAMES_FR, formatDayDate } from '@/lib/utils'
import { DayCard } from './DayCard'

interface WeeklyPlanWithTemplate extends WeeklyPlan {
  sessionTemplate?: SessionTemplate | null
}

interface Props {
  weekStart: string
  prevWeek: string
  nextWeek: string
  templates: SessionTemplate[]
  plans: WeeklyPlanWithTemplate[]
}

export function WeekView({ weekStart, prevWeek, nextWeek, templates, plans }: Props) {
  const weekStartDate = parseDate(weekStart)

  const plansByDay = new Map<number, WeeklyPlanWithTemplate>()
  for (const plan of plans) {
    plansByDay.set(plan.dayOfWeek, plan)
  }

  const weekLabel = weekStartDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const weekEnd = addDays(weekStartDate, 6)
  const weekEndLabel = weekEnd.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Semaine du {weekLabel}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            au {weekEndLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?week=${prevWeek}`}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}
          >
            <ChevronLeft size={18} />
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}
          >
            Aujourd'hui
          </Link>
          <Link
            href={`/dashboard?week=${nextWeek}`}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }, (_, i) => {
          const dayDate = addDays(weekStartDate, i)
          const dayOfWeek = i + 1 // 1=Monday, 7=Sunday
          const plan = plansByDay.get(dayOfWeek)
          const isToday =
            dayDate.toDateString() === new Date().toDateString()

          return (
            <DayCard
              key={i}
              dayName={DAY_NAMES_FR[i]}
              dayDate={formatDayDate(dayDate)}
              dayOfWeek={dayOfWeek}
              weekStart={weekStart}
              plan={plan ?? null}
              templates={templates}
              isToday={isToday}
            />
          )
        })}
      </div>

      {templates.length === 0 && (
        <div
          className="text-center py-8 rounded-xl"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
        >
          <p style={{ color: 'var(--color-text-muted)' }} className="text-sm">
            Aucune séance type créée.{' '}
            <Link href="/dashboard/templates" style={{ color: 'var(--color-neon-purple)' }}>
              Créer une séance type →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
