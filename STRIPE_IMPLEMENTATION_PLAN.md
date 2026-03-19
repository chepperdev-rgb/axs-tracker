# Stripe Subscription Implementation Plan for AXS Tracker

**Date:** 2026-03-18
**Status:** Research complete, ready for implementation
**Sources:** Stripe official docs, Vercel subscription starter (7.7k stars), pedroalonso.net guides, r/nextjs discussions

---

## EXECUTIVE SUMMARY

- **Use Stripe Checkout (redirect mode)** -- the simplest, most battle-tested approach for your stack. Stripe hosts the payment page, handles PCI compliance, and supports trials natively.
- **Free trial = `subscription_data.trial_period_days: 3`** on the Checkout Session. Credit card collected upfront. Auto-charges on day 4.
- **Lifetime deal = Stripe Checkout in `mode: 'payment'`** (one-time), separate from subscriptions. Handled via a different Checkout Session.
- **Webhooks are the single source of truth** for subscription state. Never trust client-side state.
- **Stripe Customer Portal** handles cancellation, payment method updates, and invoice history -- no custom UI needed.

---

## KEY ARCHITECTURAL DECISIONS

### 1. Stripe Checkout (redirect) vs Stripe Elements (embedded)

**Recommendation: Stripe Checkout (redirect)**

| Factor | Checkout (redirect) | Elements (embedded) |
|--------|---------------------|---------------------|
| PCI compliance | Stripe handles everything | You handle form, SAQ-A required |
| Trial support | Native `trial_period_days` param | Must build trial logic manually |
| Development time | ~2 days | ~5-7 days |
| Payment methods | Auto-shows Apple Pay, Google Pay, cards, etc. | Manual configuration per method |
| Customization | Limited (colors, logo) | Full UI control |
| Mobile | Fully responsive out of the box | Must build responsive form |

For a v1 launch, Checkout redirect is the clear winner. You can migrate to Elements later if you need pixel-perfect branding.

### 2. How trial_period_days Works in Stripe

When you create a Checkout Session with `subscription_data.trial_period_days: 3`:

1. User enters card details on Stripe Checkout page
2. Stripe creates a Customer (or uses existing) and stores the payment method
3. Stripe creates a Subscription with status `trialing`
4. An invoice for $0.00 is generated immediately
5. After 3 days, Stripe automatically:
   - Generates an invoice for the subscription amount ($9.99 or $19.99)
   - Charges the stored payment method
   - Changes subscription status from `trialing` to `active`
6. If charge fails, subscription goes to `past_due` or `incomplete`

**Stripe auto-sends a `customer.subscription.trial_will_end` event 3 days before trial ends.** Since the trial IS 3 days, this fires immediately when the trial starts -- useful for tracking.

### 3. Lifetime (One-Time) Payment Alongside Subscriptions

Lifetime deals use a completely separate Checkout Session with `mode: 'payment'` instead of `mode: 'subscription'`. This is the standard Stripe pattern:

- Create a Product in Stripe called "Lifetime Access"
- Create a Price with `type: 'one_time'` at $79.99
- When user selects Lifetime, create Checkout Session with `mode: 'payment'`
- On `checkout.session.completed` webhook, check if it was a one-time payment and set user plan to `lifetime`

### 4. Webhook Events to Listen For

**Critical (must handle):**

| Event | When | Your Action |
|-------|------|-------------|
| `checkout.session.completed` | User completes Checkout | Create/update user subscription record. For lifetime: set plan=lifetime |
| `customer.subscription.updated` | Any sub change (trial->active, plan change) | Sync subscription status to DB |
| `customer.subscription.deleted` | Sub canceled (end of period or immediate) | Set plan=free, revoke access |
| `invoice.paid` | Successful recurring payment | Extend access, update period_end |
| `invoice.payment_failed` | Payment failed | Flag user, trigger dunning flow |

**Recommended (nice to have):**

| Event | When | Your Action |
|-------|------|-------------|
| `customer.subscription.trial_will_end` | 3 days before trial ends (fires immediately for 3-day trial) | Optional: send custom email |
| `customer.subscription.paused` | Sub paused | Revoke access |

### 5. Syncing Stripe State with Supabase

**The webhook handler is the single source of truth.** Flow:

```
Stripe Event -> Webhook Endpoint -> Verify Signature -> Update Supabase users table
```

