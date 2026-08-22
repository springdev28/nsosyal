# nSosyal 5N1K

Bilim, teknoloji ve inovasyon topluluklarını birbirine bağlayan **bağlamsal sosyal
keşif katmanı** prototipi. Gündelik sosyalliği, paylaşım, mizah ve kısa videoyu;
proje, öğrenme, topluluk, etkinlik ve yerel ekosistem keşfiyle aynı üründe
birleştirir. Ücretli görünürlük kişisel akıştan tamamen ayrı bir yayın yüzeyinde,
**nGazete** içinde yaşar.

Ürünün veri omurgası 5N1K bağlam modelidir: **Ne, Nerede, Ne zaman, Nasıl, Neden**,
tamamlayıcı sosyal kimlik katmanı ise **Kim**dir. 5N1K bir zorunlu form değildir.
Bir içerik yalnızca gerçekten sahip olduğu bağlamları taşır.

> Bu bir yarışma prototipidir. Demo hesapları ve içerikleri sentetiktir. Gerçek
> kişi veya kurum verisiymiş gibi sunulmaz.

## Kaynak önceliği

Ürün davranışıyla ilgili çelişkide şu sıra kullanılır:

1. Takımın en güncel açık ürün kararı ve Figma master tasarımı.
2. Uzun ürün/geliştirme spesifikasyonu.
3. `PROJECT_SPEC.md`, `AGENTS.md`, `CLAUDE.md`.
4. Mevcut implementasyon.

Kodda bulunan geçici veya eski bir sınır ürün gereksinimine dönüştürülmez.

## Hızlı başlangıç

