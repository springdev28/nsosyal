import { chromium } from '@playwright/test';
const D = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, timezoneId: 'Europe/Istanbul' });
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto('http://localhost:3000/login');
await page.getByRole('button', { name: /Elif · gündelik kullanıcı/ }).click();
await page.waitForLoadState('networkidle');
const dialog = page.getByRole('dialog');
if (await dialog.count()) { await page.waitForTimeout(3500); await page.getByRole('button', { name: 'Kapat' }).click().catch(()=>{}); }
await page.goto('http://localhost:3000/settings');
await page.waitForLoadState('networkidle');
await page.getByText('Platform amaçların').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${D}/settings-goals.png` });
await page.goto('http://localhost:3000/feed?mod=yok');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: `${D}/feed-goals.png`, clip: { x: 240, y: 0, width: 800, height: 420 } });
await browser.close();
