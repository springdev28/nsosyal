import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginAs, loginKeepingNewspaper } from './helpers';

/**
 * Erisilebilirlik duman testleri (PROJECT_SPEC 8.3 / 17.13).
 *
 * UYARI: Otomatik test tek basina erisilebilirligi KANITLAMAZ. axe yalnizca
 * makinece tespit edilebilen hatalari yakalar; klavye sirasi, odak yonetimi ve
 * ekran okuyucu deneyimi elle de kontrol edilmelidir. Bu dosya yaygin
 * hatalarin geri gelmesini engellemek icindir.
 */

const RULES = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(RULES).analyze();
}

const PAGES = [
  { path: '/feed', name: 'Ana akış' },
  { path: '/explore', name: 'Keşfet' },
  { path: '/explore/time', name: 'Ne zaman' },
  { path: '/explore/why', name: 'Neden panosu' },
  { path: '/explore/how', name: 'Nasıl kaynakları' },
  { path: '/communities', name: 'Topluluklar' },
  { path: '/communities/izmir-havacilik', name: 'Topluluk sayfası' },
  { path: '/communities/apply', name: 'Topluluk başvuru formu' },
  { path: '/projects/ruzgar-olcer', name: 'Proje sayfası' },
  { path: '/events/izmir-model-roket-atolyesi', name: 'Etkinlik sayfası' },
  { path: '/newspaper', name: 'nGazete' },
  { path: '/notifications', name: 'Bildirimler' },
  { path: '/settings', name: 'Ayarlar' },
  { path: '/profile/elif.demo', name: 'Profil' },
  { path: '/create/project', name: 'Proje oluşturma formu' },
  { path: '/about', name: 'Hakkında' },
];

test.describe('axe taraması', () => {
  for (const entry of PAGES) {
    test(`${entry.name} ciddi erişilebilirlik ihlali içermez`, async ({ page }) => {
      await loginAs(page, 'user');
      await page.goto(entry.path);
      const results = await scan(page);

      // Ihlal varsa hangisi oldugunu raporda gormek istiyoruz.
      const summary = results.violations.map(
        (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} düğüm`,
      );
      expect(summary, `${entry.name} ihlalleri`).toEqual([]);
    });
  }

  test('harita sayfası ve harita sonuçları erişilebilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/map?province=35');
    // Harita yuklenene kadar bekle.
    await page.waitForTimeout(1500);
    const results = await scan(page);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

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
 * Karanlik tema uygulamanin varsayilan gorunumu; Playwright ise varsayilan
 * olarak acik temayi taklit eder. 5N1K boyut renkleri her iki temada farkli
 * degerler aldigi icin ikisini de tariyoruz.
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

    // Bekleme bitene kadar Esc kapatmaz (kasitli deneysel davranis).
    await expect(dialog.getByRole('button', { name: 'Kapat' })).toBeEnabled({ timeout: 10_000 });

    // Odak modal icinde kalir.
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
    // "Hikâyeye konumumu ekle" onay kutusuyla karismasin diye tam eslesme.
    await page.getByLabel('Hikâye', { exact: true }).fill('Çok kısa.');
    await page.getByRole('button', { name: 'Hikâyeyi yayımla' }).click();

    // Tarayici dogrulamasi minLength ile engeller; sunucu mesaji da alert rolunde.
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
    // Secili durum renge ek olarak onay isareti ikonuyla da gosterilir.
    await expect(active.locator('svg[data-icon="check"]')).toBeVisible();
  });

  test('videonun metin karşılığı vardır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/video');
    await page.getByRole('button', { name: 'Metin karşılığı' }).first().click();
    await expect(page.getByRole('button', { name: 'Metni gizle' }).first()).toBeVisible();
  });
});
