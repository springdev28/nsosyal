# Kod okuma rehberi

Bu rehber nSosyal kodunu ilk kez açan bir ekip üyesinin sistemi dosya dosya
gezmeden anlaması içindir. Ürün kuralları [PROJECT_SPEC.md](../PROJECT_SPEC.md),
güncel teknik durum [architecture.md](architecture.md), önemli tercihlerin
gerekçeleri ise [decisions/](decisions/) altındadır.

## 1. Önce şu sekiz dosyayı okuyun

| Sıra | Dosya | Neyi öğretir? |
| --- | --- | --- |
| 1 | `PROJECT_SPEC.md` | Uygulamanın ne yapması gerektiğini ve değişmez ürün kurallarını |
| 2 | `src/types/domain.ts` | Saklanan temel varlıkları ve alan adlarını |
| 3 | `src/types/view.ts` | UI'a verilen birleştirilmiş, sorguya hazır görünüm modellerini |
| 4 | `src/lib/data/store.ts` | Demo verisinin tek okuma/yazma sınırını ve iş kurallarını |
| 5 | `src/lib/auth/session.ts` | Oturumun ve rol kontrolünün sunucuda nasıl yapıldığını |
| 6 | `src/app/(app)/layout.tsx` | Oturumlu sayfaların ortak veri yükleme ve kabuk sınırını |
| 7 | `src/components/layout/AppShell.tsx` | Masaüstü üç kolon ve mobil gezinme düzenini |
| 8 | `tests/e2e/competition-flows.spec.ts` | Bir kullanıcının gerçek uçtan uca yolculuklarını |

Bir özelliği değiştirirken önce ilgili sayfayı, sonra onun çağırdığı store veya
action metodunu, en son testi okuyun. Seed dosyasından başlayıp UI'a doğru gitmek
genellikle daha zordur.

## 2. Katmanların sorumluluğu

```text
tarayıcı etkileşimi
        |
        v
Client Component  ---- form / olay ---->  Server Action
        ^                                      |
        | props                                | oturum + doğrulama
        |                                      v
React Server Component  <-----------------  DemoStore
        |                                      |
        v                                      v
     HTML/UI                           domain + view modelleri
```

| Katman | Yer | Sorumluluk | Burada olmaması gereken |
| --- | --- | --- | --- |
| Rotalar ve sayfalar | `src/app/` | URL parametrelerini okumak, oturumu ve store'u çağırmak, view modelini bileşene vermek | Uzun iş kuralı, global modül state'i |
| Server Actions | `src/actions/` | Kimlik/yetki kontrolü, form girdisini doğrulama, store mutasyonu, ilgili rotayı yenileme | Yalnız istemcide yapılan güvenlik kontrolü |
| Veri sınırı | `src/lib/data/store.ts` | Bütün demo okumaları, mutasyonlar, çakışma/rol/zaman kuralları ve view model join'leri | JSX veya tarayıcı API'si |
| Domain tipleri | `src/types/domain.ts` | Saklanan varlıkların şekli | Bileşene özel sunum alanı |
| View tipleri | `src/types/view.ts` | UI'ın ek sorgu yapmadan kullanacağı birleşik veri | Mutasyon ve veri saklama mantığı |
| Bileşenler | `src/components/` | Görsel sunum ve yerel etkileşim | Seed import'u veya ad-hoc veri erişimi |
| Seed | `src/lib/seed/` | Deterministik, açıkça sentetik demo verisi | Gerçek kişi/kurum taklidi, UI mantığı |
| Saf yardımcılar | `src/lib/time`, `ranking`, `geo`, `media`, `newspaper` | Tek konuya ait test edilebilir hesaplar | Oturum veya React state'i |
| Production hazırlığı | `src/lib/supabase/`, `supabase/` | Sunucu istemcileri, migration ve RLS sözleşmesi | Browser'a service-role anahtarı |
| Testler | `tests/unit`, `tests/e2e` | İş kuralı ve gerçek kullanıcı akışının kanıtı | Uygulamanın test için farklı ürün davranışı göstermesi |

## 3. Bir sayfa nasıl okunur?

Örnek: `/feed`.

1. Next.js `src/app/(app)/feed/page.tsx` dosyasını çalıştırır.
2. Sayfa `getViewer()` ile demo oturumunu okur.
3. `getStore().listFeed(...)` ham post satırı yerine `PostView[]` üretir.
4. `DemoStore`, profil ve topluluk ilişkilerini birleştirir ve
   `src/lib/ranking/rank.ts` ile açıklanabilir sıralamayı uygular.
5. Sayfa sonuçları `Composer`, `StoryRail` ve `PostCard` bileşenlerine props olarak
   geçirir.
6. Kullanıcı beğeni veya yorum gönderdiğinde `src/actions/social.ts` çalışır,
   oturumu yeniden denetler, store'u değiştirir ve ilgili rotayı revalidate eder.

