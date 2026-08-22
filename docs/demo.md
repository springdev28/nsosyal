# Demo

Prototip demo moduyla gelir: veri sunucu belleğinde üretilir ve yarışma akışı dış
servislere zorunlu olarak bağlı değildir.

```bash
npm install && npm run dev
```

Sahne sunumu için production build tercih edilir. Bu belge ürün gereksinimi değil,
**demo senaryosudur**. Burada seçilen şehir veya hesap örnekleri ürün kapsamını
sınırlamaz.

## Demo hesapları

Giriş ekranında sentetik demo hesapları bulunur. Parola gerektirmeyen hızlı giriş,
jüri demosunu hızlandırmak içindir.

| Hesap | Rol | Neyi gösterir |
| --- | --- | --- |
| Elif | `user` | gündelik feed, 5N selector, Nerede, community, event reminder |
| Baran | `user` | project create, pitch video, Why story, progress |
| Ege Teknopark | `organization` | event ve nGazete advertiser request |
| Deniz | `moderator` | community/report/ad moderation |

Hesaplar ve kurumlar sentetiktir. Gerçek kişi veya kurum taklit edilmez.

## Seed veri seti

Mevcut repo seed inventory'si profil, topic, community, post, video, project,
event, Why story, resource, newspaper issue ve ad request örnekleri içerir.

Seed dağılımı ürünün bir şehre özel olduğu izlenimini vermemelidir. Demo verileri
İstanbul, Ankara, İzmir ve farklı bölgeler arasında dağıtılmalıdır. Bir demo hesabın
İzmir/Bornova konumlu olması yalnızca örnek personadır.

Tarihler çalıştırma anına göre üretilir. Deterministik kimlikler demo linklerinin
sunucu yeniden başlasa da stabil kalmasını sağlar.

## Önerilen 7-9 dakikalık sunum

| Süre | Ne gösterilir | Amaç |
| --- | --- | --- |
| 0:30 | Problem + ürün cümlesi | nSosyal'ın neden bağlamsal keşfe ihtiyaç duyduğunu kur |
| 0:45 | Feed + casual post + short video | ürünün yalnız kariyer/proje sitesi olmadığını göster |
| 1:15 | N mark -> half-fade selector -> Nerede | özgün 5N interaction'ı göster |
| 1:15 | Türkiye density map -> metric/topic/time filter -> province | "nerede yoğun?" sorusunu gerçek harita ile cevapla |
| 0:45 | Event detail -> reminder | Nerede + Ne zaman bağını göster |
| 0:50 | Community -> resources/Nasıl | topluluk ve bilgi katmanını bağla |
| 0:50 | Why story -> related project | insan hikâyesinden üretime geçişi göster |
| 0:50 | Project page | Neden, Nasıl, progress, media ve ekip bağlarını göster |
| 1:15 | nGazete reader -> sponsored spatial slot -> advertiser request | gerçek newspaper layout ve feed'den bağımsız gelir modelini göster |
| 0:40 | Admin approval | community/ad moderation ve audit mantığını göster |
| 0:30 | Settings | long-term goals, privacy ve transient intent ayrımını göster |

## Ana akış ve hikâye demo akışı

1. Oluşturucu açılır; metin taslağının sayfa yenilemesinden sonra korunduğu
   gösterilir.
2. Gönderi türü, konu ve `Herkes`/`Topluluk` hedefi seçilir. Topluluk hedefinde
   topluluk seçiminin zorunlu olduğu gösterilir.
3. Birden fazla görsel veya video eklenir, medya önizlemesi ve zorunlu açıklama
   alanı gösterilir. İstenirse konum yalnızca bu gönderi için açılır.
4. Paylaşımdan sonra medyalı gönderi hikâye şeridinden tam ekran açılır. İleri,
   geri, duraklat, `Esc` ile kapatma ve odağın açan düğmeye dönmesi gösterilir.
5. Reduced-motion tercihinde görsel hikâyenin otomatik ilerlemediği belirtilir.

## 5N demo akışı

### 1. Kapalı state

N bağlantı işareti görünür. Logo takımın Figma master vector'üdür. Endpoint ring
ölçüleri ve monoline kalınlığı eşittir.

### 2. Selector açılışı

N'ye tıklanır. Tam wheel açılmaz. İki ucu fade olan half arc görünür.

### 3. Seçim

Ne, Nerede, Ne zaman, Nasıl ve Neden seçenekleri arc boyunca kayar. `Nerede`
selection point'e hizalandığında kısa snap/confirm olur.

### 4. Panel değişimi

Selector tamamen kaybolur. N mark erişilebilir kalır ve Nerede paneli gerçek
Türkiye yoğunluk haritasını açar.

Bu akışta ekrana `çevir`, `çark kaybolur` gibi ürün açıklaması metinleri koymak
demo kolaylığı sayılmaz. Mekanik kendi davranışıyla anlaşılmalıdır. İlk kullanım
hint'i varsa tek seferlik ve kısa olmalıdır.

## Nerede demo akışı

Demo, sabit olarak İzmir'e gitmek zorunda değildir. Konuya göre yoğunluğu görsel
olarak daha anlamlı gösteren province seçilir.

Örnek:

1. Topic: `Havacılık ve Uzay`.
2. Metric: `Topluluk` veya `Etkinlik`.
3. Time: `Gelecek 30 gün` gibi ilgili aralık.
4. Türkiye map üzerinde province density'leri görünür.
5. Hover ile sayısal value/count gösterilir.
6. Bir province seçilir ve region detail açılır.
7. İlgili event açılır, reminder kurulur.

