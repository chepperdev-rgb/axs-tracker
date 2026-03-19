import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Check if user has a paid plan.
 * Returns true if user has premium, diamond, or lifetime.
 * Returns false if free or not found.
 */
export async function hasPaidPlan(userId: string): Promise<boolean> {
  const [dbUser] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!dbUser) return false
  return dbUser.plan !== 'free'
}
