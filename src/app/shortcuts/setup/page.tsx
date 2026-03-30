'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SetupContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axs-tracker.vercel.app'
  const syncUrl = `${baseUrl}/api/health/sync?user_token=${token}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#d4af37] mb-2">AXS Steps Sync</h1>
          <p className="text-sm text-[#707070]">
            Set up automatic step syncing from Apple Health
          </p>
        </div>

        {token ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]">
              <p className="text-xs text-[#a0a0a0] mb-3">
                Create a new Shortcut on your iPhone with these actions:
              </p>
              <ol className="space-y-3 text-sm text-[#f5f5f5]">
                <li className="flex gap-3">
                  <span className="text-[#d4af37] font-bold">1.</span>
                  <span>Add <strong>Find Health Samples</strong> — Type: Step Count, Period: Today</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#d4af37] font-bold">2.</span>
                  <span>Add <strong>Format Date</strong> — format: <code className="text-xs bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded">yyyy-MM-dd</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#d4af37] font-bold">3.</span>
                  <div>
                    <span>Add <strong>Get Contents of URL</strong>:</span>
                    <div className="mt-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-xs font-mono break-all">
                      POST {syncUrl}
                    </div>
                    <div className="mt-1 p-2 rounded bg-[rgba(0,0,0,0.3)] text-xs font-mono">
                      {`{ "date": <date>, "steps": <steps>, "source": "shortcuts" }`}
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <p className="text-[10px] text-[#505050] text-center">
              Your personal token is embedded in the URL above. Do not share this link.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-center">
            <p className="text-sm text-[#e74c3c]">
              Missing token. Go to Settings in AXS Tracker and tap &quot;Get Shortcut Link&quot;.
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
