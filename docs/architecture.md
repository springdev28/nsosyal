# Mimari

Bu belge sistemin nasıl kurulduğunu ve neden böyle kurulduğunu anlatır. Ürün
kurallarının kendisi için [PROJECT_SPEC.md](../PROJECT_SPEC.md), kararların
gerekçeleri için [decisions/](decisions/) klasörüne bakın.

## 1. Genel görünüm

```
tarayıcı
   │
   ├── React Server Components (sayfalar, veri yükleme)
   ├── Client bileşenleri (harita, video, formlar, tema anahtarı)
   │
Server Actions  ──►  DemoStore  ──►  sentetik seed (bellek içi)
   (yazma yolu)          │
                         └──►  (DEMO_MODE=false) Supabase Postgres + RLS
```

Ayrı bir API katmanı yoktur. Sayfalar sunucuda veriyi okur, mutasyonlar Server
Action'lar üzerinden gider. Bu, prototipte hem daha az kod hem de daha az kaçak
yol demektir: istemciden doğrudan veri katmanına erişilebilecek bir uç kalmaz.

İki teknik uç nokta vardır: `/api/health` (Playwright'ın sunucuyu beklemesi için)
ve `/api/demo/reset` (testlerin veriyi sıfırlaması için; DEMO_MODE dışında 403).

## 2. İki mod: demo ve Supabase

`DEMO_MODE` açıkça `false` yapılmadıkça uygulama demo modundadır
(`src/lib/supabase/config.ts`).

**Demo modu (varsayılan).** Tüm veri `src/lib/seed/` altındaki üreticilerle sunucu
belleğinde kurulur ve `DemoStore` üzerinden okunur/yazılır. Dış servis, API anahtarı
ve internet gerekmez. Yarışma demosunun kesintiye dayanıklı olması ve jürinin
depoyu klonlayıp tek komutla çalıştırabilmesi için varsayılan budur.

**Supabase modu.** `DEMO_MODE=false` iken Supabase ortam değişkenleri zorunlu olur;
eksikse uygulama sessizce çalışmaya devam etmek yerine açık hata verir. Şema,
tetikleyiciler ve RLS politikaları `supabase/migrations/` altında, istemci
üreticileri `src/lib/supabase/` altında hazırdır. Eksik olan tek parça, store'un
Supabase'e karşı yazılmış ikinci uygulamasıdır (bkz. [13. Bilinen sınırlar](#13-bilinen-sınırlar)).

Karar kaydı: [0001](decisions/0001-demo-modu-ve-bellek-ici-veri-deposu.md).

## 3. Veri katmanı

`src/lib/data/store.ts` içindeki `DemoStore` sınıfı tek erişim noktasıdır. Sayfalar
ve action'lar seed modüllerini doğrudan okumaz; hepsi store metotlarını çağırır.
Supabase'e geçiş, aynı metot imzalarını koruyan ikinci bir uygulama yazmak
anlamına gelir.

- Örnek `globalThis` üzerinde tutulur; Next.js geliştirme modunda modülleri yeniden
  yüklediğinde veri sıfırlanmasın diye.
- Kimlikler FNV-1a tabanlı deterministik UUID'lerle üretilir (`src/lib/seed/ids.ts`).
  Böylece sunucu yeniden başlasa da seed edilmiş bağlantılar (`/projects/ruzgar-olcer`
  gibi) ve testlerdeki kimlikler aynı kalır.
- Sayaçlar (beğeni, yorum, üye, takipçi) yazma sırasında güncellenir; Supabase
  tarafında aynı işi tetikleyiciler yapar.

### Görünüm modelleri

`src/types/domain.ts` veritabanı biçimindeki varlıkları, `src/types/view.ts` ise
arayüzün ihtiyaç duyduğu birleştirilmiş görünümleri tanımlar (`PostView`,
`CommunityView`, `EventView`, …). Bileşenler yalnızca görünüm modeli alır; ilişki
çözme işi store'da toplanır.

## 4. Akış sıralaması

`src/lib/ranking/rank.ts` ağırlıklı, açıklanabilir bir skor hesaplar; makine
öğrenmesi yoktur. Sinyaller: konu eşleşmesi, takip edilen kaynak, topluluk
eşleşmesi, niyet uyumu, tazelik, konum eşleşmesi, keşif bonusu. Niyet modu
(Sosyalleş / Keşfet / Öğren / Üret) ağırlıkları yeniden dağıtır; toplam her modda
1.0'da kalır, böylece skorlar modlar arasında karşılaştırılabilir.

Tazelik üstel azalır (yarılanma süresi 36 saat). "Yeni sesler" için az takipçili
hesaplara küçük bir keşif payı ayrılır.

**"Neden gösteriliyor?"** açıklaması yalnızca beş sinyalden (konu, takip, topluluk,
konum, keşif) en güçlüsünü söyler. Niyet uyumu ve tazelik açıklama olarak
gösterilmez: ikisi de hemen her kartta yüksek çıkar ve açıklamayı anlamsızlaştırır.

**Ücretli görünürlük bu modülde yoktur.** Sıralama sponsorluk, ilan veya gazete
kavramlarını bilmez ve o modüllerden import yapmaz; `tests/unit/ranking.test.ts`
dosyanın kaynağını okuyarak bunu doğrular. Karar kaydı:
[0004](decisions/0004-ucretli-gorunurluk-yalnizca-ngazetede.md).

## 5. Harita

`src/components/map/TurkeyMap.tsx` MapLibre GL JS kullanır ama **tile sunucusuna
bağlanmaz**. Stil nesnesi tamamen yereldir (tek bir arka plan katmanı) ve
poligonlar `public/geo/` altındaki GeoJSON dosyalarından gelir: 81 il ve pilot il
İzmir'in 30 ilçesi. Veri OpenStreetMap'ten türetilmiş, Douglas–Peucker ile
sadeleştirilmiştir (~210 KB toplam) ve uygulama içinde ODbL kaynağı gösterilir.

Stil nesnesinde `glyphs` tanımlı değildir; hiçbir katman metin çizmediği için
gereksizdir ve tanımlamak uzak bir font sunucusuna bağımlılık yaratırdı.

Vurgu ve seçim `feature-state` ile yapılır, böylece her etkileşimde kaynak yeniden
yüklenmez. Harita erişilebilirlik açısından **yardımcı** bir görünümdür: aynı
sonuçlar her zaman sayfadaki il listesi ve sonuç panelinde metin olarak da
bulunur. Sarmalayıcı `role="group"`tur — MapLibre kendi odaklanabilir tuvalini,
yakınlaştırma düğmelerini ve kaynak bağlantısını içine eklediği için `img` rolü
yanlış olurdu. Karar kaydı: [0003](decisions/0003-yerel-geojson-ile-tile-sunucusuz-harita.md).

## 6. Medya

Demo videoları gerçek, oynatılabilir WebM dosyalarıdır (21 klip, ~6 MB) ve
`scripts/build-demo-media.ts` ile üretilir. Görseller ve posterler sentetik SVG'dir.
Hepsi repoda durur; demo sırasında ağdan hiçbir şey indirilmez.

`VideoPlayer` sesi varsayılan kapalı başlatır, `prefers-reduced-motion` tercihinde
otomatik oynatmaz ve her videonun metin karşılığını açılabilir bir panelde sunar.
Yükleme kısıtları (`src/lib/media/constraints.ts`) hem formda hem action'da
uygulanır. Karar kaydı: [0005](decisions/0005-sentetik-demo-medyasi.md).

## 7. Oturum ve roller

Demo modunda oturum, yalnızca kullanıcı adını taşıyan bir çerezdir
(`src/lib/auth/session.ts`); imzalı token yoktur. Bu bilinçli bir demo tercihidir —
jüri parola girmeden hesap değiştirebilsin diye. Gerçek kimlik doğrulama Supabase
Auth ile yapılır; şema bunu `profiles.id → auth.users.id` bağıyla ve
`handle_new_user` tetikleyicisiyle hazırlar.

Roller: `user`, `organization`, `moderator`, `admin`. Yetki kontrolleri sunucu
tarafındadır; `/admin` altındaki sayfalar rolü doğrulamadan hiçbir veri
döndürmez.

## 8. Güvenlik ve mahremiyet

- **Konum:** en ince ayrıntı ilçedir. Kesin adres, koordinat veya canlı konum
  saklanmaz. Kullanıcı konum görünürlüğünü ayarlardan kapatabilir; kapattığında
  keşif kısıtlanmaz, yalnızca kendisi yerel kişi sonuçlarında görünmez.
- **RLS:** tüm tablolarda `enable` **ve** `force row level security` açıktır — tablo
  sahibi bile politikaları atlayamaz. Rol yükseltme ve kaynak sahipliği ayrıca
  tetikleyicilerle korunur (`guard_profile_privileges`).
- **Anahtarlar:** service-role anahtarı yalnızca sunucu tarafında okunur ve hiçbir
  zaman `NEXT_PUBLIC_` önekiyle tanımlanmaz.
- **Moderasyon:** topluluk başvuruları, raporlar ve gazete ilanları kuyruklara
  düşer; her karar `moderation_actions` kaydına yazılır.

## 9. Zaman

Ürünün günü **Europe/Istanbul** günüdür, sunucunun yerel saati değil.
`src/lib/time` bu dönüşümü sabit UTC+3 ile yapar ve "bugünün gazetesi", etkinlik
aralıkları, son başvuru uyarıları hep bu güne göre hesaplanır. Aksi hâlde UTC'de
çalışan bir sunucuda bugünün sayısı akşam 21:00'den sonra kaybolurdu — bu gerçek
bir hataydı; `tests/unit/store.test.ts` içindeki regresyon testi gün sınırını aşan
bir anda gazete sayısını arar, `tests/unit/time.test.ts` ise dönüşümün kendisini
sabitler.

## 10. Tasarım sistemi

Görsel dil canlı nsosyal.com arayüzünden alınmıştır: koyu varsayılan tema, üç
kolonlu masaüstü düzeni (sol gezinme, merkez içerik, sağ panel), 16 px yuvarlak
kartlar, tam yuvarlak düğmeler, canlı mavi vurgu ve camgöbeği→mavi gradyan birincil
eylem. Mobilde alt gezinme çubuğu.

Renkler `src/app/globals.css` içinde iki katmanlıdır: `:root` koyu paleti taşır,
açık tema hem `prefers-color-scheme` hem de kullanıcının `[data-theme]` tercihiyle
devreye girer. 5N1K boyut renkleri her iki temada ayrı değerler alır, çünkü bağlam
çipi kendi renginin %12'sini zemin olarak kullanır — koyu tema için ayarlanmış canlı
tonlar açık zeminde 1.5:1'e kadar düşüyordu.

Arayüz mobilyası (ikonlar) emoji değil, `src/components/ui/Icon.tsx` içindeki tek
tip SVG setidir: emoji her platformda farklı çizilir, boyutu ve optik ağırlığı
denetlenemez. Karar kaydı: [0006](decisions/0006-tasarim-dilini-canli-siteden-almak.md).

## 11. Erişilebilirlik

Hedef WCAG 2.2 AA. Uygulanan denetimler:

- klavyeyle erişilebilir tüm kontroller, gizlenmeyen odak göstergesi, atlama
  bağlantısı;
- renk tek başına durum iletmez: seçili filtre onay işareti, aktif sekme alt çizgi,
  seçili il sınır + metin taşır;
- ikon düğmelerinde erişilebilir isim, formlarda `aria-describedby` ile
  ilişkilendirilmiş hata mesajları;
- en az 24 px dokunma hedefi;
- yatay kayan alanlar klavyeyle odaklanabilir;
- `prefers-reduced-motion`: animasyonlar kısalır, video otomatik oynamaz, gazetenin
  kapatma gecikmesi kalkar;
- gazete modalında odak tuzağı ve Esc ile kapatma;
- harita için liste eşdeğeri, video için metin karşılığı.

Otomatik tarama `tests/e2e/accessibility.spec.ts` içindedir: tüm ana sayfalar, açık
ve koyu tema, masaüstü ve mobil profil. Otomatik testin kanıtlamadıkları (klavye
sırası, ekran okuyucu deneyimi) elle kontrol edilir; dosyanın başındaki uyarı bunu
hatırlatır.

## 12. Test stratejisi

| Katman | Araç | Kapsam |
| --- | --- | --- |
| Birim | Vitest | sıralama, zaman, veri deposu (97 test) |
| Akış | Playwright | yarışma için kritik 7 akış + ek senaryolar |
| Erişilebilirlik | axe-core | ana sayfalar × 2 tema × 2 görünüm |

Tüm E2E testleri tek bir sunucu içi veri deposunu paylaştığı için Playwright tek
işçiyle çalışır ve her test öncesi `/api/demo/reset` çağrılır.

## 13. Bilinen sınırlar

- Demo modunda veri sunucu belleğindedir: süreç yeniden başlarsa değişiklikler
  kaybolur. Bu, gösterim için istenen davranıştır.
- Supabase yolu şema ve politika düzeyinde hazırdır; uygulama katmanının Supabase
  uygulaması (store'un ikinci uygulaması) yazılmamıştır.
- Arama basit metin eşleşmesidir; tam metin arama ve öneri motoru kapsam dışıdır.
- Bildirimler sunucu içinde üretilir; gerçek zamanlı kanal (Supabase Realtime)
  bağlanmamıştır.
