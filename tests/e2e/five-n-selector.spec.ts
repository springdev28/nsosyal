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

  /**
   * Bu test kasten "gorunur mu, tiklanir mi"nin otesine gecer.
   *
   * Onceki surumde secici teknik olarak calisiyordu - menuitem'lar DOM'daydi,
   * tiklaniyordu, testler yesildi - ama gercek ekranda kullanilamiyordu: panel
   * viewport'un disina tasiyor, isaret yariya kirpiliyor, aktif oge sayfa
   * icerigiyle ic ice giriyordu. "Var ve tiklanabilir" bir arayuzun
   * kullanilabilir oldugunu KANITLAMAZ. Asagidaki olcumler o boslugu kapatir.
   */
  test('acik yay ekrana sigar ve dokunma hedefleri yeterli', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');
    await page.getByRole('button', { name: '5N boyut seçici' }).first().click();

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport bilinmiyor');

    // 1. Aktif oge tam opak ve tam gorunur olmali.
    const activeItem = page.getByRole('menuitem', { name: /^Ne —/ });
    const box = await activeItem.boundingBox();
    if (!box) throw new Error('aktif oge olculemedi');

    expect(await activeItem.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

    // 2. WCAG 2.2 hedef boyutu: 44x44'un altina dusmemeli.
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    // 3. Hicbir kenari viewport disinda kalmamali (kirpilma yok).
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

    // 4. Merkezdeki N isareti de butunuyle ekranda olmali; yarisi disarida
    //    kalan bir gobek kullanicinin sikayet ettigi tam olarak buydu.
    const hub = page.getByRole('button', { name: 'Seçiciyi kapat' });
    const hubBox = await hub.boundingBox();
    if (!hubBox) throw new Error('gobek olculemedi');
    expect(hubBox.x).toBeGreaterThanOrEqual(0);
    expect(hubBox.x + hubBox.width).toBeLessThanOrEqual(viewport.width);
    expect(hubBox.y).toBeGreaterThanOrEqual(0);
    expect(hubBox.y + hubBox.height).toBeLessThanOrEqual(viewport.height);

    // 5. Yayin uclari gercekten soluyor (spec 4.4/2). Uctaki yuva secim
    //    noktasindan iki adim uzaktadir ve belirgin sekilde saydamdir.
    const farItem = page.getByRole('menuitem', { name: /^Ne zaman —/ });
    const farOpacity = Number(await farItem.evaluate((el) => getComputedStyle(el).opacity));
    expect(farOpacity).toBeGreaterThan(0);
    expect(farOpacity).toBeLessThan(0.35);
  });

  test('yay sonsuz doner: son boyuttan sonra yeniden ilki gelir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');
    await page.getByRole('button', { name: '5N boyut seçici' }).first().click();

    // Bes boyut da bir kez gecilir ve basa donulur. Onceki surumde dizi iki
    // ucunda duruyordu: "Ne" secili iken ustunde bos bir yay parcasi kaliyor,
    // "Neden"de ise donus tamamen tikaniyordu.
    const order = [/^Nerede —/, /^Ne zaman —/, /^Nasıl —/, /^Neden —/, /^Ne —/];
    for (const name of order) {
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name })).toBeFocused();
    }

    // Ters yon de sarar: "Ne"den yukari gitmek son boyuta goturur.
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('menuitem', { name: /^Neden —/ })).toBeFocused();

    // Yayin ustunde de altinda da yuva vardir; hicbiri bos degil.
    const above = page.getByRole('menuitem', { name: /^Nasıl —/ });
    await expect
      .poll(async () => Number(await above.evaluate((el) => getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.5);
  });

  test('gorunen bir secenege tek dokunus onu secer', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');
    await page.getByRole('button', { name: '5N boyut seçici' }).first().click();

    // "Nerede" secim noktasinda DEGIL, yayin bir alt basamagindadir. Onceki
    // davranista ilk dokunus onu yalnizca secim noktasina getiriyordu ve
    // kullanici acisindan hicbir sey olmuyordu. Artik once kayar, sonra secer.
    await page.getByRole('menuitem', { name: /^Nerede —/ }).click();
    await expect(page).toHaveURL(/\/explore\/map/);
  });

  test('yay acikken sayfa kaymaz, secici kayar', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore');
    await page.getByRole('button', { name: '5N boyut seçici' }).first().click();

    // Yay tekerlekle donuyorsa sayfanin kendisi kaymamali; aksi halde secici
    // parmagin altindan kayip gider.
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
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
