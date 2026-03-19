import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  })
  return res.json()
}

/**
 * POST /api/stripe/verify
 * Called after Stripe Checkout redirect with session_id.
 * Verifies the session and activates the plan immediately.
 * This is a safety net — webhook should also handle this.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    // Fetch checkout session from Stripe
    const session = await stripeGet(`/checkout/sessions/${sessionId}`)

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 400 })
    }

    // Verify this session belongs to this user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 })
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const plan = session.metadata?.plan ?? 'premium'

    if (session.mode === 'subscription' && session.subscription) {
      const subId = typeof session.subscription === 'string'
        ? session.subscription : session.subscription.id

      const sub = await stripeGet(`/subscriptions/${subId}`)

      await db.update(users).set({
        plan,
        stripeSubscriptionId: subId,
        subscriptionStatus: sub.status || 'trialing',
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id))

      return NextResponse.json({ plan, status: sub.status })
    } else if (session.mode === 'payment') {
      await db.update(users).set({
        plan: 'lifetime',
        subscriptionStatus: 'lifetime',
        updatedAt: new Date(),
      }).where(eq(users.id, user.id))

      return NextResponse.json({ plan: 'lifetime', status: 'lifetime' })
    }

    return NextResponse.json({ error: 'Unknown session mode' }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[stripe/verify] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