Key fields to store: `stripe_customer_id`, `stripe_subscription_id`, `plan` (free/premium/diamond/lifetime), `subscription_status` (trialing/active/canceled/past_due), `trial_end`, `current_period_end`.

### 6. Minimal Stripe Setup

**In Stripe Dashboard, create:**

1. **Product: "AXS Premium"**
   - Price: $9.99/month, recurring

2. **Product: "AXS Diamond"**
   - Price: $19.99/month, recurring

3. **Product: "AXS Lifetime"**
   - Price: $79.99, one-time

4. **Webhook endpoint** pointing to `https://your-domain.com/api/webhooks/stripe`

5. **Customer Portal** configured with:
   - Allow customers to cancel subscriptions
   - Allow customers to update payment methods
   - Show invoice history

### 7. Customer Portal for Cancellation

**Yes, use the Stripe Customer Portal.** It is free, pre-built, and handles:
- Cancellation (immediate or end-of-period)
- Payment method updates
- Invoice/receipt downloads
- Plan switching (if you enable it)

You just need one API endpoint that creates a portal session and redirects the user.

---

## DATABASE SCHEMA CHANGES

### Modify `users` table

Add these columns to the existing users table:

```sql
ALTER TABLE users ADD COLUMN stripe_customer_id text UNIQUE;
ALTER TABLE users ADD COLUMN stripe_subscription_id text;
ALTER TABLE users ADD COLUMN subscription_status text DEFAULT 'none';
  -- Values: none, trialing, active, past_due, canceled, paused
ALTER TABLE users ADD COLUMN trial_end timestamp with time zone;
ALTER TABLE users ADD COLUMN current_period_end timestamp with time zone;

CREATE INDEX users_stripe_customer_idx ON users (stripe_customer_id);
```

### Update Drizzle schema (`src/db/schema/users.ts`)

Add fields:
- `stripeCustomerId: text('stripe_customer_id').unique()`
- `stripeSubscriptionId: text('stripe_subscription_id')`
- `subscriptionStatus: text('subscription_status').default('none')`
- `trialEnd: timestamp('trial_end', { withTimezone: true })`
- `currentPeriodEnd: timestamp('current_period_end', { withTimezone: true })`

The existing `plan` field stays and gets updated by webhooks to: `free`, `premium`, `diamond`, or `lifetime`.

### RLS Policy Update

Add a policy for the webhook service to update users:

```sql
-- The webhook handler uses the service_role key (bypasses RLS)
-- No additional RLS policy needed if using service_role client
```

---

## STRIPE PRODUCTS AND PRICES TO CREATE

### Via Stripe Dashboard or CLI

```
Product 1: "AXS Premium"
  Price: $9.99/month (recurring, USD)
  -> Save the price_id as STRIPE_PRICE_PREMIUM

Product 2: "AXS Diamond"
  Price: $19.99/month (recurring, USD)
  -> Save the price_id as STRIPE_PRICE_DIAMOND

Product 3: "AXS Lifetime"
  Price: $79.99 (one-time, USD)
  -> Save the price_id as STRIPE_PRICE_LIFETIME
```

### Environment Variables Needed

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_DIAMOND=price_...
STRIPE_PRICE_LIFETIME=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## API ENDPOINTS TO BUILD

### 1. `POST /api/stripe/checkout` -- Create Checkout Session

**Input:** `{ priceId: string, planType: 'premium' | 'diamond' | 'lifetime' }`

**Logic:**
1. Get authenticated user from Supabase
2. Find or create Stripe Customer (store `stripe_customer_id` on user)
3. If planType is `premium` or `diamond`:
   - Create Checkout Session with `mode: 'subscription'`
   - Set `subscription_data.trial_period_days: 3`
   - Set `subscription_data.metadata: { userId, plan }`
4. If planType is `lifetime`:
   - Create Checkout Session with `mode: 'payment'`
   - Set `metadata: { userId, plan: 'lifetime' }`
5. Return `{ url: session.url }` for redirect

### 2. `POST /api/webhooks/stripe` -- Webhook Handler

**No auth** (verified via Stripe signature). Must use raw body.

**Events handled:**
- `checkout.session.completed` -- initial setup
- `customer.subscription.created` -- store subscription ID
- `customer.subscription.updated` -- sync status changes
- `customer.subscription.deleted` -- revoke access
- `invoice.paid` -- confirm payment, extend access
- `invoice.payment_failed` -- flag user

### 3. `POST /api/stripe/portal` -- Customer Portal Session

