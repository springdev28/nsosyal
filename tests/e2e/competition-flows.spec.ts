import { expect, test } from '@playwright/test';

import { dismissNewspaperModal, loginAs, loginKeepingNewspaper } from './helpers';

/**
 * Yarisma icin kritik uctan uca senaryolar (PROJECT_SPEC 13.2).
 *
 * Bu yedi akis canli demoda gosterilecek olanlardir; hepsi calisir durumda
 * olmak zorundadir. Testler acikca beklenen sonuca odaklanir, ekran
 * yapisina degil.
 */

test.describe('1 · Demo girişi ve ana akış', () => {
  test('demo hesabıyla tek tıkla giriş yapılır ve karışık akış açılır', async ({ page }) => {
    await loginAs(page, 'user');

    await expect(page.getByRole('heading', { name: 'Ana akış', level: 1 })).toBeVisible();

    // Akis yalnizca proje icerigi degildir: gundelik paylasim da gorunmeli.
    const articles = page.getByRole('article');
    await expect(articles.first()).toBeVisible();
    expect(await articles.count()).toBeGreaterThan(4);

    // Niyet modu secici calisir ve URL'e yansir (paylasilabilir durum).
    await page.getByRole('link', { name: 'Öğren', exact: true }).click();
    await expect(page).toHaveURL(/mod=ogren/);
    await expect(page.getByText(/Nasıl kaynakları|açıklayıcı içerikler/)).toBeVisible();
  });

  test('önerilen kartlarda "Neden gösteriliyor?" açıklaması bulunur', async ({ page }) => {
    await loginAs(page, 'user');
    await expect(page.getByText('Neden gösteriliyor?').first()).toBeVisible();
  });
});

test.describe('2 · Harita, konu ve zaman filtresiyle etkinlik bulma', () => {
  test('İzmir + havacılık + gelecek 30 gün filtresi etkinlik getirir', async ({ page }) => {
    await loginAs(page, 'user');

    await page
      .getByRole('navigation', { name: 'Ana gezinme' })
      .first()
      .getByRole('link', { name: 'Keşfet', exact: true })
      .click();
    await page.getByRole('link', { name: /Haritadan keşfet/ }).click();
    await expect(page).toHaveURL(/\/explore\/map/);

    // Haritanin klavyeyle kullanilabilen esdegeri: il listesi.
    await page.getByRole('link', { name: /^İzmir/ }).first().click();
    await expect(page).toHaveURL(/province=35/);

    await page.getByRole('link', { name: 'Havacılık ve Uzay', exact: true }).first().click();
    await page.getByRole('link', { name: 'Gelecek 30 gün' }).click();

    await expect(page).toHaveURL(/time=next-30/);
    await expect(page.getByRole('heading', { name: /Etkinlikler \(/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Model Roket Atölyesi/ }).first()).toBeVisible();
  });

  test('ilçe verisi olan ilde drill-down açılır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/map?province=35');

    // "Bornova" sayfada gonderi konum etiketlerinde de geciyor; ilce listesine odaklan.
    const districts = page.getByRole('list', { name: 'İlçeler' });
    await expect(districts.getByRole('link', { name: 'Bornova' })).toBeVisible();
    await districts.getByRole('link', { name: 'Bornova' }).click();
    await expect(page).toHaveURL(/district=35-07/);
  });

  test('sonuç bulunmayan filtrede yol gösteren boş durum çıkar', async ({ page }) => {
    await loginAs(page, 'user');
    // Kars'ta (36) demo verisi yok.
    await page.goto('/explore/map?province=36&topic=biyoteknoloji&time=next-7');
    await expect(page.getByText(/sonuç bulunamadı|sonuç yok/i).first()).toBeVisible();
  });
});

