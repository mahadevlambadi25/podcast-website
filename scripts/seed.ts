import { runPostgresMigrations } from './migrate-postgres.mjs';

async function main() {
  console.log('==> Starting Unchartered database seed...');
  await runPostgresMigrations();
  console.log('==> Seed completed successfully.');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
