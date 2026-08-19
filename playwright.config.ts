import { defineConfig, devices } from '@playwright/test';

// The sandboxed CI image ships a Chromium build that does not match the revision
// Playwright would download, so we point at it explicitly when it is present.
const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: './tests/e2e',
  // Demo modunda tüm senaryolar aynı sunucu içi veri deposunu paylaşır.
  // Testler arasında sızıntı olmaması için tek işçiyle ve sırayla çalışırlar;
  // her test öncesi /api/demo/reset ile veri yeniden üretilir.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: systemChromium },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        launchOptions: { executablePath: systemChromium },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start -- --port 3000',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
