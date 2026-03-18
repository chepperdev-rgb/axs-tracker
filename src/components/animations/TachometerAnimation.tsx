'use client'

import { useEffect, useState } from 'react'

interface TachometerAnimationProps {
  onComplete: () => void
}

export default function TachometerAnimation({ onComplete }: TachometerAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Animate the needle from 0 to 100
    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)

      // Easing function for realistic acceleration feel
      const eased = easeOutExpo(newProgress / 100) * 100
      setProgress(eased)

      if (newProgress < 100) {
        requestAnimationFrame(animate)
      } else {
        setShowSuccess(true)
        setTimeout(onComplete, 1200)
      }
    }

    requestAnimationFrame(animate)
  }, [onComplete])

  // Easing function for smooth deceleration
  const easeOutExpo = (x: number): number => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
  }

  // Convert progress to needle angle (-135 to 135 degrees)
  const needleAngle = -135 + (progress / 100) * 270

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      {/* Glow effect behind gauge */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, rgba(212,175,55,${0.1 + progress * 0.002}) 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Main Tachometer */}
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          className="drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]"
        >
          {/* Outer ring */}
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
          />

          {/* Inner decorative ring */}
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="2"
          />

          {/* Background arc */}
          <path
            d="M 40 220 A 130 130 0 1 1 280 220"
            fill="none"
            stroke="#1c1c1c"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Progress arc - fills as registration completes */}
          <path
            d="M 40 220 A 130 130 0 1 1 280 220"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray="545"
            strokeDashoffset={545 - (progress / 100) * 545}
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#f0d060" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Tick marks */}
          {[...Array(11)].map((_, i) => {
            const angle = -135 + (i * 27)
            const radian = (angle * Math.PI) / 180
            const innerRadius = 105
            const outerRadius = 120
            const x1 = 160 + innerRadius * Math.cos(radian)
            const y1 = 160 + innerRadius * Math.sin(radian)
            const x2 = 160 + outerRadius * Math.cos(radian)
            const y2 = 160 + outerRadius * Math.sin(radian)

            const isActive = progress >= (i * 10)

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? '#d4af37' : '#3a3a3a'}
                strokeWidth={i % 5 === 0 ? 3 : 2}
                style={{ transition: 'stroke 0.3s ease' }}
              />
            )
          })}

          {/* Small tick marks */}
          {[...Array(51)].map((_, i) => {
            if (i % 5 === 0) return null
            const angle = -135 + (i * 5.4)
            const radian = (angle * Math.PI) / 180
            const innerRadius = 112
            const outerRadius = 118
            const x1 = 160 + innerRadius * Math.cos(radian)
            const y1 = 160 + innerRadius * Math.sin(radian)
            const x2 = 160 + outerRadius * Math.cos(radian)
            const y2 = 160 + outerRadius * Math.sin(radian)

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#2a2a2a"
                strokeWidth={1}
              />
            )
          })}

          {/* Numbers around the gauge */}
          {[0, 20, 40, 60, 80, 100].map((num, i) => {
            const angle = -135 + (i * 54)
            const radian = (angle * Math.PI) / 180
            const radius = 88
            const x = 160 + radius * Math.cos(radian)
            const y = 160 + radius * Math.sin(radian)
            const isActive = progress >= num

            return (
              <text
                key={num}
                x={x}
                y={y}
                fill={isActive ? '#d4af37' : '#606060'}
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="system-ui"
                style={{ transition: 'fill 0.3s ease' }}
              >
                {num}
              </text>
            )
          })}

          {/* Center hub */}
          <circle
            cx="160"
            cy="160"
            r="25"
            fill="#1a1a1a"
            stroke="#d4af37"
            strokeWidth="2"
          />

          <circle
            cx="160"
            cy="160"
            r="18"
            fill="url(#hubGradient)"
          />

          <defs>
            <radialGradient id="hubGradient">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
          </defs>

          {/* Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: '160px 160px',
              transition: 'transform 0.1s ease-out'
            }}
            filter="url(#glow)"
          >
            {/* Needle body */}
            <polygon
              points="160,50 155,155 160,165 165,155"
              fill="url(#needleGradient)"
            />
            {/* Needle center cap */}
            <circle
              cx="160"
              cy="160"
              r="10"
              fill="#d4af37"
            />
          </g>

          <defs>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0d060" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#b8942e" />
            </linearGradient>
          </defs>

          {/* Center diamond accent */}
          <polygon
            points="160,153 167,160 160,167 153,160"
            fill="#0a0a0a"
          />
        </svg>

      </div>

      {/* Success message */}
      <div
        className={`absolute bottom-20 text-center transition-all duration-500 ${
          showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #d4af37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(212,175,55,0.3)'
          }}
        >
          Welcome to AXS
        </h2>
        <p className="text-[#a0a0a0]">Your journey begins now</p>
      </div>

      {/* Bottom decorative line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
        style={{
          opacity: progress / 100,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  )
}