Harita blue/cyan single-hue density scale kullanır. Red/yellow/green rainbow heatmap
kullanılmaz. Density population değildir. Seçili platform entity'lerinin count veya
normalized score değeridir.

Current repo district GeoJSON'u İzmir için mevcut olabilir. Demo isterse bunu
extra drill-down örneği olarak kullanabilir, fakat sunumda **İzmir product pilot**
gibi anlatılmaz.

## nGazete demo akışı

Reader'a önce **gazete** gösterilir, reklam yönetim paneli değil.

1. Masthead, issue/date ve ana headline görünür.
2. Hero/article image ve editorial sections incelenir.
3. Gazetenin kendi grid'i içinde `Sponsorlu` etiketi taşıyan bir slot gösterilir.
4. Slotun örneğin 300x250 veya başka bir tanımlı size olduğu açıklanabilir.
5. Advertiser flow'a geçildiğinde creative, target link, size/grid area,
   placement, issue count ve package seçimi gösterilir.
6. Sistem price snapshot üretir.
7. Admin request'i inceler ve placement onaylar.

### Yayın Atölyesi demo adımı

1. `Yayınla` veya `Yayın Atölyesi` bağlantısı yeni sekmede açılır; ana uygulama
   navigasyonu editör alanını daraltmaz.
2. Sayı ve sayfa seçilir; 30×40 grid üzerinde satın alınacak alan çizilir ve
   gerekirse yeniden boyutlandırılır. Alan seçici yüzeyinin nGazete okuyucusundaki
   koyu gazete kâğıdıyla aynı olduğu doğrulanır.
3. Canva veya başka bir araçtan dışa aktarılan PNG/JPG/WebP kreatif yüklenir ve
   görsel açıklaması girilir.
4. Standart hesapla bir nSosyal içi CTA eklenir; buton seçili alan içinde
   sürüklenir ve yeniden boyutlandırılır.
5. Demo Yayınevi aboneliği açılarak üç CTA, dış `https` linki, gradyan/hareket ve
   yüzde 5 indirim farkı gösterilir. Ekrandaki 200 TL/ay ve ödeme gerçek tahsilat
   değildir.
6. Taslak önizlenir; önizlemede düzenleme ızgarasının ve alan seçim çerçevesinin
   görünmediği, fakat koyu gazete kâğıdı yüzeyinin korunduğu doğrulanır. Ardından
   taslak kaydedilip yeniden açılır, sonra rezerve edilir ve demo ödeme tamamlanır.
   Kreatif, alt metin ve bağlantıların `/admin/newspaper` moderasyon kuyruğuna
   düştüğü gösterilir.
7. Moderatör onay, ret veya düzenleme isteği verir; kararın kayıt ve kullanıcı
   bildirimi oluşturduğu doğrulanır.

Okuyucu sayfasında `Gelir modeli nasıl çalışıyor?` veya `Ne satılıyor?` gibi uzun
öğretici kartlar gösterilmez. O anlatı advertiser/admin veya sözlü sunumda yapılır.

Sunumda özellikle şu invariant söylenmelidir:

> Paid placement nGazete'de görünürlük satın alır, kişisel feed ranking satın almaz.

## Kişiselleştirme demo akışı

Ayarlar açıldığında şu ayrım gösterilir:

- interests ve long-term platform goals kalıcıdır ve kullanıcı tarafından
  değiştirilebilir;
- content/feed, location/privacy, notifications, accessibility ve nGazete
  preferences ayrı kontrollerdir;
- `Sosyalleş`, `Keşfet`, `Öğren`, `Üret` yalnızca transient intent'tir.

Onboarding'in kullanıcının gelecekte değiştiremeyeceği bir karar ekranı olmadığı
özellikle görünür olmalıdır.

## Demo dayanıklılığı

- GeoJSON ve kritik seed data yereldir.
- Harita yüklenemezse aynı discovery result'ları listeden erişilebilir kalır.
- Demo login hızlıdır.
- Demo data sentetiktir.
- Reset endpoint yalnızca demo mode'da çalışır.
- Sunumdan önce kullanılan commit için build ve ilgili critical flows gerçekten
  test edilmelidir.
- Cihaz veya sunum problemi için kısa ekran kaydı yedek olarak tutulabilir.

## QA checklist

Sunumdan önce elle kontrol:

- logo iki endpoint'te eşit geometri ve uniform line width ile render oluyor mu;
- N selector half arc ve end fade doğru mu;
- selection sonrası selector tamamen kayboluyor mu;
- N yeniden selector açıyor mu;
- map density renkleri blue/cyan family içinde mi;
- legend ve hover/click value okunuyor mu;
- mobile filter/chip/button clipping var mı;
- nGazete gerçek newspaper composition gibi mi;
- sponsored slot grid'in içinde ve açık etiketli mi;
- advertiser size/placement/price ilişkisi görülebiliyor mu;
- Settings long-term goals ile transient intent'i ayırıyor mu;
- map list equivalent, keyboard, focus ve reduced-motion çalışıyor mu.

## Test raporlama kuralı

Repo içinde unit ve E2E test suite'leri bulunması veya README'de test sayılarının
yazması, o testlerin son değişiklikten sonra geçtiğini kanıtlamaz. Sunum notunda
yalnızca gerçekten çalıştırılan ve sonucu görülen kontroller `passed` olarak
belirtilmelidir.
