"use client"

import * as React from "react"
import { createContext, useContext, useCallback, useState, useEffect } from "react"
import { PaymentModal } from "@/components/modals/PaymentModal"
import { toast } from "sonner"

const STORAGE_KEY = "axs_payment_modal_dismissed"
const SESSION_KEY = "axs_payment_modal_shown_this_session"
const PREMIUM_KEY = "axs_is_premium"

interface PaymentModalContextValue {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Open the modal */
  openModal: () => void
  /** Close the modal without marking as dismissed */
  closeModal: () => void
  /** Dismiss the modal (stores preference) */
  dismissModal: () => void
  /** Show modal after registration (checks flags) */
  showForRegistration: () => void
  /** Check if user has dismissed before */
  hasDismissed: boolean
  /** Reset all flags */
  resetFlags: () => void
}

const PaymentModalContext = createContext<PaymentModalContextValue | null>(null)

export function PaymentModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)
  const [hasShownInSession, setHasShownInSession] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from storage
  useEffect(() => {
    if (typeof window === "undefined") return

    const dismissed = localStorage.getItem(STORAGE_KEY) === "true"
    const shownInSession = sessionStorage.getItem(SESSION_KEY) === "true"

    setHasDismissed(dismissed)
    setHasShownInSession(shownInSession)
    setIsInitialized(true)
  }, [])

  const openModal = useCallback(() => {
    setIsOpen(true)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "true")
      setHasShownInSession(true)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const dismissModal = useCallback(() => {
    setIsOpen(false)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true")
      sessionStorage.setItem(SESSION_KEY, "true")
      setHasDismissed(true)
      setHasShownInSession(true)
    }
  }, [])

  const showForRegistration = useCallback(() => {
    if (!isInitialized) return

    // Don't show if already dismissed or shown in this session
    if (hasDismissed || hasShownInSession) return

    // Small delay to let UI settle after registration
    setTimeout(() => {
      openModal()
    }, 800)
  }, [isInitialized, hasDismissed, hasShownInSession, openModal])

  const resetFlags = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      setHasDismissed(false)
      setHasShownInSession(false)
    }
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      closeModal()
    } else {
      openModal()
    }
  }, [closeModal, openModal])

  const handleStartPremium = useCallback(async () => {
    try {
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
      })

      if (response.ok) {
        // Store premium status locally
        if (typeof window !== "undefined") {
          localStorage.setItem(PREMIUM_KEY, "true")
        }
        toast.success('🎉 Welcome to Premium! Enjoy unlimited features.')
        closeModal()
        // Refresh to update UI
        window.location.reload()
      } else {
        toast.error('Failed to upgrade. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }, [closeModal])

  const handleMaybeLater = useCallback(() => {
    dismissModal()
  }, [dismissModal])

  const value: PaymentModalContextValue = {
    isOpen,
    openModal,
    closeModal,
    dismissModal,
    showForRegistration,
    hasDismissed,
    resetFlags
  }

  return (
    <PaymentModalContext.Provider value={value}>
      {children}
      <PaymentModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        onStartPremium={handleStartPremium}
        onMaybeLater={handleMaybeLater}
      />
    </PaymentModalContext.Provider>
  )
}

export function usePaymentModalContext() {
  const context = useContext(PaymentModalContext)
  if (!context) {
    throw new Error("usePaymentModalContext must be used within PaymentModalProvider")
  }
  return context
}

// Hook for triggering modal after auth events
export function useShowPaymentAfterAuth() {
  const { showForRegistration } = usePaymentModalContext()

  const triggerAfterRegistration = useCallback(() => {
    showForRegistration()
  }, [showForRegistration])

  return { triggerAfterRegistration }
}