Bu desen topluluk, proje, etkinlik, profil ve gazete okuyucu sayfalarında da
aynıdır: **sayfa okur, action yazar, store kuralı uygular, bileşen gösterir.**

## 4. Server ve client sınırı

Dosyanın başında `'use client'` yoksa App Router bileşeni varsayılan olarak
sunucudadır. Sunucu bileşenleri doğrudan store ve oturum okuyabilir; browser API'si
ve React etkileşim state'i kullanamaz.

`'use client'` olan dosyalar pointer, klavye, video, portal, `window`, `document`
ve yerel UI state'i kullanabilir. Kalıcı veri yazmak için yine Server Action'a
gitmeleri gerekir. İstemcide bir düğmeyi gizlemek yetki kontrolü değildir.

Hydration ve hareket tercihleri `src/lib/browser-preferences.ts` içinde tek yerde
tutulur. Böylece her client bileşeni `matchMedia` veya mount state'ini farklı
biçimde yorumlamaz.

## 5. Önemli akışları uçtan uca izleme

### Ana akış ve stories

```text
/feed/page.tsx
  -> DemoStore.listFeed
  -> rankPosts / weightsForViewer
  -> PostView
  -> PostCard + StoryRail
  -> social Server Actions
```

`StoryRail` ayrı bir “Neden” veri modeli değildir. Medyalı postları tam ekran,
klavye ve reduced-motion destekli bir izleyicide yeniden sunar.

### Global arama

```text
AppShell SearchBox veya /explore formu
  -> /explore?q=...
  -> parseFilters
  -> DemoStore.discover
  -> ProfileSummary / PostView / diğer sonuç view modelleri
  -> profil kartları + ortak PostCard
```

Arama kutusu sonuç tutmaz; yalnızca paylaşılabilir URL üretir. `/explore/page.tsx`
URL'yi okur ve bütün varlık türlerini tek seferde `DemoStore.discover` üzerinden
ister. Konum filtresi yoksa konumunu gizleyen bir kişi de ad veya kullanıcı adıyla
bulunur. İl ya da ilçe filtresi varsa Store yalnız kullanıcının paylaşmayı seçtiği
konum düzeyini kullanır. UI kesin konum veya ham profil kaydı almaz.

### Türkiye haritası

```text
/explore/map/page.tsx
  -> URL filtreleri
  -> DemoStore bölgesel yoğunluk sorguları
  -> MapExplorer (URL seçim state'i)
  -> TurkeyMap (MapLibre + yerel GeoJSON)
  -> aynı verinin erişilebilir sonuç listesi
```

`TurkeyMap` dış tile hizmeti çağırmaz. İl ve ilçe poligonları `public/geo/`
altındadır. Yoğunluk nüfus veya canlı kişi konumu değil, seçili platform
varlıklarının sayısı/normalize skorudur. `metric` URL filtresi topluluk,
etkinlik, proje, kurum, kişi veya paylaşım sayısını seçer. Sayfa, Store'un tür
kırılımını koruyup yalnız haritada kullanılan `total` değerini seçilen türe göre
üretir; böylece tooltip kırılımı ile renk ölçeği aynı veri anlık görüntüsünden gelir.

### Topluluk moderasyonu

```text
ApplicationForm
  -> submitCommunityApplication
  -> DemoStore.submitApplication
  -> /admin/moderation
  -> reviewCommunityApplication
  -> topluluk + moderation log + bildirim
```

Topluluk başvuru anında kurulmaz. Moderatör kararı ve denetim kaydı aynı sunucu
mutasyonu içinde oluşur.

### Proje ve pitch videosu

```text
ProjectForm
  -> createProject
  -> MIME + byte + MP4/WebM süre doğrulaması
  -> DemoStore.createProject
  -> proje detay view modeli
```

Dosya doğrulaması proje kaydından önce yapılır; bozuk yükleme yarım proje
bırakmaz. Production'da yerel dosya yazımı Storage/worker hattıyla değişmelidir.

### Sosyal eylem ve Kaydedilenler

```text
PostCard / VideoFeedPage
  -> social Server Action
  -> DemoStore.toggleLike / toggleSave / createComment
  -> ilgili rotanın revalidate edilmesi
  -> /saved/page.tsx
  -> DemoStore.listSavedPosts
  -> aynı PostView + PostCard sunumu
```

`/saved` bir profil filtresi değildir. Kişisel koleksiyon ayrı rota olduğu için
masaüstü gezinmede doğru aktif durum, mobilde profil içinden görünür giriş ve
doğrudan gizlilik sınırı sağlanır. Kart sunumu kopyalanmaz; ana akışla aynı
`PostView` ve `PostCard` sözleşmesi kullanılır.

### nGazete okuyucu

