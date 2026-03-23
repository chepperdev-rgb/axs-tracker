"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "axs_payment_modal_dismissed"
const SESSION_KEY = "axs_payment_modal_shown_this_session"

interface UsePaymentModalOptions {
  /** Whether to respect the session flag (don't show twice in same session) */
  respectSession?: boolean
  /** Whether to respect localStorage (don't show if user dismissed before) */
  respectDismissed?: boolean
}

interface UsePaymentModalReturn {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Open the modal */
  openModal: () => void
  /** Close the modal */
  closeModal: () => void
  /** Toggle the modal state */
  toggleModal: () => void
  /** Mark the modal as dismissed (stores in localStorage) */
  dismissModal: () => void
  /** Check if user has dismissed the modal before */
  hasDismissed: boolean
  /** Check if modal was shown in current session */
  hasShownInSession: boolean
  /** Show modal for first-time registration */
  showForRegistration: () => void
  /** Reset all flags (useful for testing) */
  resetFlags: () => void
}

export function usePaymentModal(
  options: UsePaymentModalOptions = {}
): UsePaymentModalReturn {
  const { respectSession = true, respectDismissed = true } = options

  const [isOpen, setIsOpen] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)
  const [hasShownInSession, setHasShownInSession] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize state from storage on mount
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
    // Mark as shown in session
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "true")
      setHasShownInSession(true)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, "true")
        setHasShownInSession(true)
      }
      return !prev
    })
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

    // Check if we should show the modal
    const shouldShow = !(
      (respectDismissed && hasDismissed) ||
      (respectSession && hasShownInSession)
    )

    if (shouldShow) {
      // Small delay to let the UI settle after registration
      setTimeout(() => {
        openModal()
      }, 500)
    }
  }, [
    isInitialized,
    respectDismissed,
    hasDismissed,
    respectSession,
    hasShownInSession,
    openModal
  ])

  const resetFlags = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      setHasDismissed(false)
      setHasShownInSession(false)
    }
  }, [])

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    dismissModal,
    hasDismissed,
    hasShownInSession,
    showForRegistration,
    resetFlags
  }
}

// Check payment status from API (server-side source of truth)
export function usePaymentStatus() {
  const [hasDismissed, setHasDismissed] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const dismissed = localStorage.getItem(STORAGE_KEY) === "true"
    setHasDismissed(dismissed)

    // Check plan from server
    fetch('/api/user/plan')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.plan && data.plan !== 'free') setIsPremium(true)
      })
      .catch(() => {})
  }, [])

  return { hasDismissed, isPremium }
}