**Logic:**
1. Get authenticated user
2. Get their `stripe_customer_id`
3. Create Stripe Billing Portal session
4. Return `{ url: session.url }` for redirect

### 4. `GET /api/user/subscription` -- Get Subscription Status

**Logic:**
1. Get authenticated user
2. Return plan, status, trial_end, current_period_end from DB
3. Used by frontend to show current plan and manage button

---

## WEBHOOK HANDLER STRUCTURE

```
/api/webhooks/stripe/route.ts

1. Read raw body (important: don't parse JSON, use raw text)
2. Get Stripe-Signature header
3. Verify with stripe.webhooks.constructEvent(body, sig, secret)
4. Switch on event.type:

   case 'checkout.session.completed':
     - Extract customer, subscription, metadata
     - If mode=subscription: update user with stripe IDs, set plan from metadata
     - If mode=payment (lifetime): set plan='lifetime', no subscription

   case 'customer.subscription.updated':
     - Get subscription object from event.data.object
     - Map subscription.status to DB
     - Update plan based on price_id in subscription items
     - Update trial_end, current_period_end

   case 'customer.subscription.deleted':
     - Set plan='free'
     - Set subscription_status='canceled'
     - Clear stripe_subscription_id

   case 'invoice.paid':
     - Update current_period_end from invoice.lines.data[0].period.end
     - Ensure subscription_status='active'

   case 'invoice.payment_failed':
     - Set subscription_status='past_due'
     - (Optional: trigger email via your system)

5. Return 200 OK (always, even if you don't handle the event)
```

**Critical Next.js config:** The webhook route must NOT use the default body parser. In Next.js App Router, export a route config:

```typescript
// Needed so Next.js gives us the raw body for Stripe signature verification
export const runtime = 'nodejs' // not 'edge' -- Stripe SDK needs Node
```

Use `request.text()` to get the raw body, not `request.json()`.

---

## FRONTEND COMPONENTS NEEDED

### 1. Redesign PaymentModal -> PricingModal

Transform the existing single-plan PaymentModal into a 3-tier pricing modal:

- **Premium card**: $9.99/mo, "3 days free", list of premium features, CTA button
- **Diamond card**: $19.99/mo, "3 days free", "MOST POPULAR" badge, list of diamond features, CTA button
- **Lifetime card**: $79.99 one-time, "BEST VALUE" badge, "All features forever", CTA button

Each CTA calls `POST /api/stripe/checkout` with the appropriate plan, then redirects to `session.url`.

### 2. Success Page: `/dashboard?session_id={CHECKOUT_SESSION_ID}`

After Stripe Checkout completes, user is redirected back. The success_url should include the session_id. The page can:
- Show a success animation/toast
- Verify the session via API
- Wait for webhook to sync (show "activating..." state if needed)

### 3. Subscription Management UI (in Settings page)

- Show current plan (free/premium/diamond/lifetime)
- Show trial status ("Trial ends in X days") if trialing
- Show next billing date if active
- "Manage Subscription" button -> redirects to Stripe Customer Portal
- "Upgrade" button -> opens PricingModal (if on free plan)

### 4. Feature Gating Component

A wrapper/hook that checks user plan:
```
useSubscription() -> { plan, isTrialing, isPaid, canAccess(feature) }
```

### 5. PaymentModalTrigger Update

Update the existing trigger to work with the new pricing modal.

---

## STEP-BY-STEP IMPLEMENTATION ORDER

### Phase 1: Stripe Foundation (Day 1)

1. Install `stripe` npm package
2. Create Stripe account (if not exists), get API keys
3. Create 3 Products + 3 Prices in Stripe Dashboard
4. Configure Customer Portal in Stripe Dashboard
5. Add environment variables to `.env.local` and Vercel
6. Create `src/lib/stripe.ts` -- Stripe client initialization

### Phase 2: Database (Day 1)

7. Update Drizzle schema (`src/db/schema/users.ts`) with new columns
8. Generate and run migration (`npx drizzle-kit generate` + `npx drizzle-kit push`)
9. Update SQL migration file for reference

### Phase 3: Backend API Routes (Day 2)

10. Create `src/app/api/stripe/checkout/route.ts` -- Checkout Session creation
11. Create `src/app/api/webhooks/stripe/route.ts` -- Webhook handler
12. Create `src/app/api/stripe/portal/route.ts` -- Customer Portal session
13. Update `src/app/api/user/subscription/route.ts` (or create) -- Get status

