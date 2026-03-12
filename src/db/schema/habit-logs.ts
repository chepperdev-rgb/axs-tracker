import { pgTable, uuid, date, boolean, unique, index } from 'drizzle-orm/pg-core'
import { habits } from './habits'

export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  completed: boolean('completed').notNull().default(false),
}, (table) => ({
  uniqueHabitDate: unique().on(table.habitId, table.date),
  dateIdx: index('habit_logs_date_idx').on(table.date),
  habitIdx: index('habit_logs_habit_idx').on(table.habitId),
}))

export type HabitLog = typeof habitLogs.$inferSelect
export type NewHabitLog = typeof habitLogs.$inferInsert
