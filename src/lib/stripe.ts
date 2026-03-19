import Stripe from 'stripe'

/**
 * Singleton Stripe client configured with the secret key.
 * Uses fetch-based HTTP client for Vercel Edge/Serverless compatibility.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  maxNetworkRetries: 3,
  timeout: 30000,
  httpClient: Stripe.createFetchHttpClient(),
})
