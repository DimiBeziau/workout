'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'unsupported' | 'ios-browser' | 'prompt' | 'granted' | 'denied'

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

async function registerAndSubscribe() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) return

  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  const existing = await reg.pushManager.getSubscription()
  if (existing) return // already subscribed on this device

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  })
}

export function NotificationInit() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    // iOS Safari requires PWA (Add to Home Screen) for push notifications
    if (isIOS && !isStandalone) {
      setStatus('ios-browser')
      return
    }

    if (Notification.permission === 'granted') {
      registerAndSubscribe().catch(console.error)
      setStatus('granted')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    } else {
      setStatus('prompt')
    }
  }, [])

  async function handleAllow() {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setStatus('granted')
      registerAndSubscribe().catch(console.error)
    } else {
      setStatus('denied')
    }
  }

  if (status === 'ios-browser') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-start gap-3 shadow-lg"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <span className="text-lg shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Activer les notifications
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Sur iPhone, ajoutez l&apos;app à votre écran d&apos;accueil via{' '}
            <strong style={{ color: 'var(--color-text-secondary)' }}>Partager → Sur l&apos;écran d&apos;accueil</strong>
            , puis rouvrez-la.
          </p>
        </div>
        <button
          onClick={() => setStatus('denied')}
          className="shrink-0 text-lg"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    )
  }

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
