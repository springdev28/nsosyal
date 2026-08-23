# Mimari

Bu belge sistemin **mevcut teknik durumunu** ve güncel ürün hedefiyle arasındaki
farkları birlikte anlatır. Ürün sözleşmesi için [PROJECT_SPEC.md](../PROJECT_SPEC.md),
kararların gerekçeleri için [decisions/](decisions/) klasörüne, kodu hangi sırayla
okuyacağınız için [kod okuma rehberine](code-reading-guide.md) bakın.

Önemli kural: mevcut kod veya veri envanteri bir ürün gereksinimi değildir. Bu
belgede "mevcut" ve "hedef" ayrımı özellikle korunur.

## 1. Genel görünüm

```text
tarayıcı
   |
   |-- React Server Components (sayfalar, veri yükleme)
   |-- Client bileşenleri (harita, video, formlar, tema, 5N selector)
   |
Server Actions  -->  DemoStore  -->  sentetik seed (bellek içi)
   (yazma yolu)          |
                         -->  (DEMO_MODE=false hedefi) Supabase Postgres + RLS
```

Ayrı bir genel REST API katmanı yoktur. Sayfalar sunucuda veriyi okur, kullanıcı
mutasyonları Server Actions üzerinden gider. Teknik uç noktalar `/api/health` ve
demo testlerini sıfırlamak için `/api/demo/reset`tir.

## 1.1. Güncel çalışma zamanı ve tarayıcı sınırı

Uygulanan sürüm **Node.js 22**, **Next.js 16.3.2 App Router**, **React
19.2.8** ve TypeScript üzerinde çalışır. `package.json`, `.nvmrc`, `.npmrc` ve CI
aynı Node ana sürümünü zorunlu tutar. Üretim komutu `next build --webpack`tir.
Bu seçim Next 16'dan geri dönüş değildir; çalışma ortamında Turbopack PostCSS
işçisinin yerel port açma girişimi `EPERM` ile engellendiği için yerel,
Hostinger ve Render çıktılarının aynı desteklenen ve tekrarlanabilir paketleyici
yolunu kullanmasını sağlar.

Tarayıcı hydration durumu ve `prefers-reduced-motion` tercihi
`src/lib/browser-preferences.ts` içindeki `useSyncExternalStore` tabanlı ortak
katmandan okunur. Sunucu snapshot'ı güvenli biçimde `false`tur; açık arayüzler
işletim sistemi tercihi değiştiğinde güncellenir. Bu katman 5N seçici, hikâye
izleyicisi ve nGazete açılış modalının ayrı `mounted`/`matchMedia` effect
zincirleri kurmasını önler.

Karar kaydı:
[0015](decisions/0015-next-16-ve-tekrarlanabilir-uretim-derlemesi.md).


## 2. Demo ve Supabase yolu

`DEMO_MODE=true` yarışma demosu için ağsız, deterministik sentetik veri yoludur.
`DemoStore` tüm okuma ve yazmaların tek erişim noktasıdır.

`DEMO_MODE=false` production yönüdür. Supabase Postgres, Auth, Storage ve RLS şema
olarak hazırlanmıştır. Store'un Supabase implementasyonu tamamlandığında aynı view
model ve action sözleşmeleri korunmalıdır.

Karar kaydı: [0001](decisions/0001-demo-modu-ve-bellek-ici-veri-deposu.md).

## 3. Veri katmanı ve görünüm modelleri

`src/lib/data/store.ts` içindeki `DemoStore` sayfa ve action katmanının tek veri
arayüzüdür. Seed modülleri sayfalar tarafından doğrudan okunmaz.

`src/types/domain.ts` veri/domain biçimini, `src/types/view.ts` ise UI'ın kullandığı
birleştirilmiş view modellerini tanımlar. Bileşenler mümkün olduğunca domain
join'leri yapmaz.

### 3.1 Kişiselleştirme modeli

Mevcut kişiselleştirme iki ayrı katman olarak uygulanır:

1. **Kalıcı profil tercihleri:** interests, long-term platform goals, content/feed
   preferences, location/privacy, notifications, accessibility ve nGazete
   preferences.
2. **Geçici niyet:** `Sosyalleş`, `Keşfet`, `Öğren`, `Üret`. Bunlar yalnızca o
   anki ranking/discovery ağırlıklarını geçici olarak değiştirir.

