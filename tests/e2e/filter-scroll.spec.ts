import { expect, test, type Locator, type Page } from '@playwright/test';

import { loginAs } from './helpers';

async function scrollPosition(page: Page) {
  return page.evaluate(() => window.scrollY);
}

// The layout can grow after a filter is applied, so the useful contract is that
// the page stays away from the top and the control the user clicked remains visible.
async function expectPositionPreserved(page: Page, control: Locator) {
  await expect.poll(() => scrollPosition(page)).toBeGreaterThan(40);
  await expect(control).toBeInViewport();
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
    await expectPositionPreserved(page, izmir);

    const bornova = page.getByRole('list', { name: 'İlçeler' }).getByRole('link', { name: 'Bornova' });
    await bornova.scrollIntoViewIfNeeded();

    await bornova.click();
    await expect(page).toHaveURL(/district=35-07/);
    await expectPositionPreserved(page, bornova);
  });

  test('filter chips and filter search submissions do not jump to the heading', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/video');

    const demo = page.getByRole('link', { name: 'Demo', exact: true });
    await demo.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 80));

    await demo.click();
    await expect(page).toHaveURL(/kind=demo/);
    await expectPositionPreserved(page, demo);

    await page.goto('/explore/how');
    const search = page.locator('form[action="/explore/how"]');
    await search.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 80));

    await search.getByRole('searchbox').fill('roket');
    await search.getByRole('button', { name: 'Ara' }).click();
    await expect(page).toHaveURL(/q=roket/);
    await expectPositionPreserved(page, search);
  });
});
