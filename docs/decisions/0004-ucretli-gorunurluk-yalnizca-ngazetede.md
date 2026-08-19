# 0004 - Ücretli görünürlük yalnızca nGazete'de

**Durum:** Kabul edildi, kapsam spatial inventory modeliyle genişletildi

## Bağlam

Ürünün gelir modeli vardır: kurumlar ve diğer uygun reklamverenler nGazete içinde
görünürlük satın alabilir. Bu görünürlük kişisel feed ranking'e karıştırılırsa
nSosyal 5N'in güvenilir ve açıklanabilir discovery vaadi zayıflar.

Ayrıca nGazete'nin ilk kart tabanlı prototip yaklaşımı gerçek ürün fikrini yeterince
temsil etmiyordu. Güncel karar nGazete'yi gerçek digital newspaper composition ve
ölçülebilir spatial advertising inventory olarak ele alır.

## Değişmez ayrım

Paid placement yalnızca **nGazete** yüzeyinde yaşar.

- `src/lib/ranking/rank.ts` sponsorship, ad price, campaign veya newspaper
  placement bilgisini scoring signal olarak kullanmaz.
- Sponsored item kişisel feed'e payment sonucu boost edilmez.
- Reader'da sponsored content açık `Sponsorlu` etiketi taşır.

Bu ayrım yalnızca metinsel prensip değil, testle korunması gereken architecture
invariantıdır.

## nGazete reader kararı

nGazete generic card list değildir. Reader surface şu yapıyı hedefler:

- masthead;
- issue/date;
- headline hierarchy;
- hero ve article image;
- section;
- column/grid composition;
- internal/external target link;
- editorial priority/layout variant.

Sponsored placements ayrı `Ücretli alanlar` listesinde değil, gazetenin gerçek
grid'i içinde belirli inventory slot'larında yer alır.

## Spatial inventory

Ad inventory satın alınan görsel alanı temsil eder. Örnek size'lar 300x250,
728x90, 300x600, 600x400 ve 970x250 olabilir. Bu liste kapalı değildir.
Responsive layout için pixel size yanında grid column/row span veya aspect ratio
tutulur.

Pricing açıklanabilir faktörlerden oluşur:

```text
price = base
      * areaFactor
      * placementFactor
      * issueCountOrDuration
      * demandFactor
      * subscriptionDiscount
```

Area factor satın alınan alanı, placement factor görünürlük düzeyini, issue count
veya duration kampanya süresini temsil eder.

## Paketler

Örnek modeller:

- single issue;
- 4 issue;
- weekly recurring;
- monthly recurring;
- organization subscription.

Subscription sınırsız gazete alanı değildir. Tanımlı size, placement ve frequency
hakkıdır.

## Advertiser request

Request en az şu bilgileri taşıyabilmelidir:

- organization/contact;
- creative image;
- creative alt text;
- target URL;
- requested width/height veya responsive grid area;
- placement;
- issue start;
- issue count/duration;
- subscription/package;
- pricing snapshot;
- moderation/approval status.

Gerçek payment integration P2 olabilir. Prototype quote ve placement ilişkisini
göstermelidir.

## Reader UX

Reader'a business model öğretmek için `Gelir modeli nasıl çalışıyor?` veya
`Ne satılıyor?` gibi uzun kartlar koyulmaz. Bu bilgi advertiser/admin/About/docs
surface'lerinde yaşar.

Reader için gerekli bilgi sponsored label, creative ve target destination'dır.

## Sonuçlar

- Feed trust korunur.
- nGazete'nin kendisi editorial value üretmek zorundadır.
- Advertising inventory ölçülebilir ve savunulabilir hale gelir.
- Paid visibility ile organic ranking teknik olarak ayrılır.

## Değerlendirilen alternatifler

- Feed içinde labelled sponsored card: reddedildi.
- Feed score'a küçük sponsor bonusu: reddedildi.
- Newspaper sonunda ayrı paid-card gallery: reddedildi, gerçek newspaper layout ve
  spatial inventory fikrini bozuyor.
