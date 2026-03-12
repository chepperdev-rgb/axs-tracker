"use client"

import * as React from "react"
import { Check, Crown, Sparkles, X, Zap, BarChart3, Download, HeadphonesIcon } from "lucide-react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartPremium?: () => void
  onMaybeLater?: () => void
}

const features = [
  {
    icon: Zap,
    title: "Unlimited Habits",
    titleRu: "Безлимитные привычки",
    description: "Track as many habits as you want",
    descriptionRu: "Отслеживайте сколько угодно привычек"
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    titleRu: "Детальная аналитика",
    description: "Deep insights into your progress",
    descriptionRu: "Глубокий анализ вашего прогресса"
  },
  {
    icon: Download,
    title: "Data Export",
    titleRu: "Экспорт данных",
    description: "Export your data anytime",
    descriptionRu: "Экспортируйте данные в любое время"
  },
  {
    icon: HeadphonesIcon,
    title: "Priority Support",
    titleRu: "Приоритетная поддержка",
    description: "Get help when you need it",
    descriptionRu: "Помощь когда она нужна"
  }
]

export function PaymentModal({
  open,
  onOpenChange,
  onStartPremium,
  onMaybeLater
}: PaymentModalProps) {
  const handleMaybeLater = () => {
    onMaybeLater?.()
    onOpenChange(false)
  }

  const handleStartPremium = () => {
    onStartPremium?.()
    // In the future, this would redirect to payment
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay with enhanced blur and gold tint */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/70 backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          style={{
            backgroundImage: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%)"
          }}
        />

        {/* Modal Content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50",
            "top-[50%] left-[50%]",
            "w-[calc(100%-2rem)] max-w-[440px]",
            "max-h-[calc(100vh-4rem)]",
            "translate-x-[-50%] translate-y-[-50%]",
            "overflow-y-auto rounded-2xl",
            // Glass morphism effect
            "bg-gradient-to-b from-[rgba(20,20,20,0.95)] to-[rgba(10,10,10,0.98)]",
            "backdrop-blur-xl",
            "border border-[rgba(212,175,55,0.2)]",
            "shadow-[0_0_60px_rgba(212,175,55,0.15),0_25px_50px_-12px_rgba(0,0,0,0.8)]",
            // Animation
            "payment-modal-enter",
            "data-[state=closed]:payment-modal-exit",
            "outline-none"
          )}
        >
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[rgba(212,175,55,0.1)] to-transparent pointer-events-none" />

          {/* Accessibility: Hidden title */}
          <DialogPrimitive.Title className="sr-only">
            Unlock Premium
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Premium subscription options for AXS Tracker
          </DialogPrimitive.Description>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "absolute top-4 right-4 z-10",
              "w-8 h-8 rounded-full",
              "flex items-center justify-center",
              "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)]",
              "text-[#a0a0a0] hover:text-white",
              "transition-all duration-200",
              "border border-[rgba(255,255,255,0.1)]"
            )}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative px-6 pt-8 pb-6 sm:px-8">
            {/* Crown icon with glow */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-[#d4af37] opacity-40 rounded-full scale-150 animate-pulse" />
                <div className={cn(
                  "relative w-16 h-16 rounded-full",
                  "bg-gradient-to-br from-[#d4af37] via-[#f0d060] to-[#d4af37]",
                  "flex items-center justify-center",
                  "shadow-[0_0_30px_rgba(212,175,55,0.5)]",
                  "crown-float"
                )}>
                  <Crown className="w-8 h-8 text-[#0a0a0a]" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <h2 className={cn(
                "text-2xl sm:text-3xl font-bold",
                "bg-gradient-to-r from-[#d4af37] via-[#f0d060] to-[#d4af37]",
                "bg-clip-text text-transparent",
                "font-display tracking-wide"
              )}>
                Unlock Premium
              </h2>
              <p className="text-[#a0a0a0] text-sm mt-1">
                Начните использовать AXS Tracker
              </p>
            </div>

            {/* Price with float animation */}
            <div className="flex justify-center my-6">
              <div className="price-float relative">
                <div className="absolute inset-0 bg-[rgba(212,175,55,0.1)] rounded-xl blur-xl" />
                <div className={cn(
                  "relative px-6 py-4 rounded-xl",
                  "bg-gradient-to-br from-[rgba(212,175,55,0.15)] to-[rgba(212,175,55,0.05)]",
                  "border border-[rgba(212,175,55,0.3)]"
                )}>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-[#d4af37] text-lg">$</span>
                    <span className="text-4xl font-bold text-white">9</span>
                    <span className="text-4xl font-bold text-white">.99</span>
                    <span className="text-[#a0a0a0] text-sm ml-1">/month</span>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs text-[#707070]">or $79.99/year (save 33%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    "bg-[rgba(255,255,255,0.02)]",
                    "border border-[rgba(255,255,255,0.05)]",
                    "feature-item-enter"
                  )}
                  style={{
                    animationDelay: `${150 + index * 100}ms`
                  }}
                >
                  {/* Gold checkmark */}
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full",
                    "bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[rgba(212,175,55,0.1)]",
                    "flex items-center justify-center",
                    "border border-[rgba(212,175,55,0.3)]"
                  )}>
                    <Check className="w-4 h-4 text-[#d4af37]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                      <span className="text-sm font-medium text-white truncate">
                        {feature.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] mt-0.5 truncate">
                      {feature.descriptionRu}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button with gold shimmer */}
            <button
              onClick={handleStartPremium}
              className={cn(
                "w-full py-4 px-6 rounded-xl",
                "relative overflow-hidden",
                "bg-gradient-to-r from-[#d4af37] via-[#f0d060] to-[#d4af37]",
                "text-[#0a0a0a] font-semibold text-lg",
                "shadow-[0_4px_20px_rgba(212,175,55,0.4)]",
                "hover:shadow-[0_6px_30px_rgba(212,175,55,0.6)]",
                "hover:scale-[1.02]",
                "active:scale-[0.98]",
                "transition-all duration-200",
                "premium-button-shimmer",
                "group"
              )}
            >
              {/* Shimmer effect overlay */}
              <span className="absolute inset-0 overflow-hidden rounded-xl">
                <span className={cn(
                  "absolute inset-0",
                  "bg-gradient-to-r from-transparent via-white/30 to-transparent",
                  "shimmer-sweep"
                )} />
              </span>

              <span className="relative flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Start Premium</span>
              </span>
            </button>

            {/* Maybe later link */}
            <button
              onClick={handleMaybeLater}
              className={cn(
                "w-full mt-4 py-2",
                "text-sm text-[#707070] hover:text-[#a0a0a0]",
                "transition-colors duration-200",
                "underline-offset-4 hover:underline"
              )}
            >
              Maybe later
            </button>

            {/* Bottom decorative elements */}
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[rgba(212,175,55,0.3)]"
                />
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
