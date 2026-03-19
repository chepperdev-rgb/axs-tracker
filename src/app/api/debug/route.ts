import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return NextResponse.json({
    hasStripeKey: !!key,
    keyPrefix: key.substring(0, 15) || 'MISSING',
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    region: process.env.VERCEL_REGION || 'unknown',
  })
}
