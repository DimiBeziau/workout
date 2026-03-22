import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sessionTemplates, weeklyPlans } from '@/lib/db/schema'
import { getSession } from '@/lib/auth'
import { getWeekStart, formatDate, addDays, parseDate } from '@/lib/utils'
import { WeekView } from '@/components/WeekView'

interface Props {
  searchParams: Promise<{ week?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect('/login')

  const params = await searchParams
  let weekStart: Date

  if (params.week) {
    weekStart = parseDate(params.week)
  } else {
    weekStart = getWeekStart(new Date())
  }

  const weekStartStr = formatDate(weekStart)

  const [templates, plans] = await Promise.all([
    db.query.sessionTemplates.findMany({
      where: eq(sessionTemplates.userId, session.userId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    }),
    db.query.weeklyPlans.findMany({
      where: and(
        eq(weeklyPlans.userId, session.userId),
        eq(weeklyPlans.weekStart, weekStartStr)
      ),
      with: { sessionTemplate: true },
    }),
  ])

  const prevWeek = formatDate(addDays(weekStart, -7))
  const nextWeek = formatDate(addDays(weekStart, 7))

  return (
    <WeekView
      weekStart={weekStartStr}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      templates={templates}
      plans={plans}
    />
  )
}