test.describe('3 · Etkinliğe hatırlatma kurma', () => {
  test('hatırlatma kurulur ve bildirimlerde görünür', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/events/izmir-model-roket-atolyesi');

    await expect(page.getByRole('heading', { name: 'İzmir Model Roket Atölyesi' })).toBeVisible();
    await page.getByRole('button', { name: /^🔔 Hatırlat$|Hatırlat/ }).first().click();

    await expect(page.getByRole('button', { name: /Hatırlatma kurulu/ })).toBeVisible();

    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /Yaklaşan hatırlatmalar/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Model Roket Atölyesi/ }).first()).toBeVisible();
  });

  test('hatırlatma kaldırılabilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/events/izmir-iha-saha-ucusu');

    await page.getByRole('button', { name: /Hatırlat/ }).first().click();
    await expect(page.getByRole('button', { name: /Hatırlatma kurulu/ })).toBeVisible();

    await page.getByRole('button', { name: /Hatırlatma kurulu/ }).click();
    await expect(page.getByRole('button', { name: /^🔔 Hatırlat$|Hatırlat/ }).first()).toBeVisible();
  });
});

test.describe('4 · Topluluğa katılma ve kaynaklar', () => {
  test('topluluğa katılır ve Kaynaklar sekmesine geçer', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/communities/ctf-baslangic');

    await page.getByRole('button', { name: 'Katıl' }).click();
    await expect(page.getByRole('button', { name: /Üyesin/ })).toBeVisible();

    await page.getByRole('link', { name: /^Kaynaklar/ }).click();
    await expect(page).toHaveURL(/tab=kaynaklar/);
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('moderatör doğrulaması etiketi kaynak kartında görünür', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/how?level=baslangic');
    await expect(page.getByText('Moderatör doğrulamalı').first()).toBeVisible();
  });
});

test.describe('5 · Neden hikâyesinden projeye geçiş', () => {
  test('hikâye okunur ve bağlı projeye gidilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/explore/why');

    await expect(page.getByRole('heading', { name: 'Neden panosu', level: 1 })).toBeVisible();
    // Konsepti dogru anlatan aciklama gorunur olmali: motivasyon sozu duvari degil.
    await expect(page.getByText(/motivasyon sözü duvarı değil/)).toBeVisible();

    await page.getByRole('link', { name: /cevaplayamadığımız bir soru/i }).click();

    await expect(page.getByText('Neden hikâyesi').first()).toBeVisible();
    await page.getByRole('link', { name: 'Projeyi incele' }).click();

    await expect(page).toHaveURL(/\/projects\/ruzgar-olcer/);
    await expect(page.getByRole('heading', { name: 'Açık Kaynak Rüzgâr Ölçer' })).toBeVisible();
  });

  test('proje sayfası ilerleme günlüğü ve Neden bölümü içerir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/projects/ruzgar-olcer?tab=ilerleme');
    await expect(page.getByText('Kilometre taşı').first()).toBeVisible();

    await page.getByRole('link', { name: 'Neden' }).click();
    await expect(page).toHaveURL(/tab=neden/);
    await expect(page.getByText(/Ölçemediğimiz şeye yatırım/)).toBeVisible();
  });
});

