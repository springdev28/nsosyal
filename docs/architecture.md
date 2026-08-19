# Mimari

Bu belge sistemin **mevcut teknik durumunu** ve güncel ürün hedefiyle arasındaki
farkları birlikte anlatır. Ürün sözleşmesi için [PROJECT_SPEC.md](../PROJECT_SPEC.md),
kararların gerekçeleri için [decisions/](decisions/) klasörüne bakın.

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

### 3.1 Kişiselleştirme hedef modeli

Mevcut tek `intentMode` alanı güncel ürün vizyonunun tamamını karşılamaz.
Kişiselleştirme iki katmana ayrılmalıdır:

1. **Kalıcı profil tercihleri:** interests, long-term platform goals, content/feed
   preferences, location/privacy, notifications, accessibility ve nGazete
   preferences.
2. **Geçici niyet:** `Sosyalleş`, `Keşfet`, `Öğren`, `Üret`. Bunlar yalnızca o
   anki ranking/discovery ağırlıklarını geçici olarak değiştirir.

Önerilen ilişkisel ek model:

```text
profile_goals
  profile_id
  goal_key
  weight
  created_at
```

`goal_key` kontrollü değerlerden oluşabilir: socialize, meet_people,
find_communities, discover_events, discover_projects, share_projects,
find_collaborators, learn, find_resources, follow_developments,
discover_local_ecosystem, find_institutions, discover_opportunities,
casual_discussion, follow_creation_stories, discover_people.

Onboarding başlangıç değerlerini toplar. Settings bu değerlerin kalıcı yönetim
yüzeyidir.

## 4. Akış sıralaması

Mevcut `src/lib/ranking/rank.ts` makine öğrenmesi kullanmadan açıklanabilir
weighted score hesaplar. Bugünkü sinyaller topic match, followed source, community
match, transient intent, recency, optional location match ve exploration bonusudur.

Güncel hedef modelde buna **long-term profile preference match** de eklenmelidir.
Mevcut ağırlıklar demo başlangıç değerleridir, değişmez ürün gerçeği değildir.
Transient intent mevcut tercihlere ek olarak kısa süreli yeniden ağırlıklandırma
yapar.

"Neden gösteriliyor?" açıklaması kullanıcı için anlamlı en güçlü sinyali kısa
biçimde gösterebilir. Bu açıklama her post kartında uzun metin veya ürün eğitimi
haline gelmemelidir.

**Değişmez:** ücretli görünürlük bu modülde yoktur. Feed ranking sponsorluk,
ilan, kampanya veya nGazete fiyatı bilmez.

Karar kayıtları:
[0002](decisions/0002-aciklanabilir-siralama.md) ve
[0004](decisions/0004-ucretli-gorunurluk-yalnizca-ngazetede.md).

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
bağlanmaz. `public/geo/turkey-provinces.geojson` 81 ili içerir. Repo ayrıca şu anda
İzmir ilçe GeoJSON'u içerir.

Bu **mevcut dosya envanteridir**. İzmir ürün mimarisinde pilot veya özel şehir
değildir.

### 6.2 Güncel ürün hedefi

Nerede ekranı kullanıcının şu sorusunu cevaplar:

> Seçtiğim konu ve varlık türünde Türkiye'nin nerelerinde daha fazla hareket var?

Harita yalnızca selectable polygon view değildir. Province-level
**density/choropleth** üretir.

Önerilen sorgu sözleşmesi:

```text
MapDiscoveryQuery
  topicIds[]
  metric: community | event | project | institution | person | post | resource | opportunity
  timeRange?
  participationMode?
  onlinePolicy?
```

Önerilen sonuç:

```text
RegionDensity
  provinceCode
  rawCount
  normalizedScore
  breakdown
  topEntities[]
```

Normalization seçili metric ve aktif filtre seti içinde yapılmalıdır. Harita
**nüfus verisi göstermez** ve kullanıcı density'yi nüfus sanmamalıdır.

Renk scale bir single-hue nSosyal blue/cyan family kullanır. Rainbow red/yellow/
green heatmap kullanılmaz. Legend düşük-yüksek ilişkisini açıkça gösterir.
Renk tek başına bilgi taşımaz; hover/click value, legend ve liste sonucu vardır.

Province selection region detail panel açar. District data bulunan her bölgede
aynı query/state architecture ile district drill-down yapılabilir. Tüm Türkiye
ilçe verisi eklendiğinde component mantığı değişmemelidir.

Kullanıcının kendi location paylaşımı haritayı kullanmak için zorunlu değildir.
Personal location yalnızca kişinin yerel kişi sonuçlarında görünürlük ve öneri
kalitesini etkiler. Exact/live personal coordinate saklanmaz veya gösterilmez.

Karar kayıtları:
[0003](decisions/0003-yerel-geojson-ile-tile-sunucusuz-harita.md) ve güncel kapsam
kararı [0009](decisions/0009-turkiye-geneli-yogunluk-ve-ilce-genislemesi.md).

## 7. Medya ve proje pitch'i

Demo videoları repoda yerel/sentetik dosyalardır. `VideoPlayer` reduced-motion
durumunu gözetmeli ve videonun metin/caption eşdeğerini sağlamalıdır.

Proje pitch'i 90 saniye/50 MB gibi bir ürün limiti taşıyorsa limit yalnızca UI
metni olmamalıdır. Client ve server tarafında doğrulanmalıdır.

Project create + upload akışında validation başarısızlığı yarım project kaydı
bırakmamalı ve retry duplicate project üretmemelidir. Bu davranış transaction,
pre-validation veya idempotent create yöntemiyle çözülmelidir.

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
tarihleri bu helper katmanını kullanır.

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

### 11.1 Reader model

nGazete generic card collection değil, gerçek digital newspaper composition'dır.

`newspaper_items` hedef alanları:

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

Gerçek ödeme P2 olabilir. Ancak prototype request, quote, placement ve admin approval
modelini gösterebilmelidir.

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

Yeni/yenilenecek kritik senaryolar:

- onboarding + editable long-term goals;
- N selector open/drag/confirm/reopen;
- Nerede density + filters + region + accessible list;
- community approval;
- Why -> project;
- project create + pitch validation + no duplicate/partial record;
- nGazete real layout + spatial sponsored placement;
- advertiser request + pricing snapshot + admin approval;
- location/privacy;
- reduced motion ve keyboard flows.

## 14. Bilinen mevcut implementasyon farkları

Bu bölüm ürün kapsamı değil, **gap listesi**dir.

- Current district GeoJSON yalnızca İzmir için bulunuyor. Ürün Türkiye-wide ve
  district architecture geneldir.
- Current map primarily selection/filter UI'dır. Product target metric-based
  density/choropleth'tir.
- Current personalization tek intent ağırlıklıdır. Product target long-term goals
  + transient intent ayrımıdır.
- Current nGazete schema/layout product target'ın image/grid/size/pricing alanlarını
  eksik taşır.
- Current project upload flow duration, atomic create/upload ve retry-idempotency
  açısından ek doğrulama gerektirir.
- Supabase store implementation tamamlanmamıştır.
- Search basit text match'tir.
- Notifications real-time değildir.

Bu maddeler `PROJECT_SPEC.md` değiştirilerek kapatılmaz. Implementasyon bunlara
doğru geliştirilir.
