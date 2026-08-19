import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

/**
 * Iki katmanli kisisellestirme (PROJECT_SPEC 7.10 / 10.1.1 / 17.18-10).
 *
 * Spec tek bir intentMode alaninin butun kisisellestirme modeli gibi
 * kullanilmasini acikca yasakliyor. Iki ayri zaman olcegi var:
 *   - KALICI: platform amaclari, Ayarlar'dan degistirilir.
 *   - ANLIK : Sosyalles / Kesfet / Ogren / Uret, yalnizca o oturumu etkiler.
 *
 * Buradaki testler ikisinin gercekten AYRI oldugunu sabitler: mod secmek
 * amaclari silmemeli, ve hic mod secmemek gecerli bir secim olmali.
 */

test.describe('Kalıcı platform amaçları', () => {
  test('ayarlarda seçilir, kaydedilir ve seçim korunur', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/settings');

    const goals = page.getByRole('group', { name: 'Platform amaçları' });
    await expect(goals).toBeVisible();

    // Spec 10.1.1'deki kontrollu sozlugun tamami sunulur.
    await expect(goals.getByRole('checkbox')).toHaveCount(15);

    const collaborators = goals.getByRole('checkbox', { name: /Ekip veya iş birliği bulmak/ });
    const wasChecked = await collaborators.isChecked();
    if (wasChecked) await collaborators.uncheck();
    else await collaborators.check();

    await page.getByRole('button', { name: 'Ayarları kaydet' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    // Yeniden yuklendiginde secim yerinde durmali.
    await page.reload();
    const after = page
      .getByRole('group', { name: 'Platform amaçları' })
      .getByRole('checkbox', { name: /Ekip veya iş birliği bulmak/ });
    await expect(after).toBeChecked({ checked: !wasChecked });
  });

  test('anlık mod seçmek kalıcı amaçları silmez', async ({ page }) => {
    await loginAs(page, 'user');

    // Once kalici bir amac secili hale getirilir.
    await page.goto('/settings');
    const goals = page.getByRole('group', { name: 'Platform amaçları' });
    const local = goals.getByRole('checkbox', { name: /Yerel ekosistemi keşfetmek/ });
    if (!(await local.isChecked())) await local.check();
    await page.getByRole('button', { name: 'Ayarları kaydet' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    // Sonra akista anlik bir mod secilir. "Kesfet" hem sol gezinmede hem niyet
    // cipinde geciyor; niyet cip grubuna daraltiyoruz.
    await page.goto('/feed');
    await page
      .getByRole('group', { name: 'Akış niyet modu' })
      .getByRole('link', { name: 'Keşfet', exact: true })
      .click();
    await expect(page).toHaveURL(/mod=kesfet/);

    // Kalici amac hâlâ yerinde: mod onu ezmedi, uzerine gecici olarak bindi.
    await page.goto('/settings');
    await expect(
      page.getByRole('group', { name: 'Platform amaçları' }).getByRole('checkbox', {
        name: /Yerel ekosistemi keşfetmek/,
      }),
    ).toBeChecked();
  });
});

test.describe('Anlık niyet modu isteğe bağlıdır', () => {
  test('hiç mod seçmeden de kişiselleştirilmiş akış gelir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/feed?mod=yok');

    // Mod secilmedigini arayuz de soyler.
    await expect(page.getByText(/platform amaçlarına göre sıralanıyor/i)).toBeVisible();

    // Akis bos degil ve kartlar hâlâ gerekce tasiyabiliyor.
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('"Amaçlarıma göre" seçeneği akış filtrelerinde bulunur', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/feed');

    const chips = page.getByRole('group', { name: 'Akış niyet modu' });
    await expect(chips.getByRole('link', { name: 'Amaçlarıma göre' })).toBeVisible();
  });
});
