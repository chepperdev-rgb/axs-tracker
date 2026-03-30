import { pgTable, uuid, date, integer, text, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const healthMetrics = pgTable('health_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  steps: integer('steps'),
  source: text('source').notNull().default('manual'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserDate: unique('health_metrics_user_date').on(table.userId, table.date),
  userIdx: index('health_metrics_user_idx').on(table.userId),
  dateIdx: index('health_metrics_date_idx').on(table.date),
}))

export type HealthMetric = typeof healthMetrics.$inferSelect
export type NewHealthMetric = typeof healthMetrics.$inferInsert
