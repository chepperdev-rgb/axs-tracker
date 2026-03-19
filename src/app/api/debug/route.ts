import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    origin: req.nextUrl.origin,
    stripeKey: process.env.STRIPE_SECRET_KEY ? 'present' : 'missing',
  })
}
