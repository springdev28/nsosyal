import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginAs, loginKeepingNewspaper } from './helpers';

/**
 * This file protects the accessibility contract in PROJECT_SPEC 8.3 / 17.13.
 * Axe catches machine-detectable problems. Keyboard order, focus management
 * and screen-reader quality still need a manual review.
 */

const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(RULES).analyze();
}

/**
 * The page object comes from Playwright and represents the route opened by a
 * test below. Comparing these two document widths catches controls or panels
 * that make the whole app slide sideways at high zoom.
 */
async function expectNoHorizontalPageOverflow(page: import('@playwright/test').Page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(widths.content, `Page width at ${page.url()}`).toBeLessThanOrEqual(widths.viewport);
}

const PAGES = [
  { path: '/feed', name: 'Ana akış' },
  { path: '/explore', name: 'Keşfet' },
  { path: '/explore?q=ece.uzay', name: 'Keşfet kişi sonuçları' },
  { path: '/explore/time', name: 'Ne zaman' },
  { path: '/explore/why', name: 'Neden panosu' },
  { path: '/explore/how', name: 'Nasıl kaynakları' },
  { path: '/communities', name: 'Topluluklar' },
  { path: '/communities/izmir-havacilik', name: 'Topluluk sayfası' },
  { path: '/communities/apply', name: 'Topluluk başvuru formu' },
  { path: '/projects/ruzgar-olcer', name: 'Proje sayfası' },
  { path: '/events/izmir-model-roket-atolyesi', name: 'Etkinlik sayfası' },
  { path: '/newspaper', name: 'nGazete' },
  { path: '/publish', name: 'Yayın Atölyesi' },
  { path: '/notifications', name: 'Bildirimler' },
  { path: '/saved', name: 'Kaydedilenler' },
  { path: '/video', name: 'Kısa videolar' },
  { path: '/settings', name: 'Ayarlar' },
  { path: '/profile/elif.demo', name: 'Profil' },
  { path: '/profile/elif.demo/edit', name: 'Profil düzenleme' },
  { path: '/create/project', name: 'Proje oluşturma formu' },
  { path: '/about', name: 'Hakkında' },
];

