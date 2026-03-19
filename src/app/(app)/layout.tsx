import { Suspense } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { NavBar } from '@/components/layout/NavBar'
import { PaymentModalTrigger } from '@/components/modals'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppHeader />
      <NavBar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
      {/* Triggers pricing modal for new users, handles ?showPricing and ?session_id params */}
      <Suspense fallback={null}>
        <PaymentModalTrigger />
      </Suspense>
    </div>
  )
}
