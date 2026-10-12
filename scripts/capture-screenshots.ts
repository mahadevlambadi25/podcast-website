import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const outputDir = path.resolve(
    'C:/Users/Reshma/.gemini/antigravity-ide/brain/3eebdb2a-21e3-49f5-93bf-6c96162823d1/screenshots'
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  // Pre-seed cookie consent so banner doesn't obstruct view
  await page.addInitScript(() => {
    window.localStorage.setItem('unchartered_cookie_consent', 'accepted');
  });

  const pagesToCapture = [
    { url: 'http://localhost:3000/', name: 'homepage.png' },
    { url: 'http://localhost:3000/episodes/the-quantum-horizon-sovereign-compute', name: 'episode-detail.png' },
    { url: 'http://localhost:3000/episodes', name: 'episodes-archive.png' },
    { url: 'http://localhost:3000/guests', name: 'guest-directory.png' },
    { url: 'http://localhost:3000/contact', name: 'contact-page.png' },
    { url: 'http://localhost:3000/nominate-a-leader', name: 'nominate-page.png' },
  ];

  for (const item of pagesToCapture) {
    try {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(800);
      const filePath = path.join(outputDir, item.name);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Captured: ${filePath}`);
    } catch (err: any) {
      console.error(`Failed to capture ${item.url}:`, err.message);
    }
  }

  // Also capture scrolled homepage to show featured episode and guest grid
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(600);
    const scrollPath = path.join(outputDir, 'homepage-featured.png');
    await page.screenshot({ path: scrollPath, fullPage: false });
    console.log(`Captured: ${scrollPath}`);
  } catch (err: any) {
    console.error('Failed to capture scrolled homepage:', err.message);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
