import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

/**
 * P0 sosyal medya sozlesmesini arayuzden kanitlar. Store birim testleri veri
 * kuralini korur; bu senaryolar buton, Server Action ve yeniden render zinciri
 * birlikte calismadiginda da kirmizi olur.
 */
test.describe('P0 sosyal eylemler', () => {
  test('beğeni durumu ana akışta iki yönde değişir', async ({ page }) => {
    await loginAs(page, 'user');

    const firstPost = page.getByRole('article').first();
    const like = firstPost.getByRole('button', { name: /beğeni/i });
    const before = await like.getAttribute('aria-pressed');

    await like.click();
    await expect(like).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');

    await like.click();
    await expect(like).toHaveAttribute('aria-pressed', before ?? 'false');
  });

  test('kaydedilen gönderi kişisel koleksiyonda görünür ve kaldırılabilir', async ({ page }) => {
    await loginAs(page, 'user');

    const firstPost = page.getByRole('article').first();
    const postLink = firstPost.getByRole('link', { name: /yorum/i });
    const postHref = await postLink.getAttribute('href');
    expect(postHref).toMatch(/^\/posts\//);

    await firstPost.getByRole('button', { name: /^kaydet$/i }).click();
    await expect(firstPost.getByRole('button', { name: /kaydedildi/i })).toHaveAttribute('aria-pressed', 'true');

    // Masaustunde kenar cubugu, mobilde profil kisayolu bulunur. Profildeki
    // ortak giris noktasi iki viewportta da koleksiyonu ulasilabilir tutar.
    await page.goto('/profile/elif.demo');
    await page
      .getByRole('region', { name: 'Elif Yıldırım' })
      .getByRole('link', { name: 'Kaydedilenler', exact: true })
      .click();
    await expect(page).toHaveURL(/\/saved$/);
    await expect(page.getByRole('heading', { name: 'Kaydedilenler', level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
    const savedPost = page.getByRole('article').filter({ has: page.locator(`a[href="${postHref}"]`) });
    await expect(savedPost).toHaveCount(1);

    await savedPost.getByRole('button', { name: /kaydedildi/i }).click();
    // Demo hesabinda onceden kaydedilmis baska bir gonderi olabilir; sozlesme
    // tum listenin bosalmasi degil, yalnizca secilen kaydin kaldirilmasidir.
    await expect(page.locator(`a[href="${postHref}"]`)).toHaveCount(0);
  });

  test('yorum gönderi ayrıntısına eklenir', async ({ page }) => {
    await loginAs(page, 'user');

    const firstPost = page.getByRole('article').first();
    await firstPost.getByRole('link', { name: /yorum/i }).click();

    const body = `E2E yorum ${Date.now()}`;
    await page.getByLabel('Yorumun').fill(body);
    await page.getByRole('button', { name: 'Yorum yap' }).click();

    await expect(page.getByText(body, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Yorumun')).toHaveValue('');
  });

  test('kullanıcı profilden takip edilip bırakılabilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/profile/zeynep.bio');

    // Oneri seridinde de ayni etiketli dugmeler vardir; asil profil eylemi
    // kullanici adiyla etiketlenmis hero bolgesinde aranir.
    const profile = page.getByRole('region', { name: 'Zeynep Arslan' });
    await profile.getByRole('button', { name: 'Takip et', exact: true }).click();
    await expect(profile.getByRole('button', { name: 'Takiptesin', exact: true })).toBeVisible();

    await profile.getByRole('button', { name: 'Takiptesin', exact: true }).click();
    await expect(profile.getByRole('button', { name: 'Takip et', exact: true })).toBeVisible();
  });
});
