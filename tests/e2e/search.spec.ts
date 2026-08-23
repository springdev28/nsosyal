import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

/**
 * These tests follow the public Explore form through the URL into
 * DemoStore.discover and back to the result sections rendered by the page.
 */
test.describe('global arama', () => {
  test('konumunu paylaşmayan kişi ve kurum kullanıcı adıyla bulunur', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');

    const search = page.getByRole('search');
    await search.getByLabel('Konu, kişi, topluluk, etkinlik, proje veya paylaşım ara').fill('ece.uzay');
    await search.getByRole('button', { name: 'Ara' }).click();

    await expect(page).toHaveURL(/q=ece\.uzay/);
    const people = page.getByRole('region', { name: 'Kişiler (1)' });
    await expect(people.getByRole('link', { name: /Ece Balaban/ })).toHaveAttribute(
      'href',
      '/profile/ece.uzay',
    );
    await expect(page.getByRole('heading', { name: 'Kök topluluklar' })).toHaveCount(0);

    await page.goto('/explore?province=35&q=ece.uzay');
    await expect(page.getByRole('region', { name: /Kişiler/ })).toHaveCount(0);
    await expect(page.getByText('Bu filtrelerde sonuç bulunamadı')).toBeVisible();

    await search
      .getByLabel('Konu, kişi, topluluk, etkinlik, proje veya paylaşım ara')
      .fill('egeteknopark.demo');
    await search.getByRole('button', { name: 'Ara' }).click();

    const organizations = page.getByRole('region', { name: 'Kurumlar (1)' });
    await expect(organizations.getByRole('link', { name: /Ege Teknopark/ })).toHaveAttribute(
      'href',
      '/profile/egeteknopark.demo',
    );
  });

  test('gönderi metni arama sonuçlarında gerçek gönderi kartı olarak açılır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');

    const search = page.getByRole('search');
    await search
      .getByLabel('Konu, kişi, topluluk, etkinlik, proje veya paylaşım ara')
      .fill('tek bir kırmızı LED');
    await search.getByRole('button', { name: 'Ara' }).click();

    const posts = page.getByRole('region', { name: 'Paylaşımlar (1)' });
    await expect(posts.getByRole('article')).toContainText('Devrede tek bir kırmızı LED var');
  });
});