```text
/newspaper/page.tsx
  -> İstanbul saatine göre açık sayı
  -> DemoStore.getNewspaperIssue
  -> editoryal + sponsorlu item view modelleri
  -> masthead, kolonlar, sayfa navigasyonu
```

Sponsorlu içerik gazete yerleşiminin içindedir ve `Sponsorlu` etiketi taşır.
`src/lib/ranking/rank.ts` gazete veya ödeme modüllerini import etmez.

### Yayın Atölyesi

```text
/publish/page.tsx (ayrı kabuk)
  -> PublicationStudio yerel taslak state'i
  -> publication Server Actions
  -> DemoStore alan/CTA/revision/çakışma doğrulaması
  -> ödeme niyeti + moderasyon
  -> onay anında değişmez NewspaperItem kopyası
  -> İstanbul saatiyle 06.00 yayın sınırı
```

Rezervasyon yalnızca niyettir; kesin hak ödeme kaydıdır. Ödeme başlamadan hemen
önce sunucu paid alanlarla yeniden çakışma kontrolü yapar. Önizleme ve okuyucu,
editör ızgarasını veya seçim çerçevesini göstermez.

## 6. Zaman ve gün sınırı

Tarih hesabı için doğrudan `new Date().toLocaleString(...)` yaymayın.
`src/lib/time/` Europe/Istanbul gününü tek sözleşmede tutar. nGazete 06.00 yayın,
20.00 taslak kapanış ve “bugünün sayısı” davranışları bu katmandan türemelidir.

## 7. Yorumları nasıl okuyup eklemeli?

Kaynak kod yorumları kısa ve sade İngilizce yazılır. Yorum, sıfırdan başlayan bir
okura bloğun görevini, neden ayrı olduğunu ve hangi dosya ya da veri akışıyla
bağlantılı olduğunu anlatmalıdır. `x değerini artır` gibi kodu tekrar eden yorum
eklenmez; bu tür yorumlar değişiklikte hemen eskir.

Çekirdek giriş noktalarında dosya üstü yorumlar bulunur: `DemoStore`, domain/view
tipleri, ranking, AppShell, harita, 5N seçici, story izleyici, Yayın Atölyesi ve
publication action'ları. Basit route wrapper'ları ve yalnız JSX düzenleyen küçük
sayfalar ayrıca satır satır açıklanmaz; ilişkileri bu rehberden takip edilir.
`*.generated.ts` ve `public/geo/*.geojson` dosyaları elle yorumlanmaz veya
düzenlenmez.

Yeni yorum eklemeden önce şu sorulardan en az birine “evet” denmelidir:

- Bu satır bir ürün kuralını yanlışlıkla bozmayı önlüyor mu?
- Güvenlik veya veri kaybı riski ilk bakışta görünmüyor mu?
- React/Next/browser yaşam döngüsü sıradan okumanın tersine mi davranıyor?
- Sabit sayı veya sıra dışı algoritma için ölçülmüş bir gerekçe var mı?

## 8. Değişiklik yapma kontrol listesi

1. En güncel ürün kararını ve ilgili ADR'yi okuyun.
2. Rotayı ve ona veri veren store/action metodunu bulun.
3. Domain alanı gerekiyorsa önce `domain.ts`, UI join'i gerekiyorsa `view.ts`
   sözleşmesini değiştirin.
4. Okumayı sayfada, yazmayı action + store sınırında tutun.
5. İlgili birim testini ve E2E kullanıcı akışını güncelleyin.
6. `npm run verify`, `npm run build` ve ilgili Playwright testini çalıştırın.
7. Mobil ve masaüstü görünümü, klavye ve reduced-motion davranışını inceleyin.
8. `main` push'undan sonra iki `/api/health` yanıtının da aynı SHA'yı gösterdiğini
   doğrulayın.

## 9. Hızlı sözlük

- **Domain model:** Saklanan veya mutasyona giren temel veri biçimi.
- **View model:** UI'ın ek join/sorgu yapmadan göstereceği birleşik biçim.
- **DemoStore:** Yarışma demosundaki tek veri erişim ve iş kuralı sınırı.
- **Server Action:** Tarayıcı form/olayını yetkili sunucu mutasyonuna çeviren işlev.
- **RSC:** Veriyi sunucuda okuyup HTML/props üreten React Server Component.
- **Transient intent:** `Sosyalleş`, `Keşfet`, `Öğren`, `Üret` geçici bağlamı.
- **Kalıcı hedef:** Ayarlar'da saklanan uzun vadeli platform amacı.
- **Publication draft:** Yayın Atölyesi'ndeki seçili alan, kreatif ve CTA taslağı.
- **Publication slot:** Rezerve veya ödenmiş mekânsal gazete envanteri.
- **Pricing snapshot:** Fiyat katsayıları değişse de başvurudaki teklifin korunmuş
  sonucu.
