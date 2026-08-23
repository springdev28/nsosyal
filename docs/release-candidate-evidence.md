# Yayın adayı kanıt matrisi

Tarih: 23 Ağustos 2026
Doğrulanan uygulama kaynak SHA'sı: `dbcd4ff30bc585d04130d55802ecd8f38166559b`
Kapsam: yarışma prototipinin P0 kullanıcı yolculukları, veri doğruluğu, erişilebilirlik ve dağıtım hazırlığı

Bu belge bir özellik listesi değildir. Güncel ürün denetimindeki "özellik
genişletmeyi dondur, mevcut yolculukları kanıtla" kararını uygulanabilir bir yayın
kapısına çevirir. Buradaki `Doğrulandı` ifadesi yalnızca aynı kaynak ağacında
çalıştırılan otomatik test veya açıkça kaydedilen görsel kontrol için kullanılır.

## Kaynaklar ve karar sırası

İnceleme sırasında aşağıdaki güncel Drive belgeleri karşılaştırıldı:

- [Honest Product & Technical Audit](https://docs.google.com/document/d/16eSc-q_8c9OzvBn813I9By8tIaR9NhRfU8z1vioS59Y/edit)
- [Prototip Geliştirme ve Ürün Spesifikasyonu](https://docs.google.com/document/d/1DGnuvaceEWMruatR_KwMjb8ypzE5Ga8ZnlB-m0Ehfag/edit)
- [Proje Teknik Raporu](https://docs.google.com/document/d/1mZMjH6gxb4-UHDv3bRB5ItY4HcqF2P8R7cMCO9L_0Yw/edit)
- [Repository Guide](https://docs.google.com/document/d/1vefIeHjrL9kwzR0FsFib_vqXSf59MBOHPom0eUslvUI/edit)

Çelişkide ürün ekibinin son kararı ve Figma master tasarımı önce gelir. Drive
spesifikasyonu ikinci, repo belgeleri ve mevcut kod daha sonra değerlendirilir.

## P0 yolculuk matrisi

Durum sözlüğü:

- **Doğrulandı:** aynı kaynak ağacında otomatik kanıt var; kritik görsel yüzeyler ayrıca incelendi.
- **Otomatik doğrulandı:** masaüstü ve mobil E2E kanıtı var; bu turda tüm adımlar ayrıca elle tekrarlanmadı.
- **Demo doğrulandı:** yarışma demosunda çalışıyor; kalıcı production altyapısı olduğu anlamına gelmiyor.

| P0 yolculuk | Rotalar | Veri ve mutasyon yolu | Otomatik kanıt | Görsel/a11y kanıtı | Durum |
| --- | --- | --- | --- | --- | --- |
| Demo giriş → karma akış → story → gelişmiş gönderi oluşturucu | `/login`, `/feed`, `/video`, `/create` | Demo oturumu, `DemoStore`, Server Actions | `competition-flows` 1; ranking/store birim testleri | `/feed` masaüstü ve 320×800 incelendi; taslak etiketi açıkken Gönder eylemi kırpılmıyor; desktop/mobile axe | Doğrulandı |
| Beğeni → yorum → kaydet/koleksiyonda bul → takip et/bırak | `/feed`, `/posts/[id]`, `/saved`, `/profile/[username]` | Social Server Actions → `DemoStore`; kaydedilenler yalnız oturum sahibinin view modelidir | `social-actions` içindeki 4 senaryo iki viewportta; store birim testleri | Profil kısayolu ve `/saved` masaüstü/Pixel 7 incelendi; `/saved` ile `/video` axe temiz | Doğrulandı |
| N işareti → yarım yay → gerçek 5N paneli | `/explore`, `/explore/map`, `/explore/time`, `/explore/how`, `/explore/why` | İstemci seçim durumu; seçim URL rotasına taşınır | `five-n-selector` içindeki 8 senaryo iki viewportta geçti | Açık yay 1440×1000 ve 390×844 incelendi; `Nasıl` araması ile `Neden` kartları 320×800 reflow görünümüne sığıyor; hedefler en az 44×44; axe temiz | Doğrulandı |
| Türkiye yoğunluk haritası → il → ilçe → sonuç | `/explore/map` | Yerel GeoJSON + `DemoStore` yoğunluk sorgusu; kişisel canlı koordinat yok | `map-density`; `competition-flows` 2 | Desktop/mobile harita, legend ve erişilebilir liste incelendi; axe temiz | Doğrulandı |
| Etkinlik → hatırlatma → bildirim | `/events/[slug]`, `/notifications` | Server Action → `DemoStore` hatırlatma kaydı | `competition-flows` 3 iki viewportta geçti | Etkinlik ve bildirim rotalarında desktop/mobile axe temiz | Otomatik doğrulandı |
| Topluluğa katılma → kaynak; başvuru → moderatör kararı → denetim kaydı | `/communities/[slug]`, `/communities/apply`, `/admin/moderation`, `/admin` | Server Actions → `DemoStore`; rol denetimi sunucuda | `competition-flows` 4 ve 7; store birim testleri | İlgili kullanıcı yüzeylerinde desktop/mobile axe temiz | Otomatik doğrulandı |
| Neden hikâyesi → bağlı yaşayan proje | `/explore/why`, `/explore/why/[id]`, `/projects/[slug]` | `DemoStore` view modelleri; oluşturma Server Action üzerinden | `competition-flows` 5 iki viewportta geçti | Neden ve proje yüzeylerinde desktop/mobile axe temiz | Otomatik doğrulandı |
| Proje oluşturma → isteğe bağlı pitch | `/create/project`, `/projects/[slug]` | Server Action MIME, byte ve kapsayıcı süresini doğrulayıp yazar; proje bundan sonra oluşturulur | 7 medya sınırı birim testi; tüm E2E paketi; proje formu axe | Geçersiz tür/boyut/süre yarım veya kopya proje açmaz | Demo doğrulandı |
| nGazete okuyucu → arşiv/sayfa → ilgi vurgusu; sponsorun akıştan yalıtılması | `/newspaper`, `/feed` | `DemoStore` gazete sayıları; ranking sponsorluk sinyali almaz | `competition-flows` 6; ranking ve 06.00/gün değişimi store testleri | İlk oturum modalı, odak tuzağı ve axe masaüstü/mobil 6/6; koyu kâğıt, kolonlar ve taşma ayrıca incelendi | Doğrulandı |
| Yayın Atölyesi → alan seçimi → kreatif/CTA → ödeme → moderatör kararı → zamanlı okuyucu çıktısı | `/publish`, `/admin/newspaper`, `/notifications`, `/newspaper` | Server Actions → `DemoStore`; onay anında değişmez yayın kopyası oluşur, sayı İstanbul saatiyle 06.00'dan önce açılmaz | `competition-flows` 6 ödeme/moderasyon/bildirim senaryosu iki viewportta; store testi yayın sınırı, kreatif ve CTA'yı doğruladı | Önizlemede ızgara/seçim kutusu yok; gazete kâğıdı okuyucuyla aynı; desktop/mobile axe temiz | Demo doğrulandı |
| Kalıcı tercihler ve konum mahremiyeti; geçici niyetin ayrılığı | `/onboarding`, `/settings`, `/profile/[username]` | Server Actions → `DemoStore`; ilçe en ince konum düzeyi | `personalization`, `profile`, `competition-flows` konum senaryosu | Ayarlar/profil/onboarding desktop/mobile axe temiz | Otomatik doğrulandı |

## Mevcut sistem ile production hedefinin ayrımı

| Alan | Bu adayda gerçekten çalışan | Production hedefi / açık iş |
| --- | --- | --- |
| Kimlik doğrulama | Sentetik hesap seçimi ve demo oturum çerezi | Supabase Auth ve gerçek hesap yaşam döngüsü |
| Uygulama verisi | Süreç belleğindeki deterministik `DemoStore` | Supabase Postgres adapteri; mevcut migration ve RLS sözleşmelerini kullanan runtime yol |
| Kalıcılık | Aynı çalışan sunucu süreci boyunca; reset veya yeniden dağıtım veriyi sıfırlar | Kalıcı veritabanı, yedekleme ve gözlemlenebilirlik |
| Medya | Pitch ve gazete kreatifi Node sunucusunun yerel dosya sistemine yazılır | Supabase Storage, codec doğrulama, virüs/moderasyon hattı, kalıcı CDN URL'si |
| Video süresi | İstemci metadata ile hızlı geri bildirim verir; sunucu MP4 `mvhd` veya WebM `Info/Duration` alanından süreyi tekrar ölçer ve 90 saniye/50 MB sınırını uygular | Worker/transcoder tarafında codec çözme, yeniden kodlama ve kötü amaçlı dosya taraması |
| nGazete ödeme | Çakışma denetimi ve fiyat sonucu üreten demo işlemi | Gerçek ödeme sağlayıcısı, idempotency key, webhook ve muhasebe kaydı |
| Yayın Atölyesi üyeliği | 200₺/ay yetkilerini gösteren demo profil bayrağı | Faturalandırma ile bağlı entitlement ve yenileme/iptal durumu |
| Dağıtım | `main` push'unu Hostinger ve Render ayrı ayrı çekip derler; `/api/health` SHA bildirir | Aynı yöntem korunur; SHA eşitliği yayın kapısıdır |

Bu tablo nedeniyle `DEMO_MODE=false` ayarı tek başına uygulamayı production veri
yoluna geçirmiş sayılmaz. Supabase istemci ve şemalarının bulunması, sayfa ve
action'ların bugün Supabase üzerinden çalıştığı iddiası için yeterli değildir.

## Doğrulama kaydı

Kaynak SHA `dbcd4ff30bc585d04130d55802ecd8f38166559b` için:

| Kontrol | Sonuç |
| --- | --- |
| `npm ci` | Geçti: nihai kilit dosyasından 554 paket kuruldu, 555 paket denetlendi; npm 0 açık bildirdi |
| `npm run verify` | Geçti: TypeScript, ESLint 9.39.2 ve Vitest 3.2.6 ile 6 dosyada 130/130 birim testi |
| `npm run build` | Geçti: Next.js 16.3.2 Webpack üretim derlemesi; 32 statik sayfa üretim adımı tamamlandı ve yeni `/saved` rotası çıktı listesinde yer aldı |
| `npm audit --omit=dev --json` | Kritik 0, yüksek 0, orta 0, düşük 0; toplam 0. Next 15'in dahili `postcss` ve `sharp` kayıtları Next 16.3.2 geçişiyle kapandı. |
| Tam `npm run test:e2e` | Tek koşuda 164/164 geçti: 82 masaüstü + 82 Pixel 7, 21,8 dakika. Axe, 320 piksel reflow, klavye, reduced-motion, harita/ilçe, story, gazete, Yayın Atölyesi ve beğeni/yorum/kaydet/takip akışları dahildir. Atlanan, izole tekrar gerektiren veya zaman aşımına uğrayan senaryo yoktur. |
| Yerel görsel kontrol | Next 16 üretim derlemesinde masaüstü ana akış, nGazete, Yayın Atölyesi, profil kısayolu ve Kaydedilenler; 412×915 Pixel 7 görünümünde ana akış, Yayın Atölyesi, Türkiye haritası, açık yarım yay 5N seçici, profil kısayolu ve Kaydedilenler incelendi. Kırpılma, yatay sayfa taşması veya bozuk yerleşim görülmedi. Normal harekette animasyonlar aktif; reduced-motion E2E kontrolleri masaüstü ve mobilde geçti. |
| 5N geometri ölçümü | Desktop ve mobilde aktif hedef 56×56, diğer hedefler yaklaşık 45,92×45,92; viewport dışına taşma yok; uç opacity yaklaşık 0,18 |

`npm ci`, ESLint 9.39.2 için destek-sonu uyarısı verir. ESLint 10.9.0 bu turda
ayrıca denendi; ancak Next 16.3.2'nin paketlediği üç ESLint eklentisi henüz 10'u
peer aralığına almadığı için `npm ls` geçersiz ağaç raporladı. Zorlanmış ve
tekrarlanamaz bir kurulum yerine geçerli ESLint 9 ağacı korundu; gerekçe ve
yeniden değerlendirme koşulu karar 0015'te kayıtlıdır.

Okuyucuya taşınan kreatif; düzenleme ızgarası ve seçim çerçevesi olmadan, dosya
oranı korunarak gösterilir. CTA renkleri, biçimi ve izin verilen hareketi onay
anındaki kopyadan gelir. Gelecek sayıya doğrudan tarih URL'siyle erişim 06.00
öncesinde kapalıdır. Uzun süre açık kalan sunucu yeni İstanbul gününün sayısını
ilk okumada oluşturur; kullanıcı mutasyonlarını ve önceki günün sponsorlu
yerleşimlerini taşımaz. İlk oturumda 06.00'a kadar son yayımlanmış sayı gösterilir.
Uygulama kaynak commit'i `dbcd4ff30bc585d04130d55802ecd8f38166559b`,
23 Ağustos 2026'da hem Hostinger hem Render `/api/health` yanıtında birebir
görüldü. GitHub Actions koşusu `32632751677` içindeki Verify işi de `npm ci`,
verify ve 164 E2E testini geçti. Aynı koşunun ilk `Confirm live` işi Render SHA'sını
doğruladı; ancak Hostinger'ın GitHub Azure runner bağlantısını 18 kez yanıtsız
bırakması nedeniyle yanlış negatif verdi. Yerel doğrudan istek ve cache-busting
URL kullanan bağımsız gözlemci aynı anda doğru Hostinger SHA'sını döndürdü.
İki ortamın `/login` rotası da gerçek `nSosyal` ile `Demo hesabıyla gir`
metinlerini içerdi.
Workflow bu belgeyle birlikte, doğrudan kanal boşsa aynı public endpoint'i
bağımsız gözlemci üzerinden okuyacak ve her durumda tam SHA eşitliği arayacak
şekilde güncellendi; eski veya ayrıştırılamayan yanıt başarılı sayılmaz.

Hostinger'ın dağıtım sonrası tarayıcısı iki yüksek kayıt göstermeye devam etti:
`brace-expansion@1.1.18` yalnızca ESLint/minimatch geliştirme zincirinde;
`esbuild@0.25.12` ise Vite test aracında bulunuyor ve eşleşen duyuru geri çekilmiş
bir `deno-esbuild` duyurusudur. `npm ls brace-expansion esbuild --omit=dev --all`
üretim ağacında iki paketin de bulunmadığını (`empty`) doğruladı. Bu nedenle
runtime açığı iddia edilmiyor; ancak Hostinger tarayıcısı temizmiş gibi de raporlanmıyor.

## Açık riskler ve yayın kararı

### Bloker: gerçek kullanıcı araştırması yok

Teknik rapordaki kullanılabilirlik testi ve ölçülen kullanıcı metriği bölümleri
gerçek katılımcı verisiyle doldurulmuş değil. En az 5-8 hedef kullanıcıyla görev
başarı oranı, görev süresi, hata sayısı ve kısa görüşme notları toplanmadan
"kullanıcı doğrulandı" denemez. Bu çalışma insan katılımcı gerektirir; kod veya
sentetik E2E bunun yerine geçmez.

### Yüksek: production veri yolu tamamlanmadı

Şema/RLS hazırlığı güçlü olsa da çalışma zamanı `DemoStore` kullanıyor. Supabase
adapteri, Auth ve Storage entegrasyonu tamamlanana kadar aday yalnızca yarışma
prototipi olarak sunulmalıdır.

### Orta: production video işleme hattı yok

Sunucu MP4/WebM kapsayıcısından gerçek süreyi okuyup kayıt öncesi sınırı uygular.
Ancak codec çözme/yeniden kodlama, virüs taraması ve kalıcı Storage worker'ı
bulunmadığından bu doğrulayıcı production medya hattının yerine geçmez.

### Yüksek: tam manuel erişilebilirlik turu eksik

Axe, klavye senaryoları, focus trap, renk dışı durum, metin eşdeğeri ve iki
viewport otomatik geçti. Kritik 5N arama/sonuç yüzeylerinin 320 CSS pikseldeki
yüzde 400 reflow karşılığı elle ve otomatik kontrol edildi. Yine de tüm kritik
yolculuklarda gerçek ekran okuyucu, yüzde 200/400 zoom, switch-control ve cihaz
üstü reduced-motion turu ayrıca yapılmalıdır.

### Karar

Mühendislik açısından demo adayı yeşildir; yarışma kanıt paketi henüz tamamlanmış
değildir. Yeni Yayın Atölyesi veya genel ürün özelliği eklenmemeli. Sıradaki iş
gerçek kullanıcı testi, release SHA'ya bağlı ekran/video kanıtı ve teknik rapordaki
ölçüm alanlarının gerçek sonuçlarla doldurulmasıdır.
