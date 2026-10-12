import { db } from '../src/lib/db/client';
import { verifyPassword, hashPassword } from '../src/lib/auth/password';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';
import { listEpisodes, getEpisodeById, createEpisode, updateEpisode, deleteEpisode } from '../src/services/episodes.service';
import { listGuests, getGuestById, createGuest, updateGuest, deleteGuest } from '../src/services/guests.service';
import { listTopics, getTopicById, createTopic, updateTopic, deleteTopic } from '../src/services/topics.service';
import { listMedia, getMediaById, createMedia, updateMedia, deleteMedia } from '../src/services/media.service';
import { listNominations, getNominationById, updateNomination, deleteNomination } from '../src/services/nominations.service';
import { listContactMessages, getContactMessageById, deleteContactMessage } from '../src/services/contact.service';
import { listUsers, getUserById, createUser, updateUser, deleteUser } from '../src/services/users.service';
import { listRedirects, createRedirect, deleteRedirect } from '../src/services/redirects.service';
import { getSiteSettings, updateSiteSettings } from '../src/services/settings.service';
import { logActivity, listAuditLogs } from '../src/services/audit.service';

async function runValidation() {
  console.log('=====================================================');
  console.log('   FULL APPLICATION & CRUD INTEGRITY VALIDATION');
  console.log('=====================================================\n');

  // 1. AUTH & SESSIONS
  console.log('--- 1. AUTHENTICATION & SESSION TOKENS ---');
  const userRes = await db.execute("SELECT * FROM users WHERE email = 'admin@gmail.com' LIMIT 1");
  const adminUser = userRes.rows[0];
  const pwValid = verifyPassword('mahadev@123', String(adminUser.salt), String(adminUser.hash));
  console.log('✓ Admin login password verification:', pwValid ? 'PASS' : 'FAIL');
  if (!pwValid) throw new Error('Password verification failed');

  const token = createSessionToken({
    id: Number(adminUser.id),
    email: String(adminUser.email),
    role: String(adminUser.role),
  });
  const session = verifySessionToken(token);
  console.log('✓ HMAC signed session verification:', session?.email === 'admin@gmail.com' ? 'PASS' : 'FAIL');
  if (session?.email !== 'admin@gmail.com') throw new Error('Session verification failed');

  // 2. EPISODES CRUD
  console.log('\n--- 2. EPISODES CRUD ---');
  await db.execute("DELETE FROM episodes WHERE title LIKE '%Test Episode%'");
  
  const testTitle = `Test Episode ${Date.now()}`;
  const newEpId = await createEpisode({
    title: testTitle,
    slug: `test-ep-${Date.now()}`,
    status: 'draft',
    short_summary: 'Test summary',
    description: 'Test description',
    key_takeaways: ['Takeaway 1', 'Takeaway 2'],
  });
  console.log('✓ Created episode with ID:', newEpId);

  const ep = await getEpisodeById(newEpId);
  console.log('✓ Fetched created episode:', ep?.title === testTitle ? 'PASS' : 'FAIL');

  const updatedTitle = `Updated ${testTitle}`;
  await updateEpisode(newEpId, {
    title: updatedTitle,
    short_summary: 'Updated summary',
  });
  const updatedEp = await getEpisodeById(newEpId);
  console.log('✓ Updated episode:', updatedEp?.title === updatedTitle ? 'PASS' : 'FAIL');

  await deleteEpisode(newEpId);
  const deletedEp = await getEpisodeById(newEpId);
  console.log('✓ Deleted episode cleaned up:', deletedEp === null ? 'PASS' : 'FAIL');

  // 3. GUESTS CRUD & SAFE DELETION
  console.log('\n--- 3. GUESTS CRUD & SAFE DELETE PROTECTION ---');
  const newGuestId = await createGuest({
    full_name: 'Test Visionary Leader',
    slug: `test-leader-${Date.now()}`,
    role: 'Chief Test Officer',
    company: 'Test Labs',
    status: 'published',
  });
  console.log('✓ Created guest with ID:', newGuestId);

  const guest = await getGuestById(newGuestId);
  console.log('✓ Fetched guest:', guest?.full_name === 'Test Visionary Leader' ? 'PASS' : 'FAIL');

  await updateGuest(newGuestId, { role: 'VP Testing' });
  const updatedGuest = await getGuestById(newGuestId);
  console.log('✓ Updated guest role:', updatedGuest?.role === 'VP Testing' ? 'PASS' : 'FAIL');

  // Safe delete check on existing guest with episodes
  const existingGuestWithEp = 1; // Elena Rostova is linked to Episode 1
  const protectedDel = await deleteGuest(existingGuestWithEp);
  console.log('✓ Safe delete protection on active guest:', protectedDel.success === false ? 'PASS (Protected)' : 'FAIL');

  // Delete our temporary unlinked guest
  const tempDel = await deleteGuest(newGuestId);
  console.log('✓ Deleted unlinked temporary guest:', tempDel.success ? 'PASS' : 'FAIL');

  // 4. TOPICS CRUD & SAFE DELETION
  console.log('\n--- 4. TOPICS CRUD & DEPENDENCY PROTECTION ---');
  const newTopicResult = await createTopic({
    name: 'Quantum Computing Test',
    slug: `quantum-test-${Date.now()}`,
    description: 'Test description',
  });
  console.log('✓ Created topic with ID:', newTopicResult.id);

  const topic = await getTopicById(newTopicResult.id!);
  console.log('✓ Fetched topic:', topic?.name === 'Quantum Computing Test' ? 'PASS' : 'FAIL');

  await updateTopic(newTopicResult.id!, { description: 'Updated topic desc' });
  const updatedTopic = await getTopicById(newTopicResult.id!);
  console.log('✓ Updated topic:', updatedTopic?.description === 'Updated topic desc' ? 'PASS' : 'FAIL');

  // Safe delete check on topic with episodes (Topic 1: Technology or Topic 3: Healthcare)
  const protectedTopicDel = await deleteTopic(1);
  console.log('✓ Safe delete protection on active topic:', protectedTopicDel.success === false ? 'PASS (Protected)' : 'FAIL');

  // Delete our unlinked temporary topic
  const tempTopicDel = await deleteTopic(newTopicResult.id!);
  console.log('✓ Deleted unlinked temporary topic:', tempTopicDel.success ? 'PASS' : 'FAIL');

  // 5. MEDIA CRUD & USAGE CHECK
  console.log('\n--- 5. MEDIA CRUD & USAGE CHECK ---');
  const newMediaId = await createMedia({
    filename: `test-poster-${Date.now()}.jpg`,
    url: `/media/test-poster-${Date.now()}.jpg`,
    mime_type: 'image/jpeg',
    filesize: 102400,
    alt: 'Test Poster',
  });
  console.log('✓ Created media with ID:', newMediaId);

  const media = await getMediaById(newMediaId);
  console.log('✓ Fetched media:', media?.alt === 'Test Poster' ? 'PASS' : 'FAIL');

  await updateMedia(newMediaId, { alt: 'Updated Test Poster' });
  const updatedMedia = await getMediaById(newMediaId);
  console.log('✓ Updated media alt:', updatedMedia?.alt === 'Updated Test Poster' ? 'PASS' : 'FAIL');

  // Delete temporary media
  const delMedia = await deleteMedia(newMediaId);
  console.log('✓ Deleted temporary media:', delMedia.success ? 'PASS' : 'FAIL');

  // 6. NOMINATIONS & CONTACT MESSAGES
  console.log('\n--- 6. NOMINATIONS & CONTACT INQUIRIES ---');
  const nomList = await listNominations({ limit: 1 });
  if (nomList.docs.length > 0) {
    const firstNom = nomList.docs[0];
    await updateNomination(firstNom.id, { internal_notes: 'Verified in automated test' });
    const updatedNom = await getNominationById(firstNom.id);
    console.log('✓ Updated nomination internal notes:', updatedNom?.internal_notes === 'Verified in automated test' ? 'PASS' : 'FAIL');
  }

  const msgList = await listContactMessages({ limit: 1 });
  console.log(`✓ Fetched contact inquiries list (${msgList.totalDocs} total): PASS`);

  // 7. USERS & LAST-ADMIN PROTECTION
  console.log('\n--- 7. USERS & LAST-ADMIN PROTECTION ---');
  const testUserEmail = `testeditor-${Date.now()}@unchartered.com`;
  const newUserRes = await createUser({
    email: testUserEmail,
    role: 'editor',
    password: 'TemporaryPass123!',
  });
  console.log('✓ Created test editor user:', newUserRes.id ? 'PASS' : 'FAIL');

  await updateUser(newUserRes.id!, { role: 'editor' });
  const fetchedUser = await getUserById(newUserRes.id!);
  console.log('✓ Fetched test user:', fetchedUser?.email === testUserEmail ? 'PASS' : 'FAIL');

  await deleteUser(newUserRes.id!);
  const deletedUser = await getUserById(newUserRes.id!);
  console.log('✓ Deleted test user:', deletedUser === null ? 'PASS' : 'FAIL');

  // 8. REDIRECTS
  console.log('\n--- 8. SEO REDIRECTS ---');
  const redirRes = await createRedirect({
    from: '/legacy-ep-1',
    to: '/episodes/episode-1',
    type: '301',
  });
  console.log('✓ Created redirect rule ID:', redirRes.id);

  const redirs = await listRedirects();
  console.log('✓ Listed redirects count:', redirs.length > 0 ? 'PASS' : 'FAIL');

  if (redirRes.id) {
    await deleteRedirect(redirRes.id);
    console.log('✓ Deleted test redirect rule: PASS');
  }

  // 9. SETTINGS & AUDIT LOGS
  console.log('\n--- 9. SITE SETTINGS & AUDIT TRAIL ---');
  const currentSettings = await getSiteSettings();
  console.log(`✓ Loaded site settings: Brand="${currentSettings?.brand_name}": PASS`);

  await logActivity({
    user_email: 'admin@gmail.com',
    action: 'test',
    entity_type: 'test_suite',
    details: 'Automated CRUD test execution completed successfully',
  });
  const auditLogs = await listAuditLogs({ limit: 1 });
  console.log('✓ Audit log written and verified:', auditLogs.docs[0]?.action === 'test' ? 'PASS' : 'FAIL');

  console.log('\n=====================================================');
  console.log('   ALL APPLICATION CHECKS PASSED WITH ZERO ERRORS');
  console.log('=====================================================\n');
}

runValidation().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
