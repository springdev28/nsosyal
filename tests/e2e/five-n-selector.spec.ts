import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

/**
 * 5N boyut secici (PROJECT_SPEC 4.4 / 17.18-4).
 *
 * Bu dosya mekanigin spec'te ISIMLE yasaklanan bicimlere geri donmesini
 * engeller: bes sabit buton, surekli gorunen liste, tam cark. Ayrica secicinin
 * klavyeyle tamamen kullanilabilir oldugunu dogrular - spec 4.4/9 ayni islevin
 * klavye ve dugmelerle tamamlanabilmesini sart kosuyor.
 */
test.describe('5N secici', () => {
  test('kapaliyken yalnizca isaret gorunur, boyutlar sabit buton olarak durmaz', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');

    const trigger = page.getByRole('button', { name: '5N boyut seçici' }).first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Kapaliyken hicbir boyut ogesi ekranda durmaz.
    await expect(page.getByRole('menuitem')).toHaveCount(0);
  });

  test('yay acilir, klavyeyle dondurulur ve secim paneli acar', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');

    const trigger = page.getByRole('button', { name: '5N boyut seçici' }).first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Bes boyut da yayin uzerindedir.
    await expect(page.getByRole('menuitem')).toHaveCount(5);

    // Odak yaya gecer; aksi halde ok tuslari sayfayi kaydirirdi.
    await expect(page.getByRole('menuitem', { name: /^Ne —/ })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: /^Ne zaman —/ })).toBeFocused();

    // Secim: yay tamamen kaybolur ve o boyutun gercek paneli acilir.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/explore\/time/);
    await expect(page.getByRole('menuitem')).toHaveCount(0);

    // Isaret panelin uzerinde erisilebilir kalir (spec 4.4/7).
    await expect(page.getByRole('button', { name: '5N boyut seçici' }).first()).toBeVisible();
  });

  test('Escape kapatir ve odagi isarete geri verir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');

    const trigger = page.getByRole('button', { name: '5N boyut seçici' }).first();
    await trigger.click();
    await expect(page.getByRole('menuitem')).toHaveCount(5);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('yay acikken ciddi erisilebilirlik ihlali yok', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');
    await page.getByRole('button', { name: '5N boyut seçici' }).first().click();
    await expect(page.getByRole('menuitem')).toHaveCount(5);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
