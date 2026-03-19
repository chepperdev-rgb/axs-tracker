/**
 * Stripe product + price setup script.
 * Run with: npx tsx scripts/setup-stripe.ts
 *
 * Creates:
 *   - Premium   $9.99/month  (recurring subscription)
 *   - Diamond   $19.99/month (recurring subscription)
 *   - Lifetime  $79.99       (one-time payment)
 *
 * Prints price IDs to paste into src/lib/stripe-prices.ts
 */

import Stripe from 'stripe'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  { apiVersion: '2026-02-25.clover' },
)

interface PlanDefinition {
  name: string
  description: string
  amountCents: number
  currency: 'usd'
  recurring: { interval: 'month' } | null
  metadata: Record<string, string>
}

const PLANS: PlanDefinition[] = [
  {
    name: 'AXS Premium',
    description: 'Unlimited habits, advanced analytics, priority support',
    amountCents: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'premium' },
  },
  {
    name: 'AXS Diamond',
    description: 'Everything in Premium plus AI insights, custom themes, team features',
    amountCents: 1999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'diamond' },
  },
  {
    name: 'AXS Lifetime',
    description: 'All features forever, all future updates, no recurring charges',
    amountCents: 7999,
    currency: 'usd',
    recurring: null,
    metadata: { plan: 'lifetime' },
  },
]

/**
 * Finds an existing active product by name, or creates a new one.
 *
 * @param name - Stripe product display name
 * @param description - Product description
 * @param metadata - Key-value metadata attached to the product
 * @returns The Stripe product object
 */
async function upsertProduct(
  name: string,
  description: string,
  metadata: Record<string, string>,
): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: `name:"${name}" AND active:"true"`,
  })

  if (existing.data.length > 0) {
    console.log(`  Product already exists: ${name} (${existing.data[0].id})`)
    return existing.data[0]
  }

  const product = await stripe.products.create({ name, description, metadata })
  console.log(`  Created product: ${name} (${product.id})`)
  return product
}

/**
 * Finds an existing price for the product, or creates a new one.
 *
 * @param productId - Stripe product ID
 * @param amountCents - Price in cents (e.g. 999 = $9.99)
 * @param currency - ISO currency code
 * @param recurring - Recurring interval or null for one-time
 * @param metadata - Key-value metadata
 * @returns The Stripe price object
 */
async function upsertPrice(
  productId: string,
  amountCents: number,
  currency: 'usd',
  recurring: { interval: 'month' } | null,
  metadata: Record<string, string>,
): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  })

  const match = existing.data.find(
    (p) =>
      p.unit_amount === amountCents &&
      p.currency === currency &&
      (recurring === null
        ? p.type === 'one_time'
        : p.type === 'recurring' && p.recurring?.interval === recurring.interval),
  )

  if (match) {
    console.log(`  Price already exists: ${match.id}`)
    return match
  }

  const priceData: Stripe.PriceCreateParams = {
    product: productId,
    unit_amount: amountCents,
    currency,
    metadata,
  }

  if (recurring !== null) {
    priceData.recurring = { interval: recurring.interval }
  }

  const price = await stripe.prices.create(priceData)
  console.log(`  Created price: ${price.id}`)
  return price
}

async function main(): Promise<void> {
  console.log('Setting up Stripe products and prices...\n')

  const results: Record<string, string> = {}

  for (const plan of PLANS) {
    console.log(`Processing plan: ${plan.name}`)

    const product = await upsertProduct(plan.name, plan.description, plan.metadata)
    const price = await upsertPrice(
      product.id,
      plan.amountCents,
      plan.currency,
      plan.recurring,
      plan.metadata,
    )

    const key = plan.metadata.plan
    results[key] = price.id
    console.log()
  }

  console.log('='.repeat(60))
  console.log('SUCCESS! Copy these price IDs into src/lib/stripe-prices.ts:')
  console.log('='.repeat(60))
  console.log()
  console.log(`premium priceId:  ${results.premium}`)
  console.log(`diamond priceId:  ${results.diamond}`)
  console.log(`lifetime priceId: ${results.lifetime}`)
  console.log()
  console.log('Paste them into the PLANS object in src/lib/stripe-prices.ts')
}

main().catch((err: unknown) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
