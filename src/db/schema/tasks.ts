import { pgTable, uuid, text, date, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull().default('daily'),
  date: date('date').notNull(),
  completed: boolean('completed').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  dateIdx: index('tasks_date_idx').on(table.date),
  userIdx: index('tasks_user_idx').on(table.userId),
}))

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
