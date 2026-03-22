'use client'

import { useActionState } from 'react'
import { createTemplateAction } from '@/app/actions/sessions'

export function TemplateForm() {
  const [state, action, isPending] = useActionState(createTemplateAction, null)

  return (
    <form action={action} className="space-y-4">
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Titre *
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="Ex: Run 5km, Circuit muscu..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-neon-purple)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-subtle)'
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Type *
          </label>
          <select
            name="type"
            required
            defaultValue=""
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-neon-purple)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-subtle)' }}
          >
            <option value="" disabled>— Choisir un type —</option>
            <option value="cardio">🏃 Cardio</option>
            <option value="renfo">💪 Renfo</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Détails de la séance, exercices, durée..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-neon-purple)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-subtle)'
            }}
          />
        </div>

        {state?.error && (
          <p className="text-sm py-2 px-3 rounded-lg"
             style={{ color: 'var(--color-neon-pink)', background: 'rgba(255,0,255,0.08)' }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-neon-purple), var(--color-neon-pink))',
            color: '#fff',
            boxShadow: '0 0 15px rgba(157, 0, 255, 0.3)',
          }}
        >
          {isPending ? 'Création...' : 'Créer la séance type'}
        </button>
      </div>
    </form>
  )
}
