import postgres from 'postgres';

const sql = postgres(
  'postgresql://postgres.qzaisectszonsdazosup:gaIbtixHn3e38atc@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  { prepare: false }
);

async function run() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
    console.log('Added stripe_customer_id');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
    console.log('Added stripe_subscription_id');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'`;
    console.log('Added subscription_status');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ`;
    console.log('Added trial_end');

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ`;
    console.log('Added current_period_end');

    console.log('\nMigration complete!');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await sql.end();
  }
}

run();