Gereksinim: Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Varsayılan `DEMO_MODE=true` yolunda veri sunucu belleğinde üretilir. Supabase
projesi veya dış servis gerektirmeden demo yapılabilir. Ayrıntı için
[docs/demo.md](docs/demo.md).

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunumu |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm test` | Vitest test suite |
| `npm run test:e2e` | Playwright E2E ve erişilebilirlik suite |
| `npm run verify` | typecheck + lint + birim testleri |
| `npm run build:geo` | Yerel GeoJSON çıktılarını üretir |
| `npm run build:media` | Demo medyasını üretir |
| `npm run build:supabase-seed` | `supabase/seed.sql` üretir |

Dokümanda test dosyası veya test sayısı belirtilmesi testlerin o anda geçtiği
anlamına gelmez. Bir değişiklikte yalnızca gerçekten çalıştırılan kontroller
`passed` olarak raporlanmalıdır.

## Marka ve 5N etkileşimi

Yeni nSosyal 5N1K marka işaretinin kaynak geometrisi takımın Figma'daki **master
vector** dosyasıdır. Ekran görüntüsünden veya yaklaşık SVG ile yeniden çizilmez.

- iki uç halka eşdeğerdir;
- dış çap, iç çap ve stroke aynıdır;
- bağlantı hattı tek ve sabit kalınlıklı monoline'dır;
- statik logoda glow veya particle zorunlu değildir;
- particle kullanılırsa ayrı motion katmanıdır.

Keşfet içindeki 5N selector tam çark değildir. N işaretine basıldığında iki ucu
fade olan **yarım yay** açılır. Ne, Nerede, Ne zaman, Nasıl ve Neden seçenekleri
bu yay üzerinde hareket eder. Seçenek seçim noktasına hizalanınca kısa snap olur,
selector kaybolur ve gerçek panel açılır. Başka boyut için kullanıcı N'ye tekrar
basar.

## Ekranlar ve temel davranışlar

| Alan | Yol | İçerik |
| --- | --- | --- |
| Ana akış | `/feed` | Karışık sosyal akış, çoklu medya oluşturucu, tam ekran hikâyeler, geçici niyet modları ve açıklanabilir öneri |
| Kısa video | `/video` | Kısa video, metin karşılığı, proje/topluluk bağları |
| Keşfet | `/explore` | N bağlantı işaretinden açılan yarım 5N selector |
| Nerede | `/explore/map` | Türkiye il yoğunluk haritası, filtreler, bölge detayı, liste eşdeğeri |
| Ne zaman | `/explore/time` | Geçmiş/bugün/gelecek, etkinlik ve son başvuru, hatırlatma |
| Neden | `/explore/why` | Gerçek motivasyon ve arka plan hikâyeleri |
| Nasıl | `/explore/how` | Topluluk kaynakları ve süreç bilgisi |
| Topluluklar | `/communities` | Kök/dal topluluklar, üyelik ve moderator onaylı başvuru |
| Projeler | `/projects` | Yaşayan proje sayfaları, ilerleme, ekip, pitch videosu |
| nGazete | `/newspaper` | Gerçek digital newspaper layout, editorial ve spatial sponsored inventory |
| Yayın Atölyesi | `/publish` | Bağımsız 30×40 alan seçimi, tek kreatif yükleme, CTA yerleşimi, abonelik ve ödeme sonrası moderasyon |
| Ayarlar | `/settings` | İlgi, uzun dönem amaçlar, akış, konum, bildirim, erişilebilirlik, nGazete tercihleri |
| Yönetim | `/admin` | Moderasyon, raporlar, nGazete ilan/yerleşim ve Yayın Atölyesi kreatif incelemesi |

## Kişiselleştirme

Kişiselleştirme iki ayrı katmandır.

**Kalıcı profil tercihleri:** interests, uzun dönem platform goals, content/feed
preferences, location/privacy, notifications, accessibility ve nGazete
preferences. Bunlar onboarding sonrasında Settings üzerinden düzenlenebilir.

**Geçici niyet:** `Sosyalleş`, `Keşfet`, `Öğren`, `Üret`. Bu modlar kullanıcının
o anda ne yapmak istediğini belirtir ve sıralama/keşif ağırlıklarını geçici olarak
değiştirir. Kalıcı profil amaçlarının yerine geçmez.

## Nerede ve yoğunluk haritası

Ürün Türkiye genelini hedefler. Mevcut repoda 81 il GeoJSON'u ve şu an için İzmir
ilçe GeoJSON'u bulunması yalnızca **mevcut veri envanteridir**. İzmir ürün
mimarisinde özel pilot şehir değildir.

Nerede ekranı seçili topic, entity/metric ve time bağlamında hangi bölgelerde daha
fazla aktivite olduğunu göstermelidir. Province-level density/choropleth tek
nSosyal blue/cyan intensity family ile çizilir. Legend, hover/click value ve region
detail bulunur. Metrics en az communities, events, projects ve institutions;
veri varsa people, posts, resources ve opportunities olabilir.

Yoğunluk nüfus değildir. Seçili platform varlıklarının count veya normalized
score değeridir. Kullanıcı kendi konumunu paylaşmadan haritayı keşfedebilir. Kesin
veya canlı bireysel koordinat gösterilmez. Harita sonuçlarının erişilebilir liste
eşdeğeri vardır.

## nGazete

nGazete generic card grid değildir. Gerçek dijital gazete yapısı hedeflenir:

- masthead ve issue/date;
- hero ve headline hierarchy;
- article images ve alt text;
- sections, columns/grid;
- internal/external links;
- editorial priority ve layout variants.

Mevcut prototipte yayın üretimi `/publish` adresindeki bağımsız Yayın Atölyesi'nde
çalışır. Bu rota ana uygulama kabuğunun dışında, yeni sekmede açılır. Kullanıcı
30×40 grid üzerinde alan seçer, Canva veya başka bir araçtan dışa aktardığı tek
PNG/JPG/WebP kreatifi yükler, zorunlu alt metni girer ve CTA butonlarını seçili
alan içinde sürükleyip yeniden boyutlandırır. Alan seçici, düzenleme tuvali,
önizleme ve nGazete okuyucusu aynı koyu gazete kâğıdı yüzeyini kullanır. Önizleme
düzenleme ızgarasını ve alan seçim çerçevesini gizleyerek okuyucuya gidecek temiz
yüzeyi gösterir.
Standart hesap bir CTA ve yalnızca nSosyal içi bağlantı kullanabilir. Demo
Yayınevi aboneliği üç CTA, dış `https`
bağlantısı, gradyan/hareket seçenekleri ve yüzde 5 alan indirimi sağlar. Abonelik
akışı 200 TL/ay tutarını gösterir; gerçek tahsilat yapmaz. Ödeme simülasyonu
sonrasında kreatif, alt metin ve bağlantılar moderasyon kuyruğuna girer.

Sponsored placements gazetenin grid'i içinde yer alır ve açık `Sponsorlu` etiketi
taşır. Reader UI'da ayrı bir `Ücretli alanlar` kart listesi veya gelir modeli
öğretici paneli kullanılmaz.

Reklam envanteri mekânsaldır. Örnek boyutlar `300x250`, `728x90`, `300x600`,
`600x400`, `970x250` olabilir. Responsive karşılık için grid span veya aspect
ratio da tutulur. Fiyat alan, placement prominence, issue count/duration, demand
ve subscription discount sinyallerine göre açıklanabilir biçimde hesaplanır.
Ödeme kişisel feed sıralamasını değiştirmez.

## Teknoloji

- **Next.js App Router + React + TypeScript**
- **Tailwind CSS** ve mevcut nSosyal dark-first görsel sistemi
- **MapLibre GL JS + yerel GeoJSON**
- **Supabase Postgres/Auth/Storage + RLS** production yolu
- **DemoStore** sentetik, ağsız demo yolu
- **Vitest + Playwright + axe-core** test altyapısı

## Klasör düzeni

```text
src/
  app/            App Router sayfaları
  actions/        Server Actions
  components/     feed, map, video, community, discovery, newspaper, layout, ui
  lib/
    auth/
    data/
    ranking/
    geo/
    seed/
    supabase/
    time/
  types/
