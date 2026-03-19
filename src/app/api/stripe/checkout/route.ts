import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PLANS } from '@/lib/stripe-prices'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

const CheckoutBodySchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(['subscription', 'payment']),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = CheckoutBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { priceId, mode } = parsed.data
    const plan = Object.entries(PLANS).find(([, p]) => p.priceId === priceId)?.[0] ?? 'premium'

    // Ensure user exists in DB
    await db.insert(users).values({ id: authUser.id, email: authUser.email! }).onConflictDoNothing()

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or reuse Stripe customer
    let customerId = dbUser.stripeCustomerId

    if (!customerId) {
      const customer = await stripePost('/customers', {
        email: authUser.email ?? dbUser.email,
        'metadata[userId]': authUser.id,
      })
      customerId = customer.id
      await db.update(users).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(users.id, authUser.id))
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    // Build checkout session params
    const params: Record<string, string> = {
      customer: customerId,
      mode,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard`,
      'metadata[userId]': authUser.id,
      'metadata[plan]': plan,
    }

    if (mode === 'subscription') {
      params['subscription_data[trial_period_days]'] = '3'
      params['subscription_data[metadata][userId]'] = authUser.id
      params['subscription_data[metadata][plan]'] = plan
    }

    const session = await stripePost('/checkout/sessions', params)

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[stripe/checkout] error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
