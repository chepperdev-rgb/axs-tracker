'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePaymentModalContext } from '@/providers/payment-modal-provider'

/**
 * Paywall guard — checks if user has a paid plan.
 * If plan is 'free', forces PricingModal open and blocks content.
 * Renders a full-screen overlay that prevents interaction with the app.
 */
export function PaywallGuard() {
  const { openModal, isOpen } = usePaymentModalContext()
  const [isPaid, setIsPaid] = useState<boolean | null>(null) // null = loading

  useEffect(() => {
    const checkPlan = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setIsPaid(true); return } // not logged in = let middleware handle

        // Fetch user plan from our API
        const res = await fetch('/api/user/plan')
        if (!res.ok) { setIsPaid(true); return } // error = don't block
        const data = await res.json()
        const plan = data.plan || 'free'
        setIsPaid(plan !== 'free')
      } catch {
        setIsPaid(true) // on error, don't block
      }
    }

    checkPlan()
  }, [])

  // If user is on free plan, force pricing modal
  useEffect(() => {
    if (isPaid === false && !isOpen) {
      openModal()
    }
  }, [isPaid, isOpen, openModal])

  // While loading or if paid, render nothing
  if (isPaid !== false) return null

  // Free user — block content with overlay (PricingModal is shown by provider)
  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm" />
  )
}
