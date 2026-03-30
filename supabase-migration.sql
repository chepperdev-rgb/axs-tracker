-- AXS Tracker Database Migration
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/qzaisectszonsdazosup/sql

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "language" text DEFAULT 'en' NOT NULL,
  "plan" text DEFAULT 'free' NOT NULL,
  "timezone" text DEFAULT 'UTC' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create habits table
CREATE TABLE IF NOT EXISTS "habits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "emoji" text,
  "category" text,
  "frequency" text DEFAULT 'daily' NOT NULL,
  "frequency_days" jsonb,
  "is_archived" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS "habit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "habit_id" uuid NOT NULL,
  "date" date NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  CONSTRAINT "habit_logs_habit_id_date_unique" UNIQUE("habit_id","date")
);

-- Create monthly_plans table
CREATE TABLE IF NOT EXISTS "monthly_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "habit_id" uuid NOT NULL,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  CONSTRAINT "monthly_plans_user_id_habit_id_year_month_unique" UNIQUE("user_id","habit_id","year","month")
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "type" text DEFAULT 'daily' NOT NULL,
  "date" date NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

-- Add foreign keys
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "monthly_plans" ADD CONSTRAINT "monthly_plans_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX IF NOT EXISTS "habits_user_idx" ON "habits" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "habit_logs_date_idx" ON "habit_logs" USING btree ("date");
CREATE INDEX IF NOT EXISTS "habit_logs_habit_idx" ON "habit_logs" USING btree ("habit_id");
CREATE INDEX IF NOT EXISTS "monthly_plans_month_idx" ON "monthly_plans" USING btree ("year","month");
CREATE INDEX IF NOT EXISTS "tasks_date_idx" ON "tasks" USING btree ("date");
CREATE INDEX IF NOT EXISTS "tasks_user_idx" ON "tasks" USING btree ("user_id");

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "habit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monthly_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for habits
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own habits" ON habits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for habit_logs
CREATE POLICY "Users can view logs for their habits" ON habit_logs FOR SELECT USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert logs for their habits" ON habit_logs FOR INSERT WITH CHECK (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can update logs for their habits" ON habit_logs FOR UPDATE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete logs for their habits" ON habit_logs FOR DELETE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));

-- RLS Policies for monthly_plans
CREATE POLICY "Users can view their own monthly plans" ON monthly_plans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own monthly plans" ON monthly_plans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own monthly plans" ON monthly_plans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own monthly plans" ON monthly_plans FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════
-- Migration: Add rollover mechanics to tasks table
-- ═══════════════════════════════════════════════════

-- Add status column (active | completed | cancelled | rolled_over)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add parent_task_id for tracking rollover chain
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Add rollover_processed_at timestamp
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rollover_processed_at timestamptz;

-- Index for faster queries on unprocessed tasks
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

-- ═══════════════════════════════════════════════════
-- Migration: Health metrics + API tokens for Steps Widget
-- ═══════════════════════════════════════════════════

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT health_metrics_user_date_unique UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS health_metrics_user_idx ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS health_metrics_date_idx ON health_metrics(date);
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own health metrics" ON health_metrics FOR ALL USING (user_id = auth.uid());

-- API tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'default',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS api_tokens_token_idx ON api_tokens(token);
CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON api_tokens(user_id);
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tokens" ON api_tokens FOR ALL USING (user_id = auth.uid());