DemoStore profilde kontrollü `goalKeys` dizisini tutar. Ranking önce kalıcı hedef
önyargılarını taban ağırlıklara uygular, sonra varsa geçici niyet ağırlıklarını
bunun üzerine bindirir. Onboarding başlangıç değerlerini toplar; Settings iki
katmanı da daha sonra değiştirebilir.

Production Supabase adaptöründe karşılığı ayrı ilişki olmalıdır:

```text
profile_goals
  profile_id
  goal_key
  weight
  created_at
```

`goal_key` kontrollü değerlerden oluşur: socialize, meet_people,
find_communities, discover_events, discover_projects, share_projects,
find_collaborators, learn, find_resources, follow_developments,
discover_local_ecosystem, find_institutions, discover_opportunities,
casual_discussion, follow_creation_stories, discover_people.

## 4. Akış sıralaması

Mevcut `src/lib/ranking/rank.ts` makine öğrenmesi kullanmadan açıklanabilir
weighted score hesaplar. Bugünkü sinyaller topic match, followed source, community
match, transient intent, recency, optional location match ve exploration bonusudur.
Kalıcı `goalKeys` bu sinyallerin taban ağırlıklarını eğriltir; transient intent
mevcut tercihlere ek olarak kısa süreli yeniden ağırlıklandırma yapar. Mevcut
ağırlıklar demo başlangıç değerleridir, değişmez ürün gerçeği değildir.

"Neden gösteriliyor?" açıklaması kullanıcı için anlamlı en güçlü sinyali kısa
biçimde gösterebilir. Bu açıklama her post kartında uzun metin veya ürün eğitimi
haline gelmemelidir.

**Değişmez:** ücretli görünürlük bu modülde yoktur. Feed ranking sponsorluk,
ilan, kampanya veya nGazete fiyatı bilmez.

### 4.1 Sosyal eylemler ve kişisel koleksiyon

Beğeni, kaydetme, yorum ve takip yazmaları `src/actions/social.ts` üzerinden
oturumu yeniden doğrular ve `DemoStore` mutasyonlarına gider. Ana akış ile kısa
video sayfası aynı beğeni ve kaydetme sözleşmesini kullanır. `/saved` sunucu
rotası oturum sahibini `getViewer()` ile çözer, `listSavedPosts(viewer.id)` ile
yalnızca o kullanıcının kayıtlarını `PostView` biçiminde alır ve aynı `PostCard`
bileşeniyle gösterir. Böylece koleksiyon için ikinci bir kart veya veri modeli
oluşmaz.

Masaüstü gezinme `/saved` rotasını ayrı bir etkin öğe olarak gösterir. Mobil alt
gezinmede rota profil kümesinin parçası sayılır ve görünür giriş kullanıcının kendi
profilindeki `Kaydedilenler` bağlantısıdır. Kaydetme formu `/saved` üzerinde
çalıştığında `revalidate="/saved"` gönderdiği için kaldırılan kart sunucu yeniden
çiziminde koleksiyondan kaybolur. DemoStore bellek içi olduğu için bu kişisel
koleksiyon sunucu yeniden başladığında sıfırlanır; üretim kalıcılığı Supabase
adaptörünün sorumluluğudur.

Karar kayıtları:
[0002](decisions/0002-aciklanabilir-siralama.md) ve
[0004](decisions/0004-ucretli-gorunurluk-yalnizca-ngazetede.md).

### 4.2 Global arama

Masaüstü uygulama kabuğundaki arama kutusu ile `/explore` formu sonucu istemcide
tutmaz. Her ikisi de sorguyu ve etkin filtreleri `/explore?q=...` URL'sine yazar.
Bu sözleşme yenileme, geri gitme ve paylaşılan bağlantılarda aynı arama durumunu
korur. `/explore/page.tsx` güvenilmeyen URL değerlerini `parseFilters` ile
doğrular, oturum sahibini çözer ve tek bir `DemoStore.discover` çağrısıyla kişi,
kurum, paylaşım, topluluk, proje ve etkinlik sonuçlarını alır.

Sonuçlar yeni ve ayrı veri modellerine çevrilmez. Kişiler ile kurumlar
`ProfileSummary`, paylaşımlar `PostView`, diğer türler de mevcut ortak view
modelleri üzerinden gösterilir. Paylaşım sonuçları akıştaki `PostCard` bileşenini
kullandığı için beğenme, kaydetme ve yorum sözleşmesi aramada da korunur. Arama
etkinken kök topluluklar, yaklaşan etkinlikler ve öne çıkan Neden hikâyeleri
gizlenir. Böylece sonuç listesi ile keşif ana sayfasının öneri alanları birbirine
karışmaz.

