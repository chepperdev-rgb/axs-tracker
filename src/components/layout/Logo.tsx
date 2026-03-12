'use client'

import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'default' | 'lg'
}

export function Logo({ size = 'default' }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    default: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  }

  return (
    <Link href="/dashboard" className="flex items-center gap-3 group">
      {/* Gold ring with AXS text */}
      <div
        className={`
          ${sizes[size]}
          rounded-full
          border-2 border-[#d4af37]
          flex items-center justify-center
          font-semibold text-[#d4af37]
          transition-shadow duration-300
          group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]
        `}
      >
        AXS
      </div>

      {/* Brand text */}
      <div className="flex flex-col">
        <span className="text-[10px] text-[#707070] tracking-[0.2em] uppercase font-semibold">
          LUXURY
        </span>
        <span className="text-lg text-[#f5f5f5] font-semibold -mt-1">
          Tracker
        </span>
      </div>
    </Link>
  )
}
