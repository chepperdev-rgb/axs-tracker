export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { maxNetworkRetries: 0 })
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[stripe/webhook] Processing: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan ?? 'premium'

        if (!userId) {
          console.error('[stripe/webhook] checkout: missing userId')
          break
        }

        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string'
            ? session.subscription : session.subscription.id

          // Fetch subscription via raw API (SDK may fail on Vercel)
          const sub = await stripeGet(`/subscriptions/${subId}`)

          await db.update(users).set({
            plan,
            stripeSubscriptionId: subId,
            subscriptionStatus: sub.status || 'trialing',
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            updatedAt: new Date(),
          }).where(eq(users.id, userId))

          console.log(`[stripe/webhook] User ${userId} → ${plan}, status=${sub.status}`)
        } else if (session.mode === 'payment') {
          await db.update(users).set({
            plan: 'lifetime',
            subscriptionStatus: 'lifetime',
            updatedAt: new Date(),
          }).where(eq(users.id, userId))

          console.log(`[stripe/webhook] User ${userId} → lifetime`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        const plan = sub.metadata?.plan || 'premium'

        await db.update(users).set({
          plan: sub.status === 'canceled' ? 'free' : plan,
          subscriptionStatus: sub.status,
          stripeSubscriptionId: sub.id,
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          updatedAt: new Date(),
        }).where(eq(users.stripeCustomerId, customerId))

        console.log(`[stripe/webhook] Subscription updated: ${customerId} → ${sub.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

        await db.update(users).set({
          plan: 'free',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          trialEnd: null,
          currentPeriodEnd: null,
          updatedAt: new Date(),
        }).where(eq(users.stripeCustomerId, customerId))

        console.log(`[stripe/webhook] Subscription deleted: ${customerId} → free`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) {
          console.warn('[stripe/webhook] invoice.paid: no customerId')
          break
        }

        // Extract current_period_end from the first line item
        const lineItem = (invoice as any).lines?.data?.[0]
        const periodEnd = lineItem?.period?.end

        await db.update(users).set({
          subscriptionStatus: 'active',
          ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
          updatedAt: new Date(),
        }).where(eq(users.stripeCustomerId, customerId))

        console.log(`[stripe/webhook] Invoice paid: ${customerId} → active, period_end=${periodEnd}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        if (!customerId) {
          console.warn('[stripe/webhook] invoice.payment_failed: no customerId')
          break
        }

        await db.update(users).set({
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        }).where(eq(users.stripeCustomerId, customerId))

        console.log(`[stripe/webhook] Payment failed: ${customerId} → past_due`)
        break
      }

      default:
        console.log(`[stripe/webhook] Unhandled: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe/webhook] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
