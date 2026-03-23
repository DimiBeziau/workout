'use client'

import { useEffect, useState } from 'react'

type Status = 'loading' | 'unsupported' | 'ios-browser' | 'prompt' | 'subscribing' | 'granted' | 'denied' | 'error'

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

async function getVapidKey(): Promise<string> {
  const res = await fetch('/api/push/vapid-key')
  const { publicKey } = await res.json() as { publicKey: string }
  return publicKey ?? ''
}

async function subscribeAndSave(vapidKey: string): Promise<boolean> {
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  })
  return res.ok
}

export function NotificationInit() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isIOS && !isStandalone) {
      setStatus('ios-browser')
      return
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    const perm = Notification.permission

    if (perm === 'denied') {
      setStatus('denied')
      return
    }

    if (perm === 'granted') {
      // Try to auto-resubscribe in background (no user gesture needed on Android)
      getVapidKey().then((vapidKey) => {
        if (!vapidKey) return
        return subscribeAndSave(vapidKey)
      }).catch(console.error)
      setStatus('granted') // don't block UI, subscription happens silently
      return
    }

    // permission === 'default' → show the banner
    setStatus('prompt')
  }, [])

  async function handleAllow() {
    setStatus('subscribing')
    try {
      // Fetch VAPID key (lazy, inside user gesture async chain)
      const vapidKey = await getVapidKey()
      if (!vapidKey) {
        setStatus('error')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Request permission — must stay in the user gesture async chain
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setStatus(res.ok ? 'granted' : 'error')
    } catch (err) {
      console.error('[Push]', err)
      setStatus('error')
    }
  }

  if (status === 'ios-browser') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-start gap-3 shadow-lg"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
      >
        <span className="text-xl shrink-0">📲</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Activer les notifications
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Sur iPhone, appuyez sur{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>⎋ Partager</span>
            {' '}puis{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>« Sur l&apos;écran d&apos;accueil »</span>
            , rouvrez ensuite l&apos;app depuis l&apos;écran d&apos;accueil.
          </p>
        </div>
        <button onClick={() => setStatus('granted')} className="shrink-0 text-xl leading-none" style={{ color: 'var(--color-text-muted)' }}>×</button>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-start gap-3 shadow-lg"
        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(255,160,0,0.3)' }}
      >
        <span className="text-xl shrink-0">🔕</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Notifications bloquées
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Dans Chrome : appuyez sur le{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>🔒 cadenas</span>
            {' '}dans la barre d&apos;adresse →{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>Notifications → Autoriser</span>
            , puis rechargez la page.
          </p>
        </div>
        <button onClick={() => setStatus('granted')} className="shrink-0 text-xl leading-none" style={{ color: 'var(--color-text-muted)' }}>×</button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg"
        style={{ background: 'var(--color-bg-card)', border: '1px solid rgba(255,0,0,0.3)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          ⚠️ Échec de l&apos;activation. Rechargez et réessayez.
        </p>
        <button
          onClick={() => setStatus('prompt')}
          className="text-xs px-2 py-1 rounded shrink-0"
          style={{ color: 'var(--color-neon-purple)', border: '1px solid rgba(157,0,255,0.3)' }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (status === 'prompt' || status === 'subscribing') {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-lg"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
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
            onClick={() => setStatus('granted')}
            disabled={status === 'subscribing'}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)' }}
          >
            Plus tard
          </button>
          <button
            onClick={handleAllow}
            disabled={status === 'subscribing'}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{
              background: 'rgba(157,0,255,0.2)',
              color: 'var(--color-neon-purple)',
              border: '1px solid rgba(157,0,255,0.3)',
              opacity: status === 'subscribing' ? 0.6 : 1,
            }}
          >
            {status === 'subscribing' ? '...' : 'Activer'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
