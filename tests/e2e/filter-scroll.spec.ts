import { expect, test, type Page } from '@playwright/test';

import { loginAs } from './helpers';

async function scrollPosition(page: Page) {
  return page.evaluate(() => window.scrollY);
}

async function expectPositionPreserved(page: Page, before: number) {
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(40);
  const after = await scrollPosition(page);
  expect(Math.abs(after - before)).toBeLessThan(160);
}

test.describe('same-page filters', () => {
  test('map province and district filters keep the current viewport', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/map');

    const izmir = page.getByRole('link', { name: /^İzmir/ }).first();
    await izmir.scrollIntoViewIfNeeded();
    const provincePosition = await scrollPosition(page);
    expect(provincePosition).toBeGreaterThan(200);

    await izmir.click();
    await expect(page).toHaveURL(/province=35/);
    await expectPositionPreserved(page, provincePosition);

    const bornova = page.getByRole('list', { name: 'İlçeler' }).getByRole('link', { name: 'Bornova' });
    await bornova.scrollIntoViewIfNeeded();
    const districtPosition = await scrollPosition(page);

    await bornova.click();
    await expect(page).toHaveURL(/district=35-07/);
    await expectPositionPreserved(page, districtPosition);
  });

  test('filter chips and filter search submissions do not jump to the heading', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/video');

    const demo = page.getByRole('link', { name: 'Demo', exact: true });
    await demo.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 80));
    const chipPosition = await scrollPosition(page);

    await demo.click();
    await expect(page).toHaveURL(/kind=demo/);
    await expectPositionPreserved(page, chipPosition);

    await page.goto('/explore/how');
    const search = page.locator('form[action="/explore/how"]');
    await search.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 80));
    const searchPosition = await scrollPosition(page);

    await search.getByRole('searchbox').fill('roket');
    await search.getByRole('button', { name: 'Ara' }).click();
    await expect(page).toHaveURL(/q=roket/);
    await expectPositionPreserved(page, searchPosition);
  });
});
