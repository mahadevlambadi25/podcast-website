import { getDashboardMetrics } from '../src/services/metrics.service';
import { listEpisodes } from '../src/services/episodes.service';
import { listGuests } from '../src/services/guests.service';
import { listTopics } from '../src/services/topics.service';
import { getSiteSettings } from '../src/services/settings.service';
import { listNominations } from '../src/services/nominations.service';
import { listContactMessages } from '../src/services/contact.service';
import { listUsers } from '../src/services/users.service';

async function main() {
  console.log('=== TESTING CUSTOM DATABASE SERVICES ===\n');

  const metrics = await getDashboardMetrics();
  console.log('1. Metrics:', metrics.counts);

  const episodes = await listEpisodes();
  console.log(`2. Episodes (${episodes.totalDocs} total):`);
  episodes.docs.forEach((e) => {
    console.log(`   - [ID ${e.id}] "${e.title}" (${e.status}) — Guests: ${e.guests.map(g => g.full_name).join(', ') || 'None'}, Topics: ${e.topics.map(t => t.name).join(', ') || 'None'}`);
  });

  const guests = await listGuests();
  console.log(`\n3. Guests (${guests.totalDocs} total):`);
  guests.docs.forEach((g) => {
    console.log(`   - [ID ${g.id}] "${g.full_name}" (${g.role} at ${g.company}) — Episodes linked: ${g.episode_count}`);
  });

  const topics = await listTopics();
  console.log(`\n4. Topics (${topics.length} total):`);
  topics.slice(0, 5).forEach((t) => {
    console.log(`   - "${t.name}" (slug: ${t.slug}) — Episodes linked: ${t.episode_count}`);
  });

  const settings = await getSiteSettings();
  console.log(`\n5. Site Settings: Brand="${settings?.brand_name}", Host="${settings?.host_name}"`);

  const noms = await listNominations();
  console.log(`\n6. Nominations: ${noms.totalDocs} total records`);

  const msgs = await listContactMessages();
  console.log(`7. Contact Messages: ${msgs.totalDocs} total records`);

  const users = await listUsers();
  console.log(`8. Users: ${users.length} total users:`, users.map(u => `${u.email} (${u.role})`));

  console.log('\n=== ALL SERVICES RETURNED REAL DATA SUCCESSFULLY ===');
}

main().catch(console.error);
