import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Automatically load .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function seedClean() {
  console.log('==> Starting cleanup of sample demo content in Unchartered CMS...');
  const { getPayload } = await import('payload');
  const { default: configPromise } = await import('../src/payload.config');

  const payload = await getPayload({ config: configPromise });

  // 1. Clean sample episodes
  console.log('--> Removing sample demo episodes...');
  const episodes = await payload.find({
    collection: 'episodes',
    limit: 100,
  });

  let deletedEpisodes = 0;
  for (const ep of episodes.docs) {
    const isSample =
      ep.tags?.some((t: any) => t.tag === 'SAMPLE') ||
      ep.youtubeUrl?.includes('sample-placeholder') ||
      ep.youtubeUrl?.includes('dQw4w9WgXcQ') ||
      ep.title.startsWith('[SAMPLE]') ||
      [
        'the-quantum-horizon-sovereign-compute',
        'capital-allocation-frontier-innovation',
        'reengineering-biology-scaled-therapeutics',
        'factory-2035-autonomous-robotics-industrial-mastery',
      ].includes(ep.slug);

    if (isSample) {
      await payload.delete({
        collection: 'episodes',
        id: ep.id,
      });
      deletedEpisodes++;
      console.log(`    Deleted sample episode: ${ep.title}`);
    }
  }

  // 2. Clean sample guests
  console.log('--> Removing sample demo guests...');
  const guests = await payload.find({
    collection: 'guests',
    limit: 100,
  });

  let deletedGuests = 0;
  for (const g of guests.docs) {
    const isSampleGuest = [
      'elena-rostova',
      'marcus-vance',
      'soraya-al-mansoor',
      'thomas-sterling',
    ].includes(g.slug);

    if (isSampleGuest) {
      await payload.delete({
        collection: 'guests',
        id: g.id,
      });
      deletedGuests++;
      console.log(`    Deleted sample guest: ${g.fullName}`);
    }
  }

  console.log(`==> Seed cleanup completed: ${deletedEpisodes} episodes and ${deletedGuests} guests removed.`);
  process.exit(0);
}

seedClean().catch((err) => {
  console.error('Seed clean failed:', err);
  process.exit(1);
});
