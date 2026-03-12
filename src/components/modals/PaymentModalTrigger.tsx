"use client"

import { useEffect, useState } from "react"
import { usePaymentModalContext } from "@/providers/payment-modal-provider"
import { createClient } from "@/lib/supabase/client"

const FIRST_LOGIN_KEY = "axs_first_login_shown"

/**
 * Component that triggers the payment modal for first-time users.
 * Add this component to the dashboard or main app layout.
 *
 * It detects if the user is new (created within the last 24 hours)
 * and hasn't dismissed the modal yet.
 */
export function PaymentModalTrigger() {
  const { showForRegistration, hasDismissed } = usePaymentModalContext()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Only run once
    if (hasChecked) return

    // Don't show if already dismissed
    if (hasDismissed) {
      setHasChecked(true)
      return
    }

    // Check if we've already shown the first login modal
    const hasShownFirstLogin = sessionStorage.getItem(FIRST_LOGIN_KEY) === "true"
    if (hasShownFirstLogin) {
      setHasChecked(true)
      return
    }

    const checkNewUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHasChecked(true)
        return
      }

      // Check if user was created in the last 24 hours
      const createdAt = new Date(user.created_at)
      const now = new Date()
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      // If user is new (created within 24 hours), show the modal
      if (hoursSinceCreation < 24) {
        sessionStorage.setItem(FIRST_LOGIN_KEY, "true")
        showForRegistration()
      }

      setHasChecked(true)
    }

    // Small delay to ensure the app is fully loaded
    const timer = setTimeout(checkNewUser, 1500)
    return () => clearTimeout(timer)
  }, [hasDismissed, hasChecked, showForRegistration])

  // This component doesn't render anything
  return null
}