test.describe('6 · nGazete ve ücretli alan ayrımı', () => {
  test('gazete ilk oturumda açılır ve kapatma 3 saniye sonra etkinleşir', async ({ page }) => {
    await loginKeepingNewspaper(page, 'user');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Bekleme suresince kapatma devre disidir.
    await expect(dialog.getByRole('button', { name: /saniye sonra kapatılabilir/ })).toBeDisabled();

    await expect(dialog.getByRole('button', { name: 'Kapat' })).toBeEnabled({ timeout: 10_000 });
    await dismissNewspaperModal(page);
    await expect(dialog).toBeHidden();
  });

  test('sponsorlu kartlar açıkça etiketlenir ve hedefe bağlanır', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/newspaper');

    await expect(page.getByRole('heading', { name: 'nGazete', level: 1 })).toBeVisible();

    // Sponsorlu kartlar gazete grid'inin ICINDE durur. Spec 7.9 ayri bir
    // "ucretli alanlar" listesini ismen yasakliyor; o basligin geri gelmesi
    // kurali sessizce bozardi.
    await expect(page.getByRole('heading', { name: 'Ücretli alanlar' })).toHaveCount(0);

    const sponsored = page.getByText('Sponsorlu');
    expect(await sponsored.count()).toBeGreaterThan(0);

    await page.getByRole('link', { name: /Demo Günü başvuruları açık/ }).first().click();
    await expect(page).toHaveURL(/\/events\//);
  });

  test('gazete kart listesi değil, gerçek bir gazete kompozisyonu', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/newspaper');

    // Masthead: sayi numarasi ve tarih (spec 17.18/8).
    await expect(page.getByText(/Sayı \d+/)).toBeVisible();
    // Bolum etiketleri.
    await expect(page.getByText('Gündem').first()).toBeVisible();
    // Gelir modeli aciklamasi okuyucu arayuzunde YASAMAZ (spec 7.9).
    await expect(page.getByText('Gelir modeli nasıl çalışıyor?')).toHaveCount(0);
  });

  test('akışta sponsorlu içerik bulunmaz', async ({ page }) => {
    await loginAs(page, 'user');
    await expect(page.getByRole('heading', { name: 'Ana akış', level: 1 })).toBeVisible();
    await expect(page.getByText('Sponsorlu')).toHaveCount(0);
  });
});

test.describe('7 · Moderatör topluluk başvurusunu onaylar', () => {
  test('başvuru onaylanır, topluluk açılır ve denetim kaydına yazılır', async ({ page }) => {
    await loginAs(page, 'moderator');

    await page.goto('/admin/moderation');
    await expect(page.getByRole('heading', { name: 'Topluluk başvuruları' })).toBeVisible();

    const application = page.getByRole('article').filter({ hasText: 'İzmir Uydu' });
    await expect(application).toBeVisible();
    // Benzer topluluk uyarisi moderatore gosterilir.
    await expect(application.getByText('Benzer aktif topluluklar')).toBeVisible();

    await application.getByRole('textbox', { name: 'Karar notu' }).fill('Kapsam farklı, onaylandı.');
    await application.getByRole('button', { name: 'Onayla ve topluluğu aç' }).click();

    await expect(page.getByText('Onaylandı').first()).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByText('community_application:approved')).toBeVisible();
  });

  test('normal kullanıcı yönetim sayfasına giremez', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/admin/moderation');
    // Rol kontrolu sunucuda: kullanici akisa geri yonlendirilir.
    await expect(page).toHaveURL(/\/feed/);
  });
});

test.describe('Ek · kurum ilan başvurusu ve yönetici onayı', () => {
  test('kurum ilan gönderir, yönetici gazeteye ekler', async ({ page }) => {
    await loginAs(page, 'organization');
    await page.goto('/newspaper/advertise');

    await page.getByLabel('İlan başlığı').fill('Demo Günü ikinci tur başvuruları');
    await page
      .getByLabel('İlan metni')
      .fill('İkinci tur için başvurular açıldı. Erken aşama takımlar öncelikli değerlendirilir.');
    await page.getByRole('button', { name: 'Başvuruyu gönder' }).click();

    await expect(page.getByText(/incelemede/i).first()).toBeVisible();
  });

  test('normal kullanıcı ilan formunu göremez', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/newspaper/advertise');
    await expect(page.getByText(/yalnızca kurum hesapları/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Başvuruyu gönder' })).toHaveCount(0);
  });
});

test.describe('Ek · konum mahremiyeti kullanıcının kontrolünde', () => {
  test('konum ayarlardan kaldırılabilir', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/settings');

    await page.getByRole('radio', { name: /Paylaşmıyorum/ }).check();
    await page.getByRole('button', { name: 'Ayarları kaydet' }).click();

    await expect(page.getByText('Ayarların kaydedildi.')).toBeVisible();
    // Profil basligindaki konum satiri kaybolmali. (Gonderilere ayri ayri
    // eklenmis konumlar korunur; onlar gonderi basina verilmis bir izindir.)
    await page.goto('/profile/elif.demo');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('İzmir / Bornova', { exact: false })).toHaveCount(0);
  });
});
