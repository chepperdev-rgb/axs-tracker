import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Check if user has an active paid plan.
 * Returns true if user has premium/diamond/lifetime AND subscription is in good standing.
 * Returns false if free, past_due, canceled, or user not found.
 */
export async function hasPaidPlan(userId: string): Promise<boolean> {
  const [dbUser] = await db
    .select({ plan: users.plan, subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!dbUser) return false
  if (dbUser.plan === 'free') return false

  // Lifetime users are always paid
  if (dbUser.plan === 'lifetime') return true

  // For subscription plans, check status is healthy
  const blockedStatuses = ['past_due', 'canceled', 'unpaid', 'incomplete_expired']
  if (blockedStatuses.includes(dbUser.subscriptionStatus ?? '')) return false

  return true
}
