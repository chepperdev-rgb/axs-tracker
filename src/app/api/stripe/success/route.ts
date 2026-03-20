import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  })
  return res.json()
}

/**
 * GET /api/stripe/success?session_id=xxx
 *
 * PUBLIC endpoint (no auth required).
 * Called by Stripe success_url redirect.
 * Verifies checkout session, activates plan, redirects to dashboard.
 * Uses userId from Stripe session metadata (not from auth cookie).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  try {
    const session = await stripeGet(`/checkout/sessions/${sessionId}`)

    if (session.error) {
      console.error('[stripe/success] Stripe error:', session.error.message)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    const userId = session.metadata?.userId
    if (!userId) {
      console.error('[stripe/success] No userId in session metadata')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    const plan = session.metadata?.plan ?? 'premium'

    // Activate plan based on session mode
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
      }).where(eq(users.id, userId))

      console.log(`[stripe/success] User ${userId} → ${plan} (${sub.status})`)
    } else if (session.mode === 'payment') {
      await db.update(users).set({
        plan: 'lifetime',
        subscriptionStatus: 'lifetime',
        updatedAt: new Date(),
      }).where(eq(users.id, userId))

      console.log(`[stripe/success] User ${userId} → lifetime`)
    }
  } catch (error) {
    console.error('[stripe/success] Error:', error)
  }

  // Redirect to dashboard with session_id so PaymentModalTrigger can verify + show toast
  // session_id in URL also tells PaywallGuard to skip, and middleware to not block
  const dashUrl = new URL('/dashboard', req.url)
  dashUrl.searchParams.set('session_id', sessionId)
  return NextResponse.redirect(dashUrl)
}
