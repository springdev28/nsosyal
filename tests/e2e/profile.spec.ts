import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

test.describe('Profil yönetimi', () => {
  test('profil bilgileri ayrı ekranda düzenlenir ve bağlantı platform ikonu kazanır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/profile/elif.demo');

    await expect(page.getByRole('heading', { name: 'Elif Yıldırım' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profili düzenle' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tanışabileceğin kişiler' })).toBeVisible();

    await page.getByRole('link', { name: 'Profili düzenle' }).click();
    await page.getByLabel('Görünen ad').fill('Elif Yıldırım Demo');
    await page.getByLabel('Web adresi').first().fill('instagram.com/elif.demo');
    await page.getByRole('button', { name: 'Profili kaydet' }).click();
    await expect(page.getByRole('status')).toContainText('Profilin güncellendi');

    await page.getByRole('link', { name: 'Profile dön' }).click();
    await expect(page.getByRole('heading', { name: 'Elif Yıldırım Demo' })).toBeVisible();
    await expect(page.locator('svg[data-icon="instagram"]')).toBeVisible();
  });

  test('genel ayarlarda profil alanları tekrar edilmez', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/settings');

    await expect(page.getByRole('link', { name: 'Profili düzenle' })).toBeVisible();
    await expect(page.getByLabel('Kısa tanıtım')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Gizlilik ve güvenlik' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bağlı hesaplar ve oturum' })).toBeVisible();
  });
});
