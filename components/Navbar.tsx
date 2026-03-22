import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth'
import { Dumbbell, CalendarDays, LogOut } from 'lucide-react'

interface Props {
  username: string
}

export function Navbar({ username }: Props) {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        background: 'rgba(8, 8, 15, 0.85)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Dumbbell
                size={20}
                style={{ color: 'var(--color-neon-pink)' }}
                className="glow-text-pink"
              />
              <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                Workout
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <CalendarDays size={15} />
                Planning
              </Link>
              <Link
                href="/dashboard/templates"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Dumbbell size={15} />
                Séances types
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
              {username}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
