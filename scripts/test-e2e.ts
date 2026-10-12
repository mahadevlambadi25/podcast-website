import { spawn, ChildProcess, execSync } from 'child_process';

/**
 * Automated End-to-End Smoke Test Suite
 * Tests all key routes, HTML renders, API responses, and database interactions on the live server.
 */

async function waitForServer(baseUrl: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function terminateProcess(child: ChildProcess) {
  if (!child.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {}
}

async function runSmokeTests() {
  const baseUrl = 'http://localhost:3000';
  let serverProcess: ChildProcess | null = null;

  try {
    const isAlreadyRunning = await waitForServer(baseUrl, 2);
    if (!isAlreadyRunning) {
      console.log('==> No server detected on localhost:3000. Launching Next.js production server...');
      serverProcess = spawn('npm', ['run', 'start'], {
        shell: true,
        stdio: 'ignore',
      });

      const ready = await waitForServer(baseUrl, 30);
      if (!ready) {
        throw new Error('Failed to start Next.js production server within 30 seconds.');
      }
      console.log('==> Server ready on http://localhost:3000\n');
    }

    console.log(`==> Running Unchartered E2E Smoke Tests against ${baseUrl}...\n`);

    let passed = 0;
    let failed = 0;

    async function check(name: string, fn: () => Promise<void>) {
      try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`[FAIL] ${name}: ${err.message}`);
        failed++;
      }
    }

    // 1. Health check
    await check('1. API Health Check', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok' && data.status !== 'healthy') throw new Error('Status not ok');
  });

  // 2. Homepage loads with brand, hero, latest episode, CTA
  await check('2. Homepage Renders All Core Sections', async () => {
    const res = await fetch(`${baseUrl}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    if (!html.includes('Unchartered')) throw new Error('Missing brand name "Unchartered"');
    if (!html.includes('Legends &amp; Legacies') && !html.includes('Legends & Legacies')) {
      throw new Error('Missing tagline "Legends & Legacies"');
    }
    if (!html.includes('AI Automation Labs')) throw new Error('Missing publisher attribution');
    if (!html.includes('Latest Conversation') && !html.includes('Headline Interview')) {
      throw new Error('Missing latest episode showcase');
    }
    if (!html.includes('Know a leader with a story worth sharing')) {
      throw new Error('Missing nomination CTA section');
    }
  });

  // 3. Search works and ranks guest first
  await check('3. Search API Ranks Guest Name First', async () => {
    const res = await fetch(`${baseUrl}/api/search?q=Elena%20Rostova`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (data.totalCount === 0) throw new Error('Expected results for Elena Rostova');
    if (!data.guests || data.guests.length === 0) throw new Error('Expected guest in results');
    if (data.guests[0].fullName !== 'Elena Rostova') throw new Error(`Expected Elena Rostova first, got ${data.guests[0].fullName}`);
    if (data.guests[0].score < 800) throw new Error(`Score too low: ${data.guests[0].score}`);
  });

  // 4. Episode page renders with YouTube facade and takeaways
  await check('4. Episode Detail Page Renders YouTube Facade & Takeaways', async () => {
    const res = await fetch(`${baseUrl}/episodes/the-quantum-horizon-sovereign-compute`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    if (!html.includes('The Quantum Horizon')) throw new Error('Missing episode title');
    if (!html.includes('Key Executive Takeaways')) throw new Error('Missing Key Takeaways');
    if (!html.includes('Click to Load Privacy-Enhanced Player') && !html.includes('youtube-nocookie.com')) {
      throw new Error('Missing privacy YouTube facade');
    }
    if (!html.includes('Elena Rostova')) throw new Error('Missing linked guest profile');
  });

  // 5. Guest profile page renders with portrait, bio, quotes
  await check('5. Guest Profile Page Renders with Bio & Quotes', async () => {
    const res = await fetch(`${baseUrl}/guests/elena-rostova`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();

    if (!html.includes('Elena Rostova')) throw new Error('Missing guest name');
    if (!html.includes('Quantum Dynamics')) throw new Error('Missing company');
    if (!html.includes('Executive Overview')) throw new Error('Missing executive overview');
    if (!html.includes('Key Insights')) throw new Error('Missing key insights section');
  });

  // 6. Nomination form validation rejects invalid data
  await check('6. Nomination API Validates Input and Honeypot', async () => {
    // Missing required fields
    const badRes = await fetch(`${baseUrl}/api/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    if (badRes.status !== 400) throw new Error(`Expected status 400 for incomplete form, got ${badRes.status}`);

    // Spam honeypot detection
    const spamRes = await fetch(`${baseUrl}/api/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot',
        email: 'bot@spam.com',
        guestName: 'Spam Nominee',
        reason: 'This is a long valid reason exceeding forty characters for spam test purposes.',
        consent: true,
        website_hp: 'http://spam-link.com',
      }),
    });
    if (spamRes.status !== 400) throw new Error(`Expected status 400 for honeypot spam, got ${spamRes.status}`);
  });

  // 7. Successful nomination submission
  await check('7. Nomination API Stores Valid Submission', async () => {
    const validRes = await fetch(`${baseUrl}/api/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        guestName: 'Dr. William Gibson',
        guestRoleCompany: 'Author & Technologist',
        reason: 'Pioneered cybernetic fiction and predicted modern distributed networks with profound cultural impact.',
        consent: true,
      }),
    });
    if (!validRes.ok) throw new Error(`Nomination submission failed with status ${validRes.status}`);
    const data = await validRes.json();
    if (!data.success) throw new Error('Expected success true');
  });

  // 8. Contact form submission
  await check('8. Contact API Stores Valid Message', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: 'alex@example.com',
        message: 'Hello, inquiring about syndication opportunities for upcoming Season 1 broadcasts.',
      }),
    });
    if (!res.ok) throw new Error(`Contact submission failed with status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Expected success true');
  });

  // 9. Robots.txt and Sitemap.xml
  await check('9. Robots.txt and Sitemap.xml Validation', async () => {
    const [robotsRes, sitemapRes] = await Promise.all([
      fetch(`${baseUrl}/robots.txt`),
      fetch(`${baseUrl}/sitemap.xml`),
    ]);

    if (!robotsRes.ok) throw new Error('Robots.txt failed');
    const robotsText = await robotsRes.text();
    if (!robotsText.includes('Disallow: /admin')) throw new Error('Robots missing /admin disallow');

    if (!sitemapRes.ok) throw new Error('Sitemap.xml failed');
    const sitemapText = await sitemapRes.text();
    if (!sitemapText.includes('the-quantum-horizon-sovereign-compute')) {
      throw new Error('Sitemap missing published episode URL');
    }
    if (!sitemapText.includes('elena-rostova')) {
      throw new Error('Sitemap missing published guest URL');
    }
  });

  // 10. 301 Redirect for /be-a-guest
  await check('10. /be-a-guest Redirects to /nominate-a-leader (301)', async () => {
    const res = await fetch(`${baseUrl}/be-a-guest`, { redirect: 'manual' });
    if (res.status !== 307 && res.status !== 308 && res.status !== 301) {
      throw new Error(`Expected redirect status (301/308), got ${res.status}`);
    }
    const location = res.headers.get('location');
    if (!location?.includes('/nominate-a-leader')) {
      throw new Error(`Expected location to contain /nominate-a-leader, got ${location}`);
    }
  });

    console.log(`\n==> Test Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    if (serverProcess) {
      console.log('==> Tearing down spawned test server...');
      terminateProcess(serverProcess);
    }
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
