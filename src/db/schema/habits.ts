import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  emoji: text('emoji'),
  category: text('category'),
  frequency: text('frequency').notNull().default('daily'),
  frequencyDays: jsonb('frequency_days'),
  isArchived: boolean('is_archived').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index('habits_user_idx').on(table.userId),
}))

export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert
