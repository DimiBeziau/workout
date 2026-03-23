import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { NotificationInit } from '@/components/NotificationInit'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={session.username} />
      <main className="flex-1 w-full px-2 lg:px-4 py-6 max-w-[1600px] mx-auto">
        {children}
      </main>
      <NotificationInit />
    </div>
  )
}
