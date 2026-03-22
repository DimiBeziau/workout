'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null)

  return (
    <form action={action} className="space-y-4">
      <div
        className="rounded-xl p-6 space-y-5 card-border"
        style={{ background: 'var(--color-bg-card)' }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Identifiant
          </label>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 transition-all"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-neon-purple)'
              e.target.style.boxShadow = '0 0 0 1px var(--color-neon-purple)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-subtle)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Mot de passe
          </label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-neon-purple)'
              e.target.style.boxShadow = '0 0 0 1px var(--color-neon-purple)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-subtle)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-center py-2 px-3 rounded-lg"
             style={{ color: 'var(--color-neon-pink)', background: 'rgba(255,0,255,0.08)' }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-neon-purple), var(--color-neon-pink))',
            color: '#fff',
            boxShadow: isPending ? 'none' : '0 0 20px rgba(157, 0, 255, 0.4)',
          }}
        >
          {isPending ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </form>
  )
}