Konum paylaşmayan bir kişi, il veya ilçe filtresi yokken adı, kullanıcı adı ya da
biyografisiyle bulunabilir. İl filtresi yalnız il veya ilçe düzeyinde paylaşımı
açık profilleri içerir. İlçe filtresi yalnız ilçe düzeyinde paylaşımı açık
profilleri içerir. UI kesin konum, ham profil kaydı veya canlı koordinat almaz.
Yalnız zaman ya da katılım biçimi filtresi kişi ve kurum sonucu üretmez, çünkü bu
iki filtre profil kayıtları için anlamlı değildir.

## 5. Marka işareti ve 5N selector mimarisi

### 5.1 Marka kaynağı

Logo geometri kaynağı takımın Figma'daki **master vector**üdür. Uygulama asset'i
bu kaynaktan export edilmeli veya aynı exact vector data ile üretilmelidir.
Ekran görüntüsünden tekrar tracing veya yaklaşık SVG path kabul edilmez.

Geometri invariantları:

- iki endpoint ring eşit outer diameter;
- iki endpoint ring eşit inner diameter;
- ring stroke ve connecting line tutarlı monoline ağırlığı;
- connecting line boyunca taper yok;
- büyük/küçük endpoint hiyerarşisi yok;
- static mark effectsiz çalışır;
- particle/glow ayrı motion layer'dır.

### 5.2 Selector state machine

Önerilen state'ler:

```text
closed
  -> opening
  -> dragging
  -> aligned(candidate)
  -> confirming
  -> closed + selectedPanel
```

`closed`: N mark görünür.

`opening`: N'nin yanında half arc reveal olur. Arc iki uca doğru alpha=0'a iner.

`dragging`: five options arc boyunca hareket eder. Uçlara yaklaşan option opacity ve
ölçek olarak azalır. Selection marker yakınındaki option yükselir.

`aligned`: en yakın option kısa snap ile marker'a hizalanır.

`confirming`: selection kısa visual feedback alır.

Sonra selector DOM/görsel olarak kapanır ve gerçek panel onun yerini alır. N mark
panel üzerinde kalır ve yeniden açar.

Bu component normal UI'da kalıcı eğitim metni taşımaz. İlk kullanım için gerekirse
tek seferlik contextual hint ayrı ürün davranışı olarak eklenir.

Reduced-motion modunda rotation/reveal minimuma iner. Keyboard erişimi option
listesi + previous/next/confirm mantığıyla aynı fonksiyonu verir.

## 6. Nerede haritası

### 6.1 Mevcut teknik envanter

`src/components/map/TurkeyMap.tsx` MapLibre GL JS kullanır ve dış tile sunucusuna
bağlanmaz. `public/geo/turkey-provinces.geojson` 81 ili; `districts-XX.geojson`
dosyaları 81 ilin ilçe katmanlarını içerir. Üretilen il/ilçe indeksi
`src/lib/geo/` altındadır. Üretilen dosyalar elle düzenlenmez; kaynak veriden
script ile yeniden oluşturulur.

### 6.2 Uygulanan sorgu ve etkileşim

Nerede ekranı kullanıcının şu sorusunu cevaplar:

> Seçtiğim konu ve varlık türünde Türkiye'nin nerelerinde daha fazla hareket var?

Harita yalnızca seçilebilir polygon görünümü değildir. İl ve seçilen il içinde
ilçe düzeyinde **density/choropleth** üretir.

Sayfa sorgusu şu ürün kavramlarını taşır:

```text
Map URL state
  topic?
  metric: all | communities | events | projects | organizations | people | posts
  timeRange?
  participationMode?
  onlinePolicy?
```

`parseFilters` bilinmeyen metrikleri `all` değerine indirger. `buildFilterHref`
varsayılan `all` değerini URL'ye yazmaz, diğer metrikleri arama ve filtre
geçişlerinde korur.

Store sonucu şu biçime dönüştürülür:

```text
RegionDensity
  provinceCode
  total
  communities
  events
  projects
  organizations
  people
  posts
```

Sunucu sayfasındaki `selectMetric`, Store kırılımını kopyalar ve yalnız `total`
alanını seçilen varlık sayısıyla değiştirir. Province ve district feature-state
normalizasyonu bu seçili toplamların kendi maksimumuna göre yapılır. Aynı metrik
legend metnini, popup sayısını, il ve ilçe listesini, sıralamayı ve sonuç
kategorilerini değiştirir. Harita **nüfus verisi göstermez**.