supabase/
public/geo/
public/demo/
tests/
docs/
```

## Tasarım ve erişilebilirlik

Mevcut nSosyal dark-first ürün ailesi korunur. Ayrı bir rainbow/neon tasarım
kimliği üretilmez. 5N ve map intensity aynı blue/cyan family içinde kalır.

Ana UI teknik rapor gibi açıklama yapmaz. Uzun ürün gerekçileri Hakkında, Help,
admin, advertiser veya dokümantasyonda yaşar.

Hedef WCAG 2.2 AA:

- keyboard operation ve visible focus;
- accessible names;
- labelled form errors;
- colour-only olmayan state;
- reduced motion;
- video text/caption equivalent;
- map list equivalent;
- yeterli touch target ve overflow kontrolü.

## Veri ve lisans

Mevcut yerel sınır verisi OpenStreetMap katkıda bulunanlarından türetilmiştir ve
ODbL atfı uygulamada gösterilir. Görsel keşif amaçlıdır, resmî idari sınır verisi
olarak sunulmaz. Demo sosyal içeriği sentetiktir.

## Dağıtım

Uygulama sunucu tarafında render edilir; paylaşımlı/PHP barındırma yetmez, Node
çalıştıran bir plan gerekir. `main` dalına push, testler geçtiği sürece otomatik
dağıtır. Ayrıntılar: [docs/deployment.md](docs/deployment.md).

## Belgeler

- [PROJECT_SPEC.md](PROJECT_SPEC.md) - ürün ve teknik sözleşme
- [docs/architecture.md](docs/architecture.md) - sistem mimarisi ve güncel hedef model
- [docs/demo.md](docs/demo.md) - demo hesapları ve sunum akışı
- [docs/decisions/](docs/decisions/) - karar kayıtları
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) - coding agent kuralları