test.describe('axe taraması', () => {
  for (const entry of PAGES) {
    test(`${entry.name} ciddi erişilebilirlik ihlali içermez`, async ({ page }) => {
      await loginAs(page, 'user');
      await page.goto(entry.path);
      const results = await scan(page);

      // Keep the affected rule and selector in the failure message for beginners tracing the component.
      const summary = results.violations.map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes.length} düğüm; ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      );
      expect(summary, `${entry.name} ihlalleri`).toEqual([]);
    });
  }

  test('harita sayfası ve harita sonuçları erişilebilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/map?province=35');
    // The map is client-rendered, so Axe must run after its regions exist.
    await page.waitForTimeout(1500);
    const results = await scan(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('harita araması 320 piksel reflow görünümünde kesilmez', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await loginAs(page, 'user');
    await page.goto('/explore/map');

    const searchButton = page.getByRole('search').getByRole('button', { name: 'Ara' });
    const buttonBox = await searchButton.boundingBox();
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // 320 CSS pixels is the WCAG reflow equivalent of 400% zoom on a 1280-pixel desktop.
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(viewportWidth);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth);
  });

  test('arama sonucu 320 piksel reflow görünümünde yatay taşmaz', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await loginAs(page, 'user');
    await page.goto('/explore?q=ece.uzay');

    await expect(page.getByRole('region', { name: 'Kişiler (1)' })).toBeVisible();
    await expectNoHorizontalPageOverflow(page);
  });

  test('Nasıl araması ve Neden kartları 320 piksel reflow görünümüne sığar', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await loginAs(page, 'user');

    await page.goto('/explore/how');
    const howButton = page.getByRole('search').getByRole('button', { name: 'Ara' });
    const howButtonBox = await howButton.boundingBox();
    const howViewportWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Check the action and document separately so a clipped button cannot hide behind overflow rules.
    expect(howButtonBox).not.toBeNull();
    expect(howButtonBox!.x + howButtonBox!.width).toBeLessThanOrEqual(howViewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(howViewportWidth);

    await page.goto('/explore/why');
    const firstStory = page.getByRole('article').first();
    const storyBox = await firstStory.boundingBox();
    const whyViewportWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // This card sits beside the 5N mark, where grid minimum widths previously pushed the page sideways.
    expect(storyBox).not.toBeNull();
    expect(storyBox!.x + storyBox!.width).toBeLessThanOrEqual(whyViewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(whyViewportWidth);
  });

  test('gönderi oluşturucu 320 piksel reflow görünümünde eylemi kırpmaz', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await loginAs(page, 'user');

    // Filling the composer reveals its draft state, which is the most crowded version of this toolbar.
    await page.getByLabel('Gönderi metni').fill('Yeni sensör kartının ilk denemesi.');
    const submit = page.getByRole('button', { name: 'Gönder', exact: true });
    const submitBox = await submit.boundingBox();
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(submitBox).not.toBeNull();
    expect(submitBox!.x + submitBox!.width).toBeLessThanOrEqual(viewportWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewportWidth);
  });

  for (const entry of [
    { path: '/newspaper', name: 'nGazete' },
    { path: '/publish', name: 'Yayın Atölyesi' },
    { path: '/profile/elif.demo', name: 'Profil' },
  ]) {
    test(`${entry.name} 320 piksel reflow görünümünde yatay taşmaz`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await loginAs(page, 'user');
      await page.goto(entry.path);

      await expect(page.locator('main').first()).toBeVisible();
      await expectNoHorizontalPageOverflow(page);
    });
  }

  test('giriş ekranı erişilebilir', async ({ page }) => {
    await page.goto('/login');
    const results = await scan(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('onboarding erişilebilir', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Onboarding turunu başlat' }).click();
    await page.waitForURL('**/onboarding');
    const results = await scan(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('gazete modalı erişilebilir', async ({ page }) => {
    await loginKeepingNewspaper(page, 'user');
    await expect(page.getByRole('dialog')).toBeVisible();
    const results = await scan(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

/**
 * Playwright emulates a light operating system by default, while nSosyal is
 * dark-first. This second pass protects the theme-specific color tokens.
 */
test.describe('karanlık tema', () => {
  test.use({ colorScheme: 'dark' });

  for (const path of ['/feed', '/explore', '/explore/how', '/communities']) {
    test(`${path} karanlık temada ihlal içermez`, async ({ page }) => {
      await loginAs(page, 'user');
      await page.goto(path);
      const results = await scan(page);
      const summary = results.violations.map(
        (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} düğüm`,
      );
      expect(summary, `${path} karanlık tema ihlalleri`).toEqual([]);
    });
  }
});

test.describe('hareketi azaltma', () => {
  test('marka ve nGazete sürekli hareketlerini tamamen durdurur', async ({ page }) => {
    // Setting the media preference here makes the same contract run on both browser projects.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAs(page, 'user');
    await page.goto('/feed');

    const motionState = await page.evaluate(() => {
      const newspaper = document.querySelector<HTMLElement>('.nav-newspaper');
      const mobileNewspaper = document.querySelector<HTMLElement>('.mobile-newspaper-icon');
      const markLayer = document.querySelector<SVGElement>('.ns-mark-motion-layer');

      return {
        preferenceApplied: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        newspaperGlint: newspaper ? getComputedStyle(newspaper, '::before').animationName : null,
        newspaperAura: newspaper ? getComputedStyle(newspaper, '::after').animationName : null,
        mobileNewspaper: mobileNewspaper ? getComputedStyle(mobileNewspaper).animationName : null,
        markLayerDisplay: markLayer ? getComputedStyle(markLayer).display : null,
      };
    });

    // Reduced motion removes the animated layers instead of leaving a frozen glow frame behind.
    expect(motionState).toEqual({
      preferenceApplied: true,
      newspaperGlint: 'none',
      newspaperAura: 'none',
      mobileNewspaper: 'none',
      markLayerDisplay: 'none',
    });
  });
});

test.describe('klavye ile kullanım', () => {
  test('atlama bağlantısı ilk Tab ile odaklanır ve ana içeriğe gider', async ({ page }) => {
    await loginAs(page, 'user');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'İçeriğe atla' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('#main')).toBeVisible();
  });

  test('gazete modalında odak tuzağı çalışır ve Esc kapatır', async ({ page }) => {
    await loginKeepingNewspaper(page, 'user');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The timed close rule applies to Escape as well as the visible button.
    await expect(dialog.getByRole('button', { name: 'Kapat' })).toBeEnabled({ timeout: 10_000 });

    // Repeated Tab presses prove that focus cannot escape behind the modal.
    for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
    const focusedInsideDialog = await dialog.evaluate((node) => node.contains(document.activeElement));
    expect(focusedInsideDialog).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('akış filtreleri klavyeyle gezilebilir', async ({ page }) => {
    await loginAs(page, 'user');
    const learn = page.getByRole('link', { name: 'Öğren', exact: true });
    await learn.focus();
    await expect(learn).toBeFocused();
    await learn.press('Enter');
    await expect(page).toHaveURL(/mod=ogren/);
  });

  test('form hataları alanla ilişkilendirilir', async ({ page }) => {
    await loginAs(page, 'creator');
    await page.goto('/create/why');

    await page.getByLabel('Başlık').fill('Kısa bir başlık denemesi');
    // Exact matching separates the story field from the location checkbox.
    await page.getByLabel('Hikâye', { exact: true }).fill('Çok kısa.');
    await page.getByRole('button', { name: 'Hikâyeyi yayımla' }).click();

    // Native validation may stop submission before the server can render its alert.
    const alert = page.getByRole('alert');
    if (await alert.count()) await expect(alert.first()).toBeVisible();
  });
});

test.describe('renk tek başına durum iletmez', () => {
  test('seçili filtre işaretle de belirtilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/how?level=baslangic');
    const active = page.getByRole('link', { name: /Başlangıç/ }).first();
    await expect(active).toHaveAttribute('aria-current', 'true');
    // The check icon makes the selected state understandable without color.
    await expect(active.locator('svg[data-icon="check"]')).toBeVisible();
  });

  test('videonun metin karşılığı vardır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/video');
    await page.getByRole('button', { name: 'Metin karşılığı' }).first().click();
    await expect(page.getByRole('button', { name: 'Metni gizle' }).first()).toBeVisible();
  });
});
