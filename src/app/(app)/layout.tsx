import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { PaymentModalTrigger } from '@/components/modals'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppHeader />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
        {children}
      </main>
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      {/* Triggers payment modal for first-time users */}
      <PaymentModalTrigger />
    </div>
  )
}
