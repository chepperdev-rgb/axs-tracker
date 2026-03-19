'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePaymentModalContext } from '@/providers/payment-modal-provider'

/**
 * Paywall guard — checks if user has a paid plan.
 * If plan is 'free', forces PricingModal open and blocks content.
 * SKIPS when session_id is in URL (payment being verified).
 */
export function PaywallGuard() {
  const { openModal, isOpen } = usePaymentModalContext()
  const [isPaid, setIsPaid] = useState<boolean | null>(null)
  const searchParams = useSearchParams()

  // Skip paywall entirely if session_id is present (Stripe return)
  const hasSessionId = searchParams.get('session_id')

  useEffect(() => {
    if (hasSessionId) {
      setIsPaid(true) // let PaymentModalTrigger handle verification
      return
    }

    const checkPlan = async () => {
      try {
        const res = await fetch('/api/user/plan')
        if (!res.ok) { setIsPaid(true); return }
        const data = await res.json()
        setIsPaid((data.plan || 'free') !== 'free')
      } catch {
        setIsPaid(true)
      }
    }

    checkPlan()
  }, [hasSessionId])

  useEffect(() => {
    if (isPaid === false && !isOpen) {
      openModal()
    }
  }, [isPaid, isOpen, openModal])

  if (isPaid !== false) return null

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm" />
  )
}
