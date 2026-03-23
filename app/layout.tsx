import type { Metadata, Viewport } from 'next'
import './globals.css'
import { NotificationInit } from '@/components/NotificationInit'

export const metadata: Metadata = {
  title: 'Workout Tracker',
  description: 'Planifiez vos séances de sport',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Workout',
  },
}

export const viewport: Viewport = {
  themeColor: '#08080f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        {children}
        <NotificationInit />
      </body>
    </html>
  )
}
