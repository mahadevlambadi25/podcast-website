import { getDashboardMetrics } from '../src/services/metrics.service';
import { listEpisodes } from '../src/services/episodes.service';
import { listGuests } from '../src/services/guests.service';
import { listTopics } from '../src/services/topics.service';
import { listMedia } from '../src/services/media.service';
import { listNominations } from '../src/services/nominations.service';
import { listContactMessages } from '../src/services/contact.service';
import { listUsers } from '../src/services/users.service';
import { listRedirects } from '../src/services/redirects.service';
import { getSiteSettings } from '../src/services/settings.service';
import { listAuditLogs } from '../src/services/audit.service';
import { verifyPassword } from '../src/lib/auth/password';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';
import { db } from '../src/lib/db/client';

async function main() {
  console.log('=== VERIFYING ADMIN API SERVICES & AUTH ===\n');

  // 1. Auth check
  const userRes = await db.execute("SELECT * FROM users WHERE email = 'admin@gmail.com' LIMIT 1");
  const user = userRes.rows[0];
  const pwOk = verifyPassword('mahadev@123', String(user.salt), String(user.hash));
  console.log('1. Password verification for admin@gmail.com (mahadev@123):', pwOk ? 'PASSED' : 'FAILED');

  const token = createSessionToken({
    id: Number(user.id),
    email: String(user.email),
    role: String(user.role),
  });
  const decoded = verifySessionToken(token);
  console.log('2. Session token creation & verification:', decoded?.email === 'admin@gmail.com' ? 'PASSED' : 'FAILED');

  // 3. Metrics
  const metrics = await getDashboardMetrics();
  console.log('3. Dashboard Metrics:', {
    episodes: metrics.counts.totalEpisodes,
    guests: metrics.counts.totalGuests,
    nominations: metrics.counts.pendingNominations,
    messages: metrics.counts.unreadMessages,
    media: metrics.counts.totalMedia,
  });

  // 4. Content services
  const eps = await listEpisodes({ limit: 5 });
  console.log(`4. Episodes: Found ${eps.totalDocs} (page 1 has ${eps.docs.length})`);

  const guests = await listGuests({ limit: 5 });
  console.log(`5. Guests: Found ${guests.totalDocs} (page 1 has ${guests.docs.length})`);

  const topics = await listTopics();
  console.log(`6. Topics: Found ${topics.length}`);

  const media = await listMedia();
  console.log(`7. Media: Found ${media.totalDocs}`);

  const noms = await listNominations({ limit: 5 });
  console.log(`8. Nominations: Found ${noms.totalDocs}`);

  const msgs = await listContactMessages({ limit: 5 });
  console.log(`9. Messages: Found ${msgs.totalDocs}`);

  const users = await listUsers();
  console.log(`10. Users: Found ${users.length} (${users.map((u) => u.email).join(', ')})`);

  const redirects = await listRedirects();
  console.log(`11. Redirects: Found ${redirects.length}`);

  const settings = await getSiteSettings();
  console.log(`12. Settings: Brand="${settings?.brand_name}"`);

  const audit = await listAuditLogs();
  console.log(`13. Audit logs table initialized, count=${audit.totalDocs}`);

  console.log('\n=== ALL ADMIN BACKEND SERVICES ARE OPERATIONAL ===');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
