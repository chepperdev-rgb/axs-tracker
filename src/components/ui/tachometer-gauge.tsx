'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TachometerGaugeProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showPercentage?: boolean
  className?: string
}

export function TachometerGauge({
  percentage,
  size = 'md',
  label,
  showPercentage = true,
  className
}: TachometerGaugeProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(Math.min(100, Math.max(0, percentage)))
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  // Size configurations
  const sizes = {
    sm: { width: 120, strokeWidth: 12, fontSize: 16, labelSize: 10 },
    md: { width: 160, strokeWidth: 16, fontSize: 24, labelSize: 12 },
    lg: { width: 200, strokeWidth: 20, fontSize: 32, labelSize: 14 }
  }

  const config = sizes[size]
  const radius = (config.width - config.strokeWidth) / 2
  const centerX = config.width / 2
  const centerY = config.width / 2

  // Arc calculation (180 degrees - half circle)
  const startAngle = 180
  const endAngle = 0
  const angleRange = 180

  // Calculate arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const angleRad = ((angle - 90) * Math.PI) / 180
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    }
  }

  const describeArc = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(cx, cy, r, startA)
    const end = polarToCartesian(cx, cy, r, endA)
    const largeArcFlag = Math.abs(startA - endA) > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
  }

  // Progress arc
  const progressAngle = startAngle - (animatedPercentage / 100) * angleRange
  const backgroundArc = describeArc(centerX, centerY, radius, startAngle, endAngle)
  const progressArc = describeArc(centerX, centerY, radius, startAngle, Math.max(progressAngle, endAngle))

  // Needle calculation
  const needleAngle = startAngle - (animatedPercentage / 100) * angleRange
  const needleLength = radius - 10
  const needleEnd = polarToCartesian(centerX, centerY, needleLength, needleAngle)

  // Tick marks
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <svg
        width={config.width}
        height={config.width / 2 + 20}
        viewBox={`0 0 ${config.width} ${config.width / 2 + 20}`}
        className="overflow-visible"
      >
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`goldGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#f0d060" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {ticks.map((tick) => {
          const tickAngle = startAngle - (tick / 100) * angleRange
          const innerPoint = polarToCartesian(centerX, centerY, radius - config.strokeWidth / 2 - 8, tickAngle)
          const outerPoint = polarToCartesian(centerX, centerY, radius + config.strokeWidth / 2 + 4, tickAngle)
          return (
            <g key={tick}>
              <line
                x1={innerPoint.x}
                y1={innerPoint.y}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke="#505050"
                strokeWidth={2}
              />
            </g>
          )
        })}

        {/* Progress arc */}
        <path
          d={progressArc}
          fill="none"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${size})`}
          style={{
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />

        {/* Center pivot point */}
        <circle
          cx={centerX}
          cy={centerY}
          r={8}
          fill="#1c1c1c"
          stroke="#d4af37"
          strokeWidth={2}
        />

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${needleAngle - 90}deg)`,
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Needle body */}
          <polygon
            points={`
              ${centerX},${centerY - 6}
              ${centerX + needleLength},${centerY}
              ${centerX},${centerY + 6}
            `}
            fill="url(#goldGradient-${size})"
            filter={`url(#glow-${size})`}
          />
          {/* Needle tip (arrow) */}
          <polygon
            points={`
              ${centerX + needleLength - 5},${centerY - 4}
              ${centerX + needleLength + 8},${centerY}
              ${centerX + needleLength - 5},${centerY + 4}
            `}
            fill="#f0d060"
          />
        </g>

        {/* Center cap */}
        <circle
          cx={centerX}
          cy={centerY}
          r={5}
          fill="#d4af37"
        />
      </svg>

      {/* Percentage display */}
      {showPercentage && (
        <div
          className="absolute text-center"
          style={{
            bottom: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px'
          }}
        >
          <span
            className="font-bold text-white"
            style={{ fontSize: config.fontSize }}
          >
            {Math.round(animatedPercentage)}
          </span>
          <span
            className="text-[#d4af37] ml-0.5"
            style={{ fontSize: config.fontSize * 0.6 }}
          >
            %
          </span>
        </div>
      )}

      {/* Label */}
      {label && (
        <div
          className="text-[#a0a0a0] uppercase tracking-wider mt-2 text-center"
          style={{ fontSize: config.labelSize }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// Horizontal tachometer bar (alternative style)
interface TachometerBarProps {
  percentage: number
  height?: number
  label?: string
  showValue?: boolean
  className?: string
}

export function TachometerBar({
  percentage,
  height = 24,
  label,
  showValue = true,
  className
}: TachometerBarProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(Math.min(100, Math.max(0, percentage)))
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#a0a0a0] uppercase tracking-wider">{label}</span>
          {showValue && (
            <span className="text-sm font-bold text-white">
              {Math.round(animatedPercentage)}%
            </span>
          )}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {/* Background */}
        <div
          className="absolute inset-0 rounded-full bg-[#1c1c1c] border border-[#2a2a2a]"
          style={{ height }}
        />

        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div
              key={tick}
              className="w-0.5 bg-[#3a3a3a]"
              style={{ height: height * 0.6 }}
            />
          ))}
        </div>

        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 rounded-full overflow-hidden"
          style={{
            width: `${animatedPercentage}%`,
            height,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div
            className="h-full w-full bg-gradient-to-r from-[#d4af37] via-[#f0d060] to-[#d4af37]"
            style={{
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
            }}
          />
        </div>

        {/* Needle/Arrow indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          style={{
            left: `calc(${animatedPercentage}% - 6px)`,
            transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div
            className="relative"
            style={{
              width: 0,
              height: 0,
              borderTop: `${height / 2 + 4}px solid transparent`,
              borderBottom: `${height / 2 + 4}px solid transparent`,
              borderLeft: `${height / 2}px solid #f0d060`,
              filter: 'drop-shadow(0 0 4px rgba(240, 208, 96, 0.8))'
            }}
          />
        </div>
      </div>
    </div>
  )
}
