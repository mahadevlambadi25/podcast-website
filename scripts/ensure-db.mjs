import { runPostgresMigrations } from './migrate-postgres.mjs';

export async function ensureDatabase() {
  await runPostgresMigrations();
}

ensureDatabase().catch((err) => {
  console.error('❌ Database migration failed:', err);
  process.exit(1);
});