Renk scale bir single-hue nSosyal blue/cyan family kullanır. Rainbow red/yellow/
green heatmap kullanılmaz. Legend düşük-yüksek ilişkisini açıkça gösterir.
Renk tek başına bilgi taşımaz; hover/click value, legend ve liste sonucu vardır.

İl seçimi aynı haritada ilçe katmanına iner; ilçe seçimi ilgili sonuçları açar.
URL parametreleri seçimi korur. Renk tek başına bilgi taşımaz: hover/click değeri,
legend ve klavyeyle erişilebilen eşdeğer sonuç listesi birlikte sunulur.

MapLibre popup içeriği `setHTML` ile yerleştirildiği için bölge adı ve dinamik
varlık adı önce HTML olarak kaçırılır. Popup tam tür kırılımını korur, üst toplam
ise seçili metriğin Türkçe adını kullanır.

Kullanıcının kendi location paylaşımı haritayı kullanmak için zorunlu değildir.
Personal location yalnızca kişinin yerel kişi sonuçlarında görünürlük ve öneri
kalitesini etkiler. Exact/live personal coordinate saklanmaz veya gösterilmez.

Karar kayıtları:
[0003](decisions/0003-yerel-geojson-ile-tile-sunucusuz-harita.md) ve güncel kapsam
kararı [0009](decisions/0009-turkiye-geneli-yogunluk-ve-ilce-genislemesi.md).

## 7. Medya ve proje pitch'i

Demo medyası yerel veya sentetik dosyalarla çalışır. `VideoPlayer`
`prefers-reduced-motion` tercihini gözetir ve videonun metin/caption eşdeğerini
sunar.

Sunucu, JPG/PNG/WebP görsellerde dosya imzasını, bildirilen MIME değerini ve gerçek
byte sayısını doğrular. MP4/WebM videolarda aynı kontrollere kapsayıcı biçimi ile
kapsayıcıdan okunan süre eklenir. Görseller 12 MB, videolar 50 MB ve 90 saniye ile
sınırlıdır. Okunamayan, sahte tür bildiren veya sınırı aşan dosya yazma başlamadan
reddedilir.

Yükleme akışı dört aşamalıdır:

1. Bütün dosyalar doğrulanır ve güvenli rastgele adlarla bellekte hazırlanır.
2. `commitLocalUploadBatch`, dosyaları `wx` kipiyle grup olarak yazar; var olan
   bir dosyanın üzerine yazmaz.
3. `DemoStore` medya, gönderi veya proje kayıtlarını oluşturur.
4. `/uploads/[filename]` Route Handler'ı yalnızca izinli ad ve uzantıları doğru
   içerik türüyle sunar.

Dosya veya veri adımlarından biri başarısız olursa telafi akışı yalnızca o isteğin
oluşturduğu dosyaları ve kayıtları geri alır. Proje oluşturma geri alımı proje,
kurucu üyelik ve pitch medya kaydını birlikte temizler. Bu sıra, yarım proje,
yetim medya ve yinelenen tekrar denemeleri engeller. Route Handler'ın katı dosya
adı kontrolü dizin geçişi denemelerini reddeder.

Yerel `public/uploads` diski prototip kolaylığıdır. Yeniden dağıtım, birden fazla
örnek ve kalıcı saklama için production ortamında Supabase Storage veya eşdeğer
nesne depolama, CDN, codec dönüştürme ve kötü amaçlı dosya taraması gerekir.

## 8. Oturum, roller ve güvenlik

Demo session basit yarışma kolaylığıdır. Production yönünde Supabase Auth vardır.
Roller: `user`, `organization`, `moderator`, `admin`.

- exact/live personal location yok;
- district personal granularity sınırıdır;
- RLS enable + force uygulanır;
- service-role server-only;
- privilege escalation trigger/policy ile korunur;
- community applications, reports ve ad requests moderation/audit yoluna girer.

## 9. Zaman

Ürün günü **Europe/Istanbul** bağlamında hesaplanır. Event/deadline/newspaper issue
tarihleri bu helper katmanını kullanır. nGazete sayıları İstanbul saatiyle
06.00'da açılır. Uzun süre çalışan `DemoStore`, gün değiştiğinde yeni sayıyı ilk
okumada oluşturur; bunu yaparken kullanıcı mutasyonlarını sıfırlamaz ve önceki
günün sponsorlu yerleşimlerini yeni güne taşımaz. İlk oturum kapağı 06.00'dan
önce son yayımlanmış sayıyı, eşikten sonra yeni sayıyı gösterir. Görülme kaydı
takvim gününe değil sayı tarihine bağlıdır; taslak sayı okura açılmaz.

