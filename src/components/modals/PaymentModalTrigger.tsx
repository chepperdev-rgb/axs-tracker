"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { usePaymentModalContext } from "@/providers/payment-modal-provider"
import { createClient } from "@/lib/supabase/client"
import { useI18n } from "@/providers/i18n-provider"
import { toast } from "sonner"

const FIRST_LOGIN_KEY = "axs_first_login_shown"

/**
 * Component that handles payment modal triggers:
 * 1. ?showPricing=true  — opens pricing modal (from registration redirect)
 * 2. ?session_id=...    — shows success toast after Stripe checkout
 * 3. New user detection — auto-shows for users < 24 hours old
 *
 * Renders nothing — purely logic.
 */
export function PaymentModalTrigger() {
  const { showForRegistration, hasDismissed, openModal } = usePaymentModalContext()
  const { t } = useI18n()
  const [hasChecked, setHasChecked] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const handledRef = useRef(false)

  // Handle ?showPricing=true and ?session_id=... query params
  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const showPricing = searchParams.get("showPricing")
    const sessionId = searchParams.get("session_id")

    if (sessionId) {
      // Payment returned — verify session and activate plan
      fetch('/api/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.plan && data.plan !== 'free') {
            toast.success(t.pricing.successTitle, {
              description: t.pricing.successDesc,
              duration: 6000,
            })
          }
        })
        .catch(() => {})
        .finally(() => {
          // Clean URL and reload to remove paywall
          const url = new URL(window.location.href)
          url.searchParams.delete("session_id")
          url.searchParams.delete("showPricing")
          window.location.href = url.pathname
        })
      return
    }

    if (showPricing === "true") {
      // From registration — clean URL and show pricing
      const url = new URL(window.location.href)
      url.searchParams.delete("showPricing")
      router.replace(url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""))

      setTimeout(() => {
        openModal()
      }, 600)
    }
  }, [searchParams, router, openModal, t.pricing])

  // Auto-show for new users (created < 24 hours ago), no ?showPricing redirect
  useEffect(() => {
    if (hasChecked) return
    if (hasDismissed) {
      setHasChecked(true)
      return
    }

    const showPricing = searchParams.get("showPricing")
    const sessionId = searchParams.get("session_id")

    // Skip auto-detection if query params handle it
    if (showPricing === "true" || sessionId) {
      setHasChecked(true)
      return
    }

    const hasShownFirstLogin = sessionStorage.getItem(FIRST_LOGIN_KEY) === "true"
    if (hasShownFirstLogin) {
      setHasChecked(true)
      return
    }

    const checkNewUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setHasChecked(true)
        return
      }

      const createdAt = new Date(user.created_at)
      const now = new Date()
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceCreation < 24) {
        sessionStorage.setItem(FIRST_LOGIN_KEY, "true")
        showForRegistration()
      }

      setHasChecked(true)
    }

    const timer = setTimeout(checkNewUser, 1500)
    return () => clearTimeout(timer)
  }, [hasDismissed, hasChecked, showForRegistration, searchParams])

  return null
}
