import { test, type Page } from '@playwright/test';

/**
 * E2E yardimcilari.
 *
 * Locator tercihi: erisilebilir rol ve isim kullaniyoruz (data-testid degil).
 * Boylece testler ayni zamanda "bu kontrol ekran okuyucuya ne diyor?" sorusunu
 * da dogruluyor (PROJECT_SPEC 17.15).
 */

export type DemoAccount = 'user' | 'creator' | 'organization' | 'moderator';

/**
 * Her testten once demo verisini yeniden uret.
 *
 * Demo modunda tum senaryolar ayni sunucu ici depoyu paylasir; onaylanan bir
 * basvuru veya kurulan bir hatirlatma sonraki testi etkilerdi. Sifirlama
 * deterministik seed'den yeniden urettigi icin kimlikler ve oturum korunur.
 */
test.beforeEach(async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/api/demo/reset`);
  if (!response.ok()) {
    throw new Error(`Demo sıfırlanamadı: HTTP ${response.status()}`);
  }
});

const ACCOUNT_LABEL: Record<DemoAccount, RegExp> = {
  user: /Elif · gündelik kullanıcı/,
  creator: /Baran · üreten kullanıcı/,
  organization: /Ege Teknopark · kurum/,
  moderator: /Deniz · moderatör/,
};

/**
 * Gunun gazetesi ilk oturumda otomatik acilir. Kapatma kontrolu 3 saniye sonra
 * etkinlesir; testler bunu bekleyip kapatir.
 */
export async function dismissNewspaperModal(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /nGazete|Günün Özeti|Özel Sayısı/ });
  if ((await dialog.count()) === 0) return;

  const close = dialog.getByRole('button', { name: 'Kapat' });
  await close.waitFor({ state: 'visible', timeout: 10_000 });
  await close.click();
  await dialog.waitFor({ state: 'detached', timeout: 10_000 });
}

export async function loginAs(page: Page, account: DemoAccount): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: ACCOUNT_LABEL[account] }).click();
  await page.waitForURL('**/feed');
  await dismissNewspaperModal(page);
}

/** Gazete modalini acikca gormek isteyen testler icin: kapatmadan dondurur. */
export async function loginKeepingNewspaper(page: Page, account: DemoAccount): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: ACCOUNT_LABEL[account] }).click();
  await page.waitForURL('**/feed');
}