Karar kaydı: [0007](decisions/0007-zaman-ekseni-europe-istanbul.md).

## 10. Tasarım sistemi

Görsel dil mevcut nSosyal ürün ailesinden alınır. Dark-first üç kolonlu desktop,
mobile bottom navigation, familiar social feed yapısı korunur.

Referans semantic değerler ürün dokümantasyonunda:

```text
base      #0A0F1A
raised    #131B28
sunken    #0E1420
hover     #1A2333
text      #E9EFF7
muted     #94A3B8
border    #1F2937
accent    #3D9BFF
```

Canlı nSosyal source farklı exact token kullanıyorsa canlı source kazanır.

5N için birbirinden kopuk violet/green/rose/amber identity kullanılmaz. 5N ve map
density nSosyal blue/cyan family içinde kalır. Ayrım icon, label, state ve content
behavior ile kurulur.

Ana product UI'ın kuralı: **show, don't explain**. Teknik rationale, ranking theory,
business-model explanation ve privacy architecture ana akış ekranlarına kart
olarak konmaz.

Karar kaydı:
[0006](decisions/0006-tasarim-dilini-canli-siteden-almak.md).

## 11. nGazete mimarisi

### Mevcut Publication Studio uygulaması

`/publish` rotası ana `(app)` layout grubunun dışında çalışır ve ana `AppShell`
kabuğunu kullanmaz. `src/app/(app)/publish/PublicationStudio.tsx` istemci editörü,
30×40 A4 grid üzerinde alan seçimi yapar. Kullanıcı Canva veya başka bir araçta
hazırladığı PNG/JPG/WebP kreatifi yükler, seçtiği alan içinde taşır ve köşe
tutamaçlarıyla boyutlandırır. Delete, ok tuşları, çoklu seçim, kopyalama ve
yapıştırma aynı tuval state machine'inde çalışır. Bir taslağa tek kreatif eklenir;
başka dosya yüklemek öncekinin üzerine yığılmaz, onun yerini alır.

Standart hesap bir nSosyal iç bağlantılı CTA; Yayınevi abonesi üç CTA, dış HTTPS
bağlantısı, özel renk/gradyan ve sınırlı hareket kullanabilir. Önizleme ızgarayı,
seçim çerçevesini ve editör kontrollerini göstermez. Görsel, alt metin ve bütün
bağlantılar yayın öncesi moderasyona gider.

`PublicationBlock` kreatif ve CTA yerleşimini aynı koordinat sözleşmesiyle taşır.
`DemoStore` alan sınırını, tek kreatif kuralını, CTA sayısını, bağlantı yetkisini,
abonelik ayrıcalıklarını ve optimistic `revision` değerini sunucuda yeniden
doğrular. Bu, mevcut demo-mode uygulamasıdır; production yolunda aynı sözleşmenin
Supabase kalıcılığı, RLS ve transaction kilidiyle uygulanması gerekir.

### 11.1 Reader model

nGazete generic card collection değil, gerçek digital newspaper composition'dır.

`newspaper_items` mevcut görünüm sözleşmesinde şu alanları taşır:

```text
issue_id
item_type
section
headline
subheadline
body_or_summary
hero_image_url | thumbnail_url
image_alt
source_or_author
target_url
layout_variant
grid_column_span
grid_row_span
priority
publication_order
sponsored
sponsor_name
placement_code
width_px
height_px
campaign_id
price_snapshot
```

Reader layout masthead, issue/date, hero story, headline hierarchy, image,
section, column/grid ve linkler kullanır.

### 11.2 Sponsored inventory

Sponsored content gazete grid'inin içinde spatial slot olarak yaşar ve açık
`Sponsorlu` label taşır. Reader'da ayrı `Ücretli alanlar` card section yoktur.

Örnek slot boyutları 300x250, 728x90, 300x600, 600x400, 970x250 olabilir.
Responsive için width/height yanında grid span/aspect ratio tutulur.

Pricing snapshot açıklanabilir faktörlerden oluşur:

```text
price = base
      * areaFactor
      * placementFactor
      * issueCountOrDuration
      * demandFactor
      * subscriptionDiscount
```

`ad_requests` hedef alanları:

