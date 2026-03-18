'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

// ─── Animated Circular Gauge ────────────────────────────────────────
function AnimatedGauge({
  targetPercent,
  size,
  label,
  delay,
  strokeColor = 'url(#gaugeGold)',
}: {
  targetPercent: number
  size: number
  label: string
  delay: number
  strokeColor?: string
}) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const strokeWidth = size * 0.09
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (circumference * progress) / 100

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay)
    const animTimer = setTimeout(() => {
      const duration = 1800
      const start = performance.now()
      const animate = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        setProgress(eased * targetPercent)
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, delay + 300)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(animTimer)
    }
  }, [targetPercent, delay])

  return (
    <div
      className="flex flex-col items-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="gaugeGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6a2a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#f0d060" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-[#d4af37] font-mono"
            style={{
              fontSize: size * 0.2,
              textShadow: '0 0 20px rgba(212,175,55,0.4)',
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <span
        className="text-[#a0a0a0] uppercase tracking-[0.15em] text-center mt-2 font-medium"
        style={{ fontSize: Math.max(10, size * 0.1) }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Tachometer (half-circle speedometer) ───────────────────────────
function AnimatedTachometer({ delay }: { delay: number }) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay)

    // Looping animation: 0 → 95 (into red zone) → 45 → 95 → 45 ...
    const startTimer = setTimeout(() => {
      let phase: 'initial' | 'up' | 'down' = 'initial'
      let start = performance.now()
      const durations = { initial: 2400, up: 2800, down: 2000 }
      const targets = { initial: [0, 95], up: [45, 95], down: [95, 45] }

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      const animate = (now: number) => {
        const elapsed = now - start
        const dur = durations[phase]
        const t = Math.min(elapsed / dur, 1)
        const eased = easeInOutCubic(t)
        const [from, to] = targets[phase]
        const val = from + (to - from) * eased
        setProgress(val)

        if (t >= 1) {
          // Switch phase
          if (phase === 'initial' || phase === 'up') {
            phase = 'down'
          } else {
            phase = 'up'
          }
          start = performance.now()
        }
        rafRef.current = requestAnimationFrame(animate)
      }
      rafRef.current = requestAnimationFrame(animate)
    }, delay + 400)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(startTimer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [delay])

  const needleAngle = -135 + (progress / 100) * 270
  const w = 280
  const cx = w / 2
  const cy = w / 2
  // Red zone starts at 80%
  const inRedZone = progress >= 80

  // Arc color: gold for 0-80%, transitions to red for 80-100%
  const getTickColor = (tickPercent: number) => {
    if (tickPercent > progress) return '#3a3a3a'
    if (tickPercent >= 80) return '#e74c3c'
    return '#d4af37'
  }

  const getNumberColor = (num: number) => {
    if (num > progress) return '#505050'
    if (num >= 80) return '#e74c3c'
    return '#d4af37'
  }

  return (
    <div
      className="relative"
      style={{
        width: w,
        height: w / 2 + 40,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <svg
        width={w}
        height={w / 2 + 40}
        viewBox={`0 ${cy - cy} ${w} ${cy + 40}`}
        className="drop-shadow-[0_0_60px_rgba(212,175,55,0.25)]"
        style={{
          filter: inRedZone
            ? `drop-shadow(0 0 40px rgba(231,76,60,${0.15 + (progress - 80) * 0.015}))`
            : 'drop-shadow(0 0 60px rgba(212,175,55,0.25))',
          transition: 'filter 0.5s',
        }}
      >
        <defs>
          <linearGradient id="tachGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8a6a2a" />
            <stop offset="70%" stopColor="#f0d060" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
          <linearGradient id="tachRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="40%" stopColor="#e67e22" />
            <stop offset="100%" stopColor="#e74c3c" />
          </linearGradient>
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={inRedZone ? '#ff6b6b' : '#f0d060'} />
            <stop offset="100%" stopColor={inRedZone ? '#c0392b' : '#b8942e'} />
          </linearGradient>
          <filter id="tachGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={130} fill="none" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={122} fill="none" stroke="#1c1c1c" strokeWidth="1" />

        {/* Background arc */}
        <path
          d={`M ${cx - 110} ${cy + 55} A 110 110 0 1 1 ${cx + 110} ${cy + 55}`}
          fill="none" stroke="#1c1c1c" strokeWidth="18" strokeLinecap="round"
        />

        {/* Red zone background (80-100%) — always visible */}
        {(() => {
          const startAngle = -135 + 0.8 * 270
          const endAngle = -135 + 270
          const r = 110
          const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180)
          const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180)
          const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180)
          const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180)
          return (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
              fill="none" stroke="#3a1515" strokeWidth="18" strokeLinecap="round"
            />
          )
        })()}

        {/* Progress arc — gold portion (0 to min(progress, 80)) */}
        <path
          d={`M ${cx - 110} ${cy + 55} A 110 110 0 1 1 ${cx + 110} ${cy + 55}`}
          fill="none" stroke="url(#tachGold)" strokeWidth="18" strokeLinecap="round"
          strokeDasharray="480"
          strokeDashoffset={480 - (Math.min(progress, 80) / 100) * 480}
          filter="url(#tachGlow)"
        />

        {/* Progress arc — red portion (80 to progress if > 80) */}
        {progress > 80 && (() => {
          const startAngle = -135 + 0.8 * 270
          const sweepFraction = (progress - 80) / 100
          const totalArc = 480
          const r = 110
          const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180)
          const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180)
          return (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${cx + 110} ${cy + 55}`}
              fill="none" stroke="url(#tachRed)" strokeWidth="18" strokeLinecap="round"
              strokeDasharray={totalArc}
              strokeDashoffset={totalArc - sweepFraction * totalArc}
              filter="url(#tachGlow)"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          )
        })()}

        {/* Tick marks */}
        {[...Array(11)].map((_, i) => {
          const angle = -135 + i * 27
          const rad = (angle * Math.PI) / 180
          const r1 = 90, r2 = 102
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
              x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
              stroke={getTickColor(i * 10)} strokeWidth={i % 5 === 0 ? 3 : 2}
              style={{ transition: 'stroke 0.3s' }}
            />
          )
        })}

        {/* Numbers */}
        {[0, 20, 40, 60, 80, 100].map((num, i) => {
          const angle = -135 + i * 54
          const rad = (angle * Math.PI) / 180
          const r = 76
          return (
            <text key={num}
              x={cx + r * Math.cos(rad)} y={cy + r * Math.sin(rad)}
              fill={getNumberColor(num)}
              fontSize="12" fontWeight="bold" textAnchor="middle" dominantBaseline="middle"
              fontFamily="system-ui" style={{ transition: 'fill 0.3s' }}
            >{num}</text>
          )
        })}

        {/* Center hub */}
        <circle cx={cx} cy={cy} r={20} fill="#1a1a1a"
          stroke={inRedZone ? '#e74c3c' : '#d4af37'} strokeWidth="2"
          style={{ transition: 'stroke 0.5s' }}
        />
        <circle cx={cx} cy={cy} r={14} fill="#1c1c1c" />

        {/* Needle */}
        <g
          filter="url(#tachGlow)"
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.05s linear',
          }}
        >
          <polygon
            points={`${cx},${cy - 85} ${cx - 4},${cy - 5} ${cx},${cy + 5} ${cx + 4},${cy - 5}`}
            fill="url(#needleGrad)"
          />
          <circle cx={cx} cy={cy} r={8}
            fill={inRedZone ? '#e74c3c' : '#d4af37'}
            style={{ transition: 'fill 0.3s' }}
          />
        </g>
      </svg>

      {/* Text inside the gauge arc, upper area */}
      <div className="absolute left-0 right-0 flex flex-col items-center" style={{ top: 20 }}>
        <span
          className="text-4xl font-bold font-mono tabular-nums"
          style={{
            color: inRedZone ? '#e74c3c' : '#d4af37',
            textShadow: inRedZone
              ? '0 0 25px rgba(231,76,60,0.5)'
              : '0 0 25px rgba(212,175,55,0.5)',
            transition: 'color 0.5s, text-shadow 0.5s',
          }}
        >
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-[#707070] uppercase tracking-[0.2em] mt-0.5">
          Productivity
        </span>
      </div>
    </div>
  )
}

// ─── Animated Text Line ─────────────────────────────────────────────
function MotionText({
  children,
  delay,
  className = '',
}: {
  children: React.ReactNode
  delay: number
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        filter: visible ? 'blur(0px)' : 'blur(8px)',
        transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Floating particle ──────────────────────────────────────────────
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(212, 175, 55, ${0.15 + Math.random() * 0.25})`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      <Particles />

      {/* ── Background glows ────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-[#d4af37]/[0.03] blur-[100px]" />
      </div>

      {/* ── Header ──────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <MotionText delay={100}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] font-semibold text-sm shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              AXS
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-[#707070] tracking-[0.2em] uppercase font-semibold">LUXURY</span>
              <span className="text-base text-[#f5f5f5] font-semibold -mt-0.5">Tracker</span>
            </div>
          </div>
        </MotionText>

        <MotionText delay={200}>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-sm text-[#a0a0a0] hover:text-[#d4af37] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-luxury px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        </MotionText>
      </header>

      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center pt-8 md:pt-16 pb-12 px-6">

        {/* Main heading */}
        <MotionText delay={400} className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
            <span className="text-[#f5f5f5]">Track Your </span>
            <span className="text-gold-gradient">Habits</span>
          </h1>
        </MotionText>

        <MotionText delay={600} className="text-center mt-2">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
            <span className="text-[#f5f5f5]">Improve Your </span>
            <span className="text-gold-gradient gold-text-pulse">Productivity</span>
          </h1>
        </MotionText>

        <MotionText delay={900} className="text-center mt-6 max-w-xl">
          <p className="text-[#707070] text-lg md:text-xl leading-relaxed">
            Beautiful gauges. Real-time progress. A premium experience
            designed to keep you moving forward — every single day.
          </p>
        </MotionText>

        <MotionText delay={1100} className="mt-8 flex gap-4 items-center">
          <Link
            href="/register"
            className="btn-luxury px-8 py-3.5 rounded-xl text-base font-semibold"
          >
            Start Free
          </Link>
          <Link
            href="/login"
            className="btn-glass px-8 py-3.5 rounded-xl text-base font-semibold"
          >
            Sign In
          </Link>
        </MotionText>

        {/* ── Gauges Row ────────────────────────────────── */}
        <div className="mt-16 md:mt-24 flex flex-col items-center gap-12 w-full max-w-5xl">

          {/* Central tachometer */}
          <AnimatedTachometer delay={1300} />

          {/* Circular gauges row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-14">
            <AnimatedGauge targetPercent={92} size={120} label="Fitness" delay={1600} />
            <AnimatedGauge targetPercent={78} size={120} label="Mindfulness" delay={1800} />
            <AnimatedGauge targetPercent={95} size={120} label="Learning" delay={2000} />
            <AnimatedGauge targetPercent={64} size={120} label="Nutrition" delay={2200} />
            <AnimatedGauge targetPercent={88} size={120} label="Sleep" delay={2400} />
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <MotionText delay={2600} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#f5f5f5]">
              Why <span className="text-gold-gradient">AXS</span>?
            </h2>
          </MotionText>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Visual Progress',
                desc: 'Stunning gauges and charts that make tracking feel rewarding, not tedious.',
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                  </svg>
                ),
                delay: 2700,
              },
              {
                title: 'Daily Rituals',
                desc: 'Build powerful routines with smart reminders and streak tracking.',
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                delay: 2900,
              },
              {
                title: 'Premium Design',
                desc: 'Dark luxury interface with gold accents. Every pixel crafted for elegance.',
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                delay: 3100,
              },
            ].map((f) => (
              <MotionText key={f.title} delay={f.delay}>
                <div className="glass-card rounded-2xl p-8 h-full hover:scale-[1.02] transition-transform duration-300">
                  <div className="w-14 h-14 rounded-xl bg-[#d4af37]/10 flex items-center justify-center mb-5">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">{f.title}</h3>
                  <p className="text-[#707070] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </MotionText>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────── */}
      <section className="relative z-10 py-20 px-6">
        <MotionText delay={3300} className="text-center">
          <div className="max-w-2xl mx-auto glass-card rounded-3xl p-12 border-glow-pulse">
            <h2 className="text-3xl md:text-4xl font-bold text-[#f5f5f5] mb-4">
              Ready to <span className="text-gold-gradient">level up</span>?
            </h2>
            <p className="text-[#707070] mb-8 text-lg">
              Join thousands of high-performers who track their habits with AXS.
            </p>
            <Link
              href="/register"
              className="btn-luxury px-10 py-4 rounded-xl text-lg font-semibold inline-block"
            >
              Start Tracking Now
            </Link>
          </div>
        </MotionText>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#1c1c1c] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[#505050] text-sm">
          <span>AXS Tracker</span>
          <span>Premium Habit Tracking</span>
        </div>
      </footer>

      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50" />
    </div>
  )
}
