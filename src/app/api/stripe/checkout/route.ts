import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/stripe-prices'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

const CheckoutBodySchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(['subscription', 'payment']),
})

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the authenticated user.
 * Creates or reuses a Stripe customer linked to the user's record.
 *
 * @returns { url: string } - Stripe Checkout URL to redirect the user to
 * @throws 401 if user is not authenticated
 * @throws 400 if request body is invalid
 * @throws 500 on Stripe or database errors
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = CheckoutBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { priceId, mode } = parsed.data

    // Determine which plan this price belongs to
    const plan =
      Object.entries(PLANS).find(([, p]) => p.priceId === priceId)?.[0] ?? 'premium'

    // Ensure user exists in DB (may not exist yet if paywall blocks first load)
    await db
      .insert(users)
      .values({ id: authUser.id, email: authUser.email! })
      .onConflictDoNothing()

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or reuse Stripe customer
    let customerId = dbUser.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authUser.email ?? dbUser.email,
        metadata: { userId: authUser.id },
      })
      customerId = customer.id

      // Persist the new customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, authUser.id))
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard`,
      metadata: { userId: authUser.id, plan },
    }

    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        trial_period_days: 3,
        metadata: { userId: authUser.id, plan },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

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