```text
organization_id
contact_email
creative_url
creative_alt
target_url
requested_placement
width_px
height_px
grid_column_span?
grid_row_span?
requested_issue_start
requested_issue_count
subscription_plan
pricing_snapshot
status
published_item_id
```

Prototip gerçek para çekmez; alan çakışmasını ödeme niyetinden hemen önce yeniden
denetler, fiyat snapshot'ını dondurur ve kaydı moderasyon kuyruğuna yollar. Gerçek
ödeme adaptörü bu sınırın arkasına idempotency key ve webhook ile eklenmelidir.

**Feed ranking sponsorship bilmez.**

Karar kaydı:
[0004](decisions/0004-ucretli-gorunurluk-yalnizca-ngazetede.md).

## 12. Erişilebilirlik

Hedef WCAG 2.2 AA:

- keyboard operation ve visible focus;
- accessible names;
- associated form error;
- no colour-only state;
- reduced motion;
- adequate touch targets;
- focusable overflow areas;
- video text/caption equivalent;
- map list equivalent;
- selector keyboard equivalent.

Otomatik axe testleri önemlidir ancak keyboard order, visual clipping, readable
contrast ve screen reader deneyimini tek başına kanıtlamaz. Manual QA gerekir.

## 13. Test stratejisi ve doğruluk

Repo test suite'i unit, E2E ve accessibility katmanları içerir. Belgedeki test
sayısı **suite inventory** olarak okunmalıdır. Testler bu değişiklikte gerçekten
çalıştırılmadıysa "passes" yazılmaz.

Tam E2E paketi şu kritik senaryoları masaüstü ve mobil projelerde korur:

- onboarding + editable long-term goals;
- 5N selector open/drag/confirm/reopen;
- Nerede density + filters + region + accessible list;
- community approval;
- Why -> project;
- project create + pitch validation + no duplicate/partial record;
- like/save/comment/follow action chains and the private `/saved` collection;
- short-video like/save controls using the shared social-action contract;
- global search across people, organizations, posts, communities, projects, and events;
- nGazete real layout + spatial sponsored placement;
- advertiser request + pricing snapshot + admin approval;
- location/privacy;
- reduced motion ve keyboard flows.

`tests/e2e/social-actions.spec.ts` bu dört sosyal eylemi arayüz, Server Action ve
yeniden çizim zinciri boyunca sınar. `tests/e2e/accessibility.spec.ts` içindeki axe
sayfa envanteri `/saved` ve `/video` rotalarını da kapsar. Bu eklenen senaryoların
varlığı testlerin bu commit için çalıştırıldığı anlamına gelmez; sonuç yalnızca
gerçek komut çıktısı varsa başarı olarak kaydedilir.

`tests/e2e/search.spec.ts` arama formundan URL'ye, `DemoStore.discover` sonucundan
ortak kartlara kadar kişi, kurum ve paylaşım yolculuklarını iki viewportta sınar.
Store birim testleri genel aramada konumunu gizleyen profilin bulunabildiğini,
yerel filtrelerde ise paylaşım düzeyine uyulduğunu korur. Erişilebilirlik paketi
arama sonuç durumunu axe ve 320 CSS piksel reflow denetimine dahil eder.

## 14. Bilinen production farkları

Bu bölüm ürün kapsamı değil, **gap listesi**dir.

- Çalışma zamanı hâlâ bellek içi `DemoStore` kullanır; Supabase store adaptörü,
  Auth ve Storage yolu tamamlanmamıştır.
- Proje ve gazete yüklemeleri demo Node dosya sistemindedir; production codec,
  virüs taraması, kalıcı Storage/CDN ve transcoding hattı yoktur.
- nGazete ödeme akışı fiyat ve çakışma kararını gösterir ama gerçek sağlayıcı,
  idempotency key, webhook ve muhasebe kaydı içermez.
- Arama basit metin eşleşmesidir; typo tolerance ve tam metin indeksi yoktur.
- Bildirimler aynı DemoStore sürecinde oluşur; gerçek zamanlı kanal ve kalıcı
  teslimat kuyruğu yoktur.
- Otomatik erişilebilirlik ve klavye testleri geniştir; gerçek ekran okuyucu,
  switch-control ve cihaz üstü yüzde 200/400 zoom turu ayrıca yapılmalıdır.

Bu maddeler `PROJECT_SPEC.md` değiştirilerek kapatılmaz. Implementasyon bunlara
doğru geliştirilir.