### Phase 4: Webhook Testing (Day 2)

14. Install Stripe CLI (`brew install stripe/stripe-cli/stripe`)
15. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
16. Test checkout flow with test cards
17. Verify DB updates on each webhook event
18. Test trial expiration with Stripe test clocks

### Phase 5: Frontend (Day 3)

19. Redesign PaymentModal into PricingModal with 3 tiers
20. Wire CTA buttons to checkout API
21. Add success handling (redirect from Stripe Checkout back to app)
22. Create subscription management section in Settings
23. Build `useSubscription` hook for feature gating
24. Update PaymentModalProvider with new logic

### Phase 6: Feature Gating (Day 3-4)

25. Identify which features are premium-only
26. Add gating checks throughout the app
27. Show upgrade prompts on gated features

### Phase 7: Production Deploy (Day 4)

28. Switch from Stripe test keys to live keys
29. Set up webhook endpoint in Stripe Dashboard (production URL)
30. Configure Vercel environment variables
31. Test full flow in production with a real $1 test charge
32. Enable Stripe's automatic email settings (trial reminders, receipts)

---

## SECURITY CONSIDERATIONS

1. **Webhook signature verification is mandatory.** Never trust unverified webhook payloads.
2. **Use Stripe's `service_role` Supabase key in webhook handler** to bypass RLS (webhook runs server-side, no user context).
3. **Never expose `STRIPE_SECRET_KEY` to the client.** Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe for frontend.
4. **Idempotency:** Stripe may send the same event multiple times. Your webhook handler must be idempotent (use upsert logic, not insert).
5. **Don't trust client-side plan state.** Always verify server-side from the DB (which is synced from Stripe via webhooks).

---

## COMPLIANCE NOTES

Per Visa/Mastercard rules (enforced by Stripe):
- You MUST show the trial duration and post-trial price clearly before checkout
- You MUST provide a way to cancel (Stripe Customer Portal handles this)
- Stripe auto-sends trial ending reminder emails if you enable it in Dashboard settings
- The statement descriptor will include "TRIAL OVER" text when the trial converts

**Enable in Stripe Dashboard > Settings > Billing > Automatic:**
- "Send emails about expiring trials" = ON
- "Customer cancellation URL" = your app's settings/subscription page

---

## COST ANALYSIS

| Item | Cost |
|------|------|
| Stripe per-transaction fee | 2.9% + $0.30 per successful charge |
| Stripe Billing | Free (included) |
| Customer Portal | Free (included) |
| Webhooks | Free (included) |
| Premium: $9.99/mo | You receive ~$9.40 after fees |
| Diamond: $19.99/mo | You receive ~$19.11 after fees |
| Lifetime: $79.99 | You receive ~$77.37 after fees |

---

## TESTING CHECKLIST

- [ ] Create checkout session for Premium (with trial)
- [ ] Create checkout session for Diamond (with trial)
- [ ] Create checkout session for Lifetime (one-time)
- [ ] Verify webhook fires on checkout completion
- [ ] Verify user plan updates in DB
- [ ] Test trial -> active transition (use Stripe test clocks)
- [ ] Test subscription cancellation via Customer Portal
- [ ] Test failed payment handling
- [ ] Test lifetime user cannot be downgraded by subscription events
- [ ] Verify feature gating works for each plan
- [ ] Test webhook idempotency (replay same event)
- [ ] Test with Stripe test card numbers:
  - `4242424242424242` -- success
  - `4000000000000341` -- attaching succeeds, charge fails
  - `4000002500003155` -- requires 3D Secure authentication

---

## FILES TO CREATE/MODIFY

### New Files:
- `src/lib/stripe.ts` -- Stripe client init
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/hooks/useSubscription.ts`
- `src/components/modals/PricingModal.tsx` (or heavily modify PaymentModal)

### Files to Modify:
- `src/db/schema/users.ts` -- add Stripe columns
- `src/providers/payment-modal-provider.tsx` -- wire to Stripe checkout
- `src/components/modals/PaymentModal.tsx` -- redesign to 3-tier
- `src/app/(app)/layout.tsx` -- update trigger logic
- `middleware.ts` -- potentially add subscription checks for premium routes
- `package.json` -- add `stripe` dependency
- `.env.local` -- add Stripe env vars

### Files to Remove/Replace:
- `src/app/api/user/upgrade/route.ts` -- replaced by Stripe checkout flow (currently just sets plan='premium' with no payment)
