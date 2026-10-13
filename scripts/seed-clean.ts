import { db } from '../src/lib/db/client';

async function seedClean() {
  console.log('==> Starting cleanup of sample demo content in Unchartered database...');

  // 1. Delete sample episodes
  const sampleSlugs = [
    'the-quantum-horizon-sovereign-compute',
    'capital-allocation-frontier-innovation',
    'reengineering-biology-scaled-therapeutics',
    'factory-2035-autonomous-robotics-industrial-mastery',
  ];

  for (const slug of sampleSlugs) {
    await db.execute({
      sql: 'DELETE FROM episodes WHERE slug = ?',
      args: [slug],
    });
    console.log(`    Deleted sample episode with slug: ${slug}`);
  }

  // 2. Delete sample guests
  const sampleGuestSlugs = [
    'elena-rostova',
    'marcus-vance',
    'dr-aravind-chen',
    'tariq-al-mansoor',
  ];

  for (const slug of sampleGuestSlugs) {
    await db.execute({
      sql: 'DELETE FROM guests WHERE slug = ?',
      args: [slug],
    });
    console.log(`    Deleted sample guest with slug: ${slug}`);
  }

  console.log('==> Sample demo content cleanup completed successfully.');
}

seedClean().catch((err) => {
  console.error('❌ Clean failed:', err);
  process.exit(1);
});
