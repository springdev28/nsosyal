import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

test.describe('short-video publishing', () => {
  test('a creator chooses a format and the complete source stays inside a vertical black stage', async ({ page }) => {
    await loginAs(page, 'user');

    await page.getByLabel('Gönderi metni').fill('Yatay sensör demosu kısa video denemesi.');
    await page.locator('#composer-media').setInputFiles(
      resolve(process.cwd(), 'public/demo/video/feed-roket-atesleme.webm'),
    );

    const previewStage = page.locator('[data-composer-video-stage="true"]');
    await expect(previewStage).toBeVisible();
    await expect(previewStage).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(previewStage.locator('video')).toHaveCSS('object-fit', 'contain');
    const previewBox = await previewStage.boundingBox();
    expect(previewBox).not.toBeNull();
    expect(Math.abs(previewBox!.width / previewBox!.height - 9 / 16)).toBeLessThan(0.02);

    await page.getByLabel('Medya açıklaması').fill('Siyah çerçeve içinde eksiksiz görünen yatay sensör videosu.');
    const kindGroup = page.getByRole('group', { name: 'Kısa video türü' });
    await expect(kindGroup.getByRole('radio')).toHaveCount(7);
    const demoKind = kindGroup.getByRole('radio', { name: 'Demo' });
    await demoKind.focus();
    await demoKind.press('Space');
    await expect(demoKind).toBeChecked();

    await page.getByRole('button', { name: 'Gönder', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Paylaşıldı.');

    await page.goto('/video?kind=demo');
    await expect(page.getByRole('link', { name: 'Demo', exact: true })).toHaveAttribute('aria-current', 'true');

    const published = page.getByRole('article').filter({ hasText: 'Yatay sensör demosu kısa video denemesi.' });
    await expect(published).toBeVisible();
    await expect(published.getByText('Demo', { exact: true })).toBeVisible();

    const stage = published.locator('[data-video-stage="short"]');
    await expect(stage).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(stage.locator('video')).toHaveCSS('object-fit', 'contain');
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(Math.abs(stageBox!.width / stageBox!.height - 9 / 16)).toBeLessThan(0.02);
  });
});
