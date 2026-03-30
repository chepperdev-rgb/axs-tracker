'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const ICLOUD_SHORTCUT_URL = 'https://www.icloud.com/shortcuts/PLACEHOLDER'

function SetupContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = token
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl mb-3">🏃</div>
          <h1 className="text-xl font-bold text-[#d4af37]">Connect Apple Health</h1>
          <p className="text-sm text-[#707070] mt-1">
            Sync steps automatically via Shortcuts
          </p>
        </div>

        {token ? (
          <div className="space-y-5">
            {/* Token display */}
            <div className="p-5 rounded-xl bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]">
              <p className="text-xs text-[#a0a0a0] mb-3 text-center">Your personal token</p>
              <div className="p-4 rounded-lg bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)] text-center">
                <code className="text-2xl font-mono font-bold text-[#f5f5f5] tracking-wider">
                  {token}
                </code>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    copied
                      ? 'bg-[rgba(34,197,94,0.15)] text-green-400 border border-[rgba(34,197,94,0.3)]'
                      : 'bg-[rgba(255,255,255,0.06)] text-[#a0a0a0] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Token
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Setup steps */}
            <div className="px-1">
              <p className="text-[10px] text-[#707070] uppercase tracking-[0.15em] mb-3 text-center font-semibold">
                Setup steps
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#d4af37]">1</span>
                  </div>
                  <p className="text-sm text-[#a0a0a0] pt-0.5">
                    Tap <span className="text-[#f5f5f5]">&quot;Copy Token&quot;</span> above
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#d4af37]">2</span>
                  </div>
                  <p className="text-sm text-[#a0a0a0] pt-0.5">
                    Tap <span className="text-[#f5f5f5]">&quot;Add to Shortcuts&quot;</span> below
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(212,175,55,0.15)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#d4af37]">3</span>
                  </div>
                  <p className="text-sm text-[#a0a0a0] pt-0.5">
                    When the shortcut runs, <span className="text-[#f5f5f5]">paste your token</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Add to Shortcuts button */}
            <a
              href={ICLOUD_SHORTCUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#d4af37] to-[#f0d060] text-[#0a0a0a] hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(212,175,55,0.25)]"
            >
              Add to Shortcuts
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>

            {/* Footer note */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#505050]">
              <svg className="w-3.5 h-3.5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Steps sync daily at 11 PM automatically
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-center">
            <p className="text-sm text-[#e74c3c]">
              Missing token. Go to Settings in AXS Tracker and tap &quot;Connect Apple Health&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShortcutsSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#707070] text-sm">Loading...</div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  )
}
