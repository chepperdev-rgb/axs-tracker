import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  
  // Test Stripe connection directly with fetch
  try {
    const res = await fetch('https://api.stripe.com/v1/prices/price_1TCUXkAsOomwt34iwlcVUrGB', {
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    })
    const data = await res.json()
    return NextResponse.json({
      hasKey: !!key,
      stripeStatus: res.status,
      priceActive: data.active,
      priceAmount: data.unit_amount,
      error: data.error?.message,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      hasKey: !!key,
      fetchError: msg,
    })
  }
}
