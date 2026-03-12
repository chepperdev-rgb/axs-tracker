import { AppHeader } from '@/components/layout/AppHeader'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppHeader />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        {children}
      </main>
    </div>
  )
}
