import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

/*
 * Chromium'u nereden alacagiz?
 *
 * Gelistirme sanaligi kendi Chromium'unu /opt/pw-browsers altinda hazir
 * getiriyor ve `playwright install` calistirilmamasi gerekiyor. GitHub
 * Actions'ta ise tam tersi: Playwright kendi surumunu indiriyor ve o yol yok.
 *
 * Onceki surum yolu KOSULSUZ pinliyordu; yorumda "when it is present" yazsa da
 * kod varligi hic kontrol etmiyordu. Sonuc: CI'da her testin ilk adimi
 * "executable doesn't exist at /opt/pw-browsers/chromium" ile dusuyordu -
 * uygulamayla ilgisi olmayan 116 kirmizi.
 *
 * Simdi pin yalnizca dosya gercekten oradaysa uygulanir; degilse Playwright
 * kendi indirdigi tarayiciyi kullanir.
 */
const pinnedChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const launchOptions = existsSync(pinnedChromium) ? { executablePath: pinnedChromium } : {};

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
        launchOptions,
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        launchOptions,
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
