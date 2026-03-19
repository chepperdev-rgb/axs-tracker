import Stripe from 'stripe'

/**
 * Singleton Stripe client configured with the secret key.
 * Uses default Node HTTP client with extended timeout.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 3,
  timeout: 30000,
})
