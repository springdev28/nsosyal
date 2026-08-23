import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import { loginAs } from './helpers';

test.describe('P0 · Doğrulanmış pitch ile proje oluşturma', () => {
  test('geçerli video tek proje kaydına bağlanır ve metin karşılığı görünür', async ({ page }) => {
    await loginAs(page, 'creator');
    await page.goto('/create/project');

    await page.getByLabel('Proje adı').fill('Atomik Yükleme Deneyi');
    await page.getByLabel('Kısa açıklama').fill('Dosya ve proje kaydını tek güvenli akışta oluşturan deney.');
    await page.getByLabel('Durum').selectOption('test');
    await page.locator('#main').getByText('Robotik', { exact: true }).click();
    await page.getByLabel('Neden bu projeye başladın?').fill(
      'Başarısız bir video yüklemesinin yarım veya yinelenen proje bırakmaması gerektiği için başladım.',
    );
    await page.getByLabel('Nasıl geliştiriyorsun? (isteğe bağlı)').fill(
      'Önce bütün dosyaları doğruluyor, sonra dosya ve veri adımlarını birlikte tamamlıyorum.',
    );
    await page.getByLabel('Video dosyası').setInputFiles(
      resolve('public/demo/video/pitch-ruzgar-olcer.webm'),
    );
    await expect(page.locator('#pitch-help')).toContainText(/sn/);
    await page.getByLabel('Videonun metin karşılığı').fill(
      'Kısa pitch, doğrulama ve geri alma adımlarının birlikte çalışmasını anlatıyor.',
    );

    await page.getByRole('button', { name: 'Projeyi oluştur' }).click();

    await expect(page).toHaveURL(/\/projects\/atomik-yukleme-deneyi-/);
    await expect(page.getByRole('heading', { name: 'Atomik Yükleme Deneyi', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pitch videosu' })).toBeVisible();
    await page.getByRole('button', { name: 'Metin karşılığı' }).click();
    await expect(page.getByText(/doğrulama ve geri alma adımlarının birlikte çalışmasını/)).toBeVisible();
  });
});
