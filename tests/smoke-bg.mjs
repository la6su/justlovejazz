import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

try {
  await page.goto('http://192.168.10.104:5173/', { timeout: 15000 });
  // Wait for canvas to render
  await page.waitForTimeout(3000);
  const title = await page.title();
  console.log('PAGE_TITLE:', title);
} catch (e) {
  console.log('NAV ERROR:', e.message);
}

if (errors.length > 0) {
  console.log('JS_ERRORS:', errors.slice(0, 5).join(' | '));
} else {
  console.log('NO JS ERRORS - page loaded clean');
}

await browser.close();
