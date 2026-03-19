import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for the authenticated user.
 * The portal allows managing subscriptions, payment methods, and invoices.
 *
 * @returns { url: string } - URL to redirect the user to the Stripe portal
 * @throws 401 if user is not authenticated
 * @throws 400 if user has no Stripe customer ID
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

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1)

    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this user' },
        { status: 400 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[stripe/portal] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
