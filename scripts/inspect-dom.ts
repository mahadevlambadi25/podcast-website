import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await context.request.post('http://localhost:3000/api/users/login', {
    data: { email: 'admin@gmail.com', password: 'mahadev@123' },
  });

  await page.goto('http://localhost:3000/admin/collections/users', { waitUntil: 'networkidle' });

  // Open nav
  const toggler = page.locator('button[class*="nav-toggler"]').first();
  await toggler.click();
  await page.waitForTimeout(500);

  const containerInfo = await page.evaluate(() => {
    const defaultTemplate = document.querySelector('.template-default') as HTMLElement | null;
    const nav = document.querySelector('aside.nav') as HTMLElement | null;
    const wrap = document.querySelector('.template-default__wrap') as HTMLElement | null;
    return {
      templateDisplay: defaultTemplate ? window.getComputedStyle(defaultTemplate).display : 'none',
      templateGridTemplateColumns: defaultTemplate ? window.getComputedStyle(defaultTemplate).gridTemplateColumns : 'none',
      navWidth: nav ? window.getComputedStyle(nav).width : 'none',
      wrapWidth: wrap ? window.getComputedStyle(wrap).width : 'none',
      wrapLeft: wrap ? wrap.getBoundingClientRect().left : 0,
    };
  });
  console.log('Container layout info:', containerInfo);

  await browser.close();
}

main().catch(console.error);
