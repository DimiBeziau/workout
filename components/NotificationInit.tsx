'use client'

import { useEffect, useState, useRef } from 'react'

type Status = 'loading' | 'unsupported' | 'ios-browser' | 'prompt' | 'granted' | 'denied' | 'error'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationInit() {
  const [status, setStatus] = useState<Status>('loading')
  const vapidKeyRef = useRef<string>('')

  useEffect(() => {
    async function init() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true

      // iOS in browser (not PWA): push not supported, guide user
      if (isIOS && !isStandalone) {
        setStatus('ios-browser')
        return
      }

      if (
        !('Notification' in window) ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      ) {
        setStatus('unsupported')
        return
      }

      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }

      // Fetch VAPID public key at runtime (not baked in at build time)
      try {
        const res = await fetch('/api/push/vapid-key')
        const { publicKey } = await res.json() as { publicKey: string }
        if (!publicKey) { setStatus('unsupported'); return }
        vapidKeyRef.current = publicKey
      } catch {
        setStatus('unsupported')
        return
      }

      if (Notification.permission === 'granted') {
        // Check if already subscribed on this device
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          await navigator.serviceWorker.ready
          const existing = await reg.pushManager.getSubscription()
          if (existing) {
            // Re-confirm subscription is saved server-side
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(existing.toJSON()),
            })
            setStatus('granted')
            return
          }
        } catch {
          // Fall through to show the prompt so user can re-subscribe
        }
      }

      setStatus('prompt')
    }

    init().catch(() => setStatus('unsupported'))
  }, [])

  // Everything in one handler so iOS recognises it as a continuous user gesture
  async function handleAllow() {
    const vapidKey = vapidKeyRef.current
    if (!vapidKey) return

    try {
      // 1. Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // 2. Request permission (must originate from user gesture — we're in onClick)
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      // 3. Subscribe to push (still within the user gesture async chain)
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      // 4. Save subscription server-side
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (res.ok) {
        setStatus('granted')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error('[Push] Subscription failed:', err)
      setStatus('error')
    }
  }

  // iOS browser: guide to add to home screen
  if (status === 'ios-browser') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-start gap-3 shadow-lg"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <span className="text-xl shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Activer les notifications
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Sur iPhone, appuyez sur{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>
              &nbsp;⎋ Partager&nbsp;
            </span>
            puis{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>
              « Sur l&apos;écran d&apos;accueil »
            </span>
            , rouvrez ensuite l&apos;app depuis l&apos;écran d&apos;accueil.
          </p>
        </div>
        <button
          onClick={() => setStatus('denied')}
          className="shrink-0 text-xl leading-none"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid rgba(255,0,0,0.3)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          ⚠️ Impossible d&apos;activer les notifications. Vérifiez les paramètres du navigateur.
        </p>
        <button onClick={() => setStatus('denied')} style={{ color: 'var(--color-text-muted)' }}>×</button>
      </div>
    )
  }

  // Normal prompt
  if (status === 'prompt') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            🔔 Activer les notifications
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Rappel 10 min avant chaque séance planifiée
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setStatus('denied')}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            Plus tard
          </button>
          <button
            onClick={handleAllow}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{
              background: 'rgba(157,0,255,0.2)',
              color: 'var(--color-neon-purple)',
              border: '1px solid rgba(157,0,255,0.3)',
            }}
          >
            Activer
          </button>
        </div>
      </div>
    )
  }

  return null
}
