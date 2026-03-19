"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Check, X, Crown, Star, Sparkles, Infinity } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n-provider"
import { PLANS, type PlanKey } from "@/lib/stripe-prices"
import { toast } from "sonner"

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockClose?: boolean
}

const PLAN_ICONS = {
  premium: Crown,
  diamond: Star,
  lifetime: Infinity,
} as const

/**
 * PricingModal — 3-column pricing card with Stripe Checkout integration.
 * Matches the dark luxury gold theme of AXS Tracker.
 */
export function PricingModal({ open, onOpenChange, blockClose = false }: PricingModalProps) {
  const { t } = useI18n()
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  /**
   * Initiates Stripe Checkout for the selected plan.
   * Redirects to Stripe's hosted page on success.
   *
   * @param planKey - The plan identifier (premium, diamond, lifetime)
   */
  const handleSelectPlan = useCallback(
    async (planKey: PlanKey) => {
      const plan = PLANS[planKey]
      setLoadingPlan(planKey)

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: plan.priceId, mode: plan.mode }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error ?? "Checkout failed")
        }

        if (!data.url) {
          throw new Error("No checkout URL returned")
        }

        window.location.href = data.url
      } catch (err) {
        console.error("[PricingModal] checkout error:", err)
        toast.error(t.messages.checkoutError)
        setLoadingPlan(null)
      }
    },
    [t.messages.checkoutError],
  )

  const isLoading = loadingPlan !== null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={blockClose ? undefined : onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/80 backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Modal container */}
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50",
            "flex items-center justify-center p-4",
            "outline-none",
          )}
        >
          <div
            className={cn(
              "w-full max-w-3xl",
              "max-h-[calc(100vh-2rem)]",
              "overflow-y-auto rounded-2xl",
              "bg-gradient-to-b from-[rgba(18,18,18,0.97)] to-[rgba(8,8,8,0.99)]",
              "backdrop-blur-xl",
              "border border-[rgba(212,175,55,0.18)]",
              "shadow-[0_0_80px_rgba(212,175,55,0.12),0_30px_60px_-12px_rgba(0,0,0,0.9)]",
              "animate-in fade-in-0 zoom-in-95 duration-300",
              "relative",
            )}
          >
            {/* Top gold gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[rgba(212,175,55,0.08)] to-transparent pointer-events-none rounded-t-2xl" />

            {/* Hidden accessibility title */}
            <DialogPrimitive.Title className="sr-only">
              {t.pricing.choosePlan}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {t.pricing.subtitle}
            </DialogPrimitive.Description>

            {/* Close button — hidden when blockClose */}
            {!blockClose && (
              <button
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className={cn(
                  "absolute top-4 right-4 z-20",
                  "w-8 h-8 rounded-full",
                  "flex items-center justify-center",
                  "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]",
                  "text-[#a0a0a0] hover:text-white",
                  "transition-all duration-200",
                  "border border-[rgba(255,255,255,0.08)]",
                  isLoading && "opacity-50 cursor-not-allowed",
                )}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header */}
            <div className="relative pt-8 pb-4 px-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-[#d4af37] opacity-30 rounded-full scale-150 animate-pulse" />
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f0d060] to-[#d4af37] flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.5)]">
                    <Crown className="w-6 h-6 text-[#0a0a0a]" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#d4af37] via-[#f0d060] to-[#d4af37] bg-clip-text text-transparent font-display tracking-wide">
                {t.pricing.choosePlan}
              </h2>
              <p className="text-[#707070] text-sm mt-1">{t.pricing.subtitle}</p>
            </div>

            {/* Plan cards */}
            <div className="px-4 pb-6 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["premium", "diamond", "lifetime"] as PlanKey[]).map((planKey) => {
                  const plan = PLANS[planKey]
                  const Icon = PLAN_ICONS[planKey]
                  const isDiamond = planKey === "diamond"
                  const isLifetime = planKey === "lifetime"
                  const isThisLoading = loadingPlan === planKey

                  return (
                    <div
                      key={planKey}
                      className={cn(
                        "relative rounded-xl p-5 flex flex-col",
                        "border transition-all duration-300",
                        isDiamond
                          ? "border-[rgba(212,175,55,0.5)] bg-gradient-to-b from-[rgba(212,175,55,0.08)] to-[rgba(212,175,55,0.03)] shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]",
                      )}
                    >
                      {/* Popular badge */}
                      {isDiamond && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a]">
                            {t.pricing.popular}
                          </div>
                        </div>
                      )}

                      {/* Icon */}
                      <div className="flex justify-center mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isDiamond
                              ? "bg-gradient-to-br from-[#d4af37] to-[#f0d060] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                              : "bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5",
                              isDiamond ? "text-[#0a0a0a]" : "text-[#d4af37]",
                            )}
                          />
                        </div>
                      </div>

                      {/* Plan name */}
                      <h3
                        className={cn(
                          "text-center font-bold text-lg mb-1",
                          isDiamond ? "text-[#d4af37]" : "text-[#f5f5f5]",
                        )}
                      >
                        {plan.name}
                      </h3>

                      {/* Price */}
                      <div className="text-center mb-1">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-[#707070] text-sm ml-1">
                          {isLifetime ? t.pricing.oneTime : plan.period}
                        </span>
                      </div>

                      {/* Trial badge */}
                      {plan.trial > 0 && (
                        <div className="text-center mb-3">
                          <span className="text-xs text-[#d4af37] bg-[rgba(212,175,55,0.1)] px-2 py-0.5 rounded-full border border-[rgba(212,175,55,0.2)]">
                            {plan.trial} days free
                          </span>
                        </div>
                      )}

                      {/* Features */}
                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-[#d4af37]" />
                            </div>
                            <span className="text-xs text-[#c0c0c0]">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <button
                        onClick={() => handleSelectPlan(planKey)}
                        disabled={isLoading}
                        className={cn(
                          "w-full py-3 px-4 rounded-xl font-semibold text-sm",
                          "relative overflow-hidden",
                          "transition-all duration-200",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          isDiamond
                            ? "bg-gradient-to-r from-[#d4af37] via-[#f0d060] to-[#d4af37] text-[#0a0a0a] shadow-[0_4px_16px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_24px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-[rgba(212,175,55,0.12)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-[0.98]",
                        )}
                      >
                        {/* Shimmer for diamond */}
                        {isDiamond && (
                          <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                          </span>
                        )}
                        <span className="relative flex items-center justify-center gap-1.5">
                          {isThisLoading ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              {t.pricing.redirecting}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              {isLifetime ? t.pricing.buyForever : t.pricing.startTrial}
                            </>
                          )}
                        </span>
                      </button>

                      {/* Trial note under subscription buttons */}
                      {plan.trial > 0 && (
                        <p className="text-center text-[10px] text-[#505050] mt-2">
                          {t.pricing.trialNote}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 text-center">
              {!blockClose && (
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="text-sm text-[#606060] hover:text-[#a0a0a0] transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  {t.pricing.maybeLater}
                </button>
              )}
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[rgba(212,175,55,0.25)]" />
                ))}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
