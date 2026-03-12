import { pgTable, uuid, integer, unique, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { habits } from './habits'

export const monthlyPlans = pgTable('monthly_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
}, (table) => ({
  uniquePlan: unique().on(table.userId, table.habitId, table.year, table.month),
  monthIdx: index('monthly_plans_month_idx').on(table.year, table.month),
}))

export type MonthlyPlan = typeof monthlyPlans.$inferSelect
export type NewMonthlyPlan = typeof monthlyPlans.$inferInsert
