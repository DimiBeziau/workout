'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

type State = 'loading' | 'unsupported' | 'ios' | 'idle' | 'working' | 'done' | 'denied'

function toUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function subscribe() {
  const { publicKey } = await fetch('/api/push/vapid-key').then(r => r.json()) as { publicKey: string }
  if (!publicKey) throw new Error('Clé VAPID manquante dans le .env')

  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(publicKey) })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  })
  if (!res.ok) throw new Error(`Erreur serveur ${res.status}`)
  return true
}

export function NotificationButton() {
  const [state, setState] = useState<State>('loading')
  const [err, setErr] = useState('')
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isIOS && !isStandalone) { setState('ios'); return }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }
    if (Notification.permission === 'granted') {
      // Silently re-save existing subscription
      ;(async () => {
        try {
          const { publicKey } = await fetch('/api/push/vapid-key').then(r => r.json()) as { publicKey: string }
          if (!publicKey) { setState('idle'); return }
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          await navigator.serviceWorker.ready
          let sub = await reg.pushManager.getSubscription()
          if (!sub) { setState('idle'); return } // no sub → show button to re-subscribe
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          })
          setState('done')
        } catch { setState('idle') }
      })()
      return
    }
    setState('idle') // permission === 'default' → show button
  }, [])

  async function handleClick() {
    if (state === 'working' || state === 'done') return
    setErr('')
    setState('working')
    try {
      const ok = await subscribe()
      setState(ok ? 'done' : 'denied')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setState('idle')
    }
  }

  // Not rendered
  if (state === 'loading' || state === 'unsupported' || state === 'done') return null

  // iOS in Safari browser (not PWA)
  if (state === 'ios') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIOS(v => !v)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-muted)' }}
          title="Activer les notifications"
        >
          <Bell size={15} />
        </button>
        {showIOS && (
          <div
            className="absolute right-0 top-full mt-2 w-64 rounded-xl p-3 z-50 shadow-lg text-xs leading-relaxed"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>📲 iPhone : activer les notifs</p>
            Appuyez sur <strong>⎋ Partager</strong> puis <strong>« Sur l&apos;écran d&apos;accueil »</strong>, puis rouvrez l&apos;app depuis l&apos;écran d&apos;accueil.
            <button onClick={() => setShowIOS(false)} className="block mt-2 text-xs" style={{ color: 'var(--color-neon-purple)' }}>Fermer</button>
          </div>
        )}
      </div>
    )
  }

  // Blocked in browser settings
  if (state === 'denied') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIOS(v => !v)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,100,50,0.8)' }}
          title="Notifications bloquées"
        >
          <BellOff size={15} />
        </button>
        {showIOS && (
          <div
            className="absolute right-0 top-full mt-2 w-64 rounded-xl p-3 z-50 shadow-lg text-xs leading-relaxed"
            style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(255,100,50,0.3)', color: 'var(--color-text-muted)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>🔕 Notifications bloquées</p>
            Dans Chrome : appuyez sur le 🔒 dans la barre d&apos;adresse → <strong>Notifications → Autoriser</strong>, puis rechargez.
            <button onClick={() => setShowIOS(false)} className="block mt-2 text-xs" style={{ color: 'var(--color-neon-purple)' }}>Fermer</button>
          </div>
        )}
      </div>
    )
  }

  // idle or working — main subscribe button
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={state === 'working'}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
        style={{
          color: 'var(--color-neon-purple)',
          border: '1px solid rgba(157,0,255,0.3)',
          opacity: state === 'working' ? 0.6 : 1,
        }}
        title="Activer les notifications"
      >
        <Bell size={15} />
        <span className="hidden sm:inline">{state === 'working' ? '...' : 'Notifs'}</span>
      </button>
      {err && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl p-3 z-50 shadow-lg text-xs break-all"
          style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,100,100,0.9)', fontFamily: 'monospace' }}
        >
          {err}
          <button onClick={() => setErr('')} className="block mt-1" style={{ color: 'var(--color-text-muted)' }}>×</button>
        </div>
      )}
    </div>
  )
}
