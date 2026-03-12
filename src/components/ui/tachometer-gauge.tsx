'use client'

import dynamic from 'next/dynamic'
import { Transition } from 'react-d3-speedometer'
import { cn } from '@/lib/utils'

// Dynamic import for SSR compatibility
const ReactSpeedometer = dynamic(() => import('react-d3-speedometer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center">
      <div className="animate-pulse bg-[#2a2a2a] rounded-full w-32 h-16" />
    </div>
  )
})

interface TachometerGaugeProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export function TachometerGauge({
  percentage,
  size = 'md',
  label,
  className
}: TachometerGaugeProps) {
  // Size configurations
  const sizes = {
    sm: { width: 140, height: 90, ringWidth: 15, labelSize: 10 },
    md: { width: 200, height: 130, ringWidth: 20, labelSize: 12 },
    lg: { width: 260, height: 170, ringWidth: 25, labelSize: 14 }
  }

  const config = sizes[size]
  const value = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <ReactSpeedometer
        value={value}
        minValue={0}
        maxValue={100}
        segments={5}
        width={config.width}
        height={config.height}
        ringWidth={config.ringWidth}
        needleColor="#f0d060"
        needleHeightRatio={0.7}
        needleTransitionDuration={1000}
        needleTransition={Transition.easeElasticOut}
        currentValueText={`${Math.round(value)}%`}
        currentValuePlaceholderStyle="#{value}"
        textColor="#f5f5f5"
        valueTextFontSize={size === 'lg' ? '22px' : size === 'md' ? '18px' : '14px'}
        labelFontSize="0px"
        segmentColors={[
          '#3a3a3a',
          '#5a4a2a',
          '#8a6a2a',
          '#b8942a',
          '#d4af37'
        ]}
        customSegmentStops={[0, 20, 40, 60, 80, 100]}
        paddingHorizontal={0}
        paddingVertical={0}
      />
      {label && (
        <div
          className="text-[#a0a0a0] uppercase tracking-wider text-center -mt-2"
          style={{ fontSize: config.labelSize }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// Full circle gauge with gold styling
interface CircularGaugeProps {
  percentage: number
  size?: number
  label?: string
  className?: string
}

export function CircularGauge({
  percentage,
  size = 80,
  label,
  className
}: CircularGaugeProps) {
  const value = Math.min(100, Math.max(0, percentage))
  const strokeWidth = size * 0.12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (circumference * value) / 100

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle with gradient */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#circularGoldGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.5))'
            }}
          />
          <defs>
            <linearGradient id="circularGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6a2a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f0d060" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-[#d4af37] font-mono"
            style={{ fontSize: size * 0.22 }}
          >
            {Math.round(value)}%
          </span>
        </div>
      </div>
      {label && (
        <div
          className="text-[#a0a0a0] uppercase tracking-wider text-center mt-1"
          style={{ fontSize: Math.max(9, size * 0.12) }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

// Horizontal tachometer bar with proper styling
interface TachometerBarProps {
  percentage: number
  height?: number
  label?: string
  showValue?: boolean
  className?: string
}

export function TachometerBar({
  percentage,
  height = 32,
  label,
  showValue = true,
  className
}: TachometerBarProps) {
  const value = Math.min(100, Math.max(0, percentage))

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[#a0a0a0] uppercase tracking-wider font-medium">{label}</span>
          {showValue && (
            <span className="text-sm font-bold text-[#d4af37] font-mono">
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {/* Background track */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #1a1a1a, #2a2a2a)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {/* Tick marks */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-0.5 h-3 bg-[#404040] rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Progress fill with gradient */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full overflow-hidden transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
          }}
        >
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(90deg, #8a6a2a 0%, #d4af37 50%, #f0d060 100%)',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          />
        </div>

        {/* Needle indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-10"
          style={{
            left: `calc(${value}% - 2px)`,
          }}
        >
          {/* Needle body */}
          <div
            className="relative"
            style={{
              width: 0,
              height: 0,
              borderTop: `${height / 2 + 6}px solid transparent`,
              borderBottom: `${height / 2 + 6}px solid transparent`,
              borderLeft: `12px solid #f0d060`,
              filter: 'drop-shadow(0 0 6px rgba(240, 208, 96, 0.8))'
            }}
          />
        </div>

        {/* Center glow effect at progress end */}
        <div
          className="absolute top-0 bottom-0 w-4 transition-all duration-700 ease-out pointer-events-none"
          style={{
            left: `calc(${value}% - 8px)`,
            background: 'radial-gradient(circle, rgba(240, 208, 96, 0.6) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  )
}
