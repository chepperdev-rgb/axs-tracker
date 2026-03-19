import Stripe from 'stripe'

/**
 * Singleton Stripe client configured with the secret key.
 * Used exclusively in server-side code (API routes, server actions).
 * Never import this in client components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  maxNetworkRetries: 3,
  timeout: 30000,
})
