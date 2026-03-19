export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Resolves a plan name from a Stripe subscription's price metadata or items.
 *
 * @param subscription - Stripe subscription object
 * @returns plan string: 'premium' | 'diamond' | 'free'
 */
function resolvePlanFromSubscription(subscription: Stripe.Subscription): string {
  const item = subscription.items.data[0]
  if (!item) return 'free'

  const priceMeta = item.price.metadata?.plan
  if (priceMeta) return priceMeta

  const subMeta = subscription.metadata?.plan
  if (subMeta) return subMeta

  return 'premium'
}

/**
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events.
 * No authentication — Stripe signs the payload and we verify the signature.
 *
 * Handled events:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // Read raw body for signature verification
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  // If the secret is a placeholder, skip verification in development
  if (!webhookSecret || webhookSecret === 'whsec_placeholder') {
    try {
      event = JSON.parse(body) as Stripe.Event
      console.warn('[stripe/webhook] Signature verification skipped — placeholder secret')
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[stripe/webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  console.log(`[stripe/webhook] Processing event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      }
      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe/webhook] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

/**
 * Handles checkout.session.completed events.
 * Sets plan, subscription ID, status, and trial_end on the user record.
 *
 * @param session - The completed Stripe Checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId
  const plan = session.metadata?.plan ?? 'premium'

  if (!userId) {
    console.error('[stripe/webhook] checkout.session.completed: missing userId in metadata')
    return
  }

  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id

    // Fetch full subscription to get trial_end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await db
      .update(users)
      .set({
        plan,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        currentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    console.log(
      `[stripe/webhook] User ${userId} subscription activated: plan=${plan}, status=${subscription.status}`,
    )
  } else if (session.mode === 'payment') {
    // One-time payment = lifetime
    await db
      .update(users)
      .set({
        plan: 'lifetime',
        subscriptionStatus: 'lifetime',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    console.log(`[stripe/webhook] User ${userId} upgraded to lifetime`)
  }
}

/**
 * Handles customer.subscription.updated events.
 * Finds user by stripe_customer_id and updates subscription fields.
 *
 * @param subscription - Updated Stripe subscription
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const plan = resolvePlanFromSubscription(subscription)

  await db
    .update(users)
    .set({
      plan: subscription.status === 'canceled' ? 'free' : plan,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId))

  console.log(
    `[stripe/webhook] Subscription updated for customer ${customerId}: status=${subscription.status}`,
  )
}

/**
 * Handles customer.subscription.deleted events.
 * Reverts user to free plan.
 *
 * @param subscription - Deleted Stripe subscription
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  await db
    .update(users)
    .set({
      plan: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      trialEnd: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, customerId))

  console.log(
    `[stripe/webhook] Subscription canceled for customer ${customerId}: reverted to free`,
  )
}

/**
 * Handles invoice.payment_failed events.
 * Marks the user's subscription as past_due.
 *
 * @param invoice - Failed Stripe invoice
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  if (!customerId) {
    console.warn('[stripe/webhook] invoice.payment_failed: missing customerId, skipping')
    return
  }

  await db
    .update(users)
    .set({ subscriptionStatus: 'past_due', updatedAt: new Date() })
    .where(eq(users.stripeCustomerId, customerId))

  console.log(`[stripe/webhook] Payment failed for customer ${customerId}: marked past_due`)
}
