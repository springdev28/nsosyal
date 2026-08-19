import { chromium } from '@playwright/test';
const D = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, timezoneId: 'Europe/Istanbul' });
await page.emulateMedia({ colorScheme: 'dark' });

await page.goto('http://localhost:3000/login');
await page.getByRole('button', { name: /Onboarding turunu başlat/ }).click();
await page.waitForURL('**/onboarding');
// adim 1 -> ilgi alanlari sec
const topics = page.getByRole('checkbox');
for (let i = 0; i < 3; i++) await topics.nth(i).check();
await page.getByRole('button', { name: /Devam/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${D}/on-goals.png` });

await browser.close();
