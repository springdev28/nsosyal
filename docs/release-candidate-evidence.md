# Yayın adayı kanıt matrisi

Tarih: 22 Ağustos 2026  
Doğrulanan kaynak SHA: `9413542e840ffb8e7e74c0f9c866851cc9cafac0`  
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
| Demo giriş → karma akış → story → gelişmiş gönderi oluşturucu | `/login`, `/feed`, `/video`, `/create` | Demo oturumu, `DemoStore`, Server Actions | `competition-flows` 1; ranking/store birim testleri | `/feed` 1440×1000 ve 390×844 incelendi; desktop/mobile axe | Doğrulandı |
| N işareti → yarım yay → gerçek 5N paneli | `/explore`, `/explore/map`, `/explore/time`, `/explore/how`, `/explore/why` | İstemci seçim durumu; seçim URL rotasına taşınır | `five-n-selector` içindeki 8 senaryo iki viewportta geçti | Açık yay 1440×1000 ve 390×844 incelendi; yatay taşma yok; hedefler en az 44×44; açık durumda axe temiz | Doğrulandı |
| Türkiye yoğunluk haritası → il → ilçe → sonuç | `/explore/map` | Yerel GeoJSON + `DemoStore` yoğunluk sorgusu; kişisel canlı koordinat yok | `map-density`; `competition-flows` 2 | Desktop/mobile harita, legend ve erişilebilir liste incelendi; axe temiz | Doğrulandı |
| Etkinlik → hatırlatma → bildirim | `/events/[slug]`, `/notifications` | Server Action → `DemoStore` hatırlatma kaydı | `competition-flows` 3 iki viewportta geçti | Etkinlik ve bildirim rotalarında desktop/mobile axe temiz | Otomatik doğrulandı |
| Topluluğa katılma → kaynak; başvuru → moderatör kararı → denetim kaydı | `/communities/[slug]`, `/communities/apply`, `/admin/moderation`, `/admin` | Server Actions → `DemoStore`; rol denetimi sunucuda | `competition-flows` 4 ve 7; store birim testleri | İlgili kullanıcı yüzeylerinde desktop/mobile axe temiz | Otomatik doğrulandı |
| Neden hikâyesi → bağlı yaşayan proje | `/explore/why`, `/explore/why/[id]`, `/projects/[slug]` | `DemoStore` view modelleri; oluşturma Server Action üzerinden | `competition-flows` 5 iki viewportta geçti | Neden ve proje yüzeylerinde desktop/mobile axe temiz | Otomatik doğrulandı |
| Proje oluşturma → isteğe bağlı pitch | `/create/project`, `/projects/[slug]` | Server Action dosyayı doğrulayıp yazar; proje bundan sonra oluşturulur | 3 medya sınırı birim testi; tüm E2E paketi; proje formu axe | Geçersiz tür/boyut artık yarım/kopya proje açmaz | Demo doğrulandı |
| nGazete okuyucu → arşiv/sayfa → ilgi vurgusu; sponsorun akıştan yalıtılması | `/newspaper`, `/feed` | `DemoStore` gazete sayıları; ranking sponsorluk sinyali almaz | `competition-flows` 6; ranking birim testleri | `/newspaper` 1440×1000 ve 390×844 incelendi; koyu kâğıt, kolonlar ve taşma kontrol edildi; axe temiz | Doğrulandı |
| Yayın Atölyesi → alan seçimi → kreatif/CTA → ödeme → moderatör kararı → zamanlı okuyucu çıktısı | `/publish`, `/admin/newspaper`, `/notifications`, `/newspaper` | Server Actions → `DemoStore`; onay anında değişmez yayın kopyası oluşur, sayı İstanbul saatiyle 06.00'dan önce açılmaz | `competition-flows` 6 ödeme/moderasyon/bildirim senaryosu iki viewportta; store testi yayın sınırı, kreatif ve CTA'yı doğruladı | Önizlemede ızgara/seçim kutusu yok; gazete kâğıdı okuyucuyla aynı; desktop/mobile axe temiz | Demo doğrulandı |
| Kalıcı tercihler ve konum mahremiyeti; geçici niyetin ayrılığı | `/onboarding`, `/settings`, `/profile/[username]` | Server Actions → `DemoStore`; ilçe en ince konum düzeyi | `personalization`, `profile`, `competition-flows` konum senaryosu | Ayarlar/profil/onboarding desktop/mobile axe temiz | Otomatik doğrulandı |

## Mevcut sistem ile production hedefinin ayrımı

| Alan | Bu adayda gerçekten çalışan | Production hedefi / açık iş |
| --- | --- | --- |
| Kimlik doğrulama | Sentetik hesap seçimi ve demo oturum çerezi | Supabase Auth ve gerçek hesap yaşam döngüsü |
| Uygulama verisi | Süreç belleğindeki deterministik `DemoStore` | Supabase Postgres adapteri; mevcut migration ve RLS sözleşmelerini kullanan runtime yol |
| Kalıcılık | Aynı çalışan sunucu süreci boyunca; reset veya yeniden dağıtım veriyi sıfırlar | Kalıcı veritabanı, yedekleme ve gözlemlenebilirlik |
| Medya | Pitch ve gazete kreatifi Node sunucusunun yerel dosya sistemine yazılır | Supabase Storage, MIME içerik doğrulama, virüs/moderasyon hattı, kalıcı CDN URL'si |
| Video süresi | İstemci 90 saniye uyarısı verir; sunucu MIME ve 50 MB sınırını doğrular | Worker/transcoder tarafında güvenilir süre ölçümü ve yeniden kodlama |
| nGazete ödeme | Çakışma denetimi ve fiyat sonucu üreten demo işlemi | Gerçek ödeme sağlayıcısı, idempotency key, webhook ve muhasebe kaydı |
| Yayın Atölyesi üyeliği | 200₺/ay yetkilerini gösteren demo profil bayrağı | Faturalandırma ile bağlı entitlement ve yenileme/iptal durumu |
| Dağıtım | `main` push'unu Hostinger ve Render ayrı ayrı çekip derler; `/api/health` SHA bildirir | Aynı yöntem korunur; SHA eşitliği yayın kapısıdır |

Bu tablo nedeniyle `DEMO_MODE=false` ayarı tek başına uygulamayı production veri
yoluna geçirmiş sayılmaz. Supabase istemci ve şemalarının bulunması, sayfa ve
action'ların bugün Supabase üzerinden çalıştığı iddiası için yeterli değildir.

## Doğrulama kaydı

Kaynak SHA `9413542e840ffb8e7e74c0f9c866851cc9cafac0` için:

| Kontrol | Sonuç |
| --- | --- |
| `npm run verify` | Geçti: typecheck, lint, 6 dosyada 124/124 birim testi |
| `npm run build` | Geçti: production derlemesi, 32 sayfa çıktısı |
| `npm run test:e2e` | İlk tam koşuda 140 geçti; işletim sistemi `ERR_NETWORK_IO_SUSPENDED` nedeniyle zaman aşımına uğrayan 4 senaryo temiz sunucuda `--last-failed` ile 4/4 geçti. Yeni moderasyon senaryosu ayrıca iki viewportta 2/2 geçti. Atlanan yok |
| Canlı görsel kontrol | Hostinger üzerinde 1440×1000 ve 390×844: giriş, akış, 5N açık yay, harita/ilçe sonuçları, nGazete ve Yayın Atölyesi yüzeyleri; yatay taşma gözlenmedi |
| 5N geometri ölçümü | Desktop ve mobilde aktif hedef 56×56, diğer hedefler yaklaşık 45,92×45,92; viewport dışına taşma yok; uç opacity yaklaşık 0,18 |

Okuyucuya taşınan kreatif; düzenleme ızgarası ve seçim çerçevesi olmadan, dosya
oranı korunarak gösterilir. CTA renkleri, biçimi ve izin verilen hareketi onay
anındaki kopyadan gelir. Gelecek sayıya doğrudan tarih URL'siyle erişim 06.00
öncesinde kapalıdır. Nihai canlı SHA, push sonrası iki ortamın `/api/health`
yanıtıyla ayrıca doğrulanır.

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

### Yüksek: sunucu tarafında gerçek video süresi ölçülmüyor

MIME ve byte sınırı artık proje kaydından önce doğrulanıyor. Ancak 90 saniye
sınırı tarayıcı metadata'sına dayanıyor; production worker/transcoder kanıtı
olmadan güvenlik sınırı kabul edilmemelidir.

### Yüksek: tam manuel erişilebilirlik turu eksik

Axe, klavye senaryoları, focus trap, renk dışı durum, metin eşdeğeri ve iki
viewport otomatik geçti. Yine de gerçek ekran okuyucu, yüzde 200/400 zoom,
switch-control ve cihaz üstü reduced-motion turu ayrıca yapılmalıdır.

### Karar

Mühendislik açısından demo adayı yeşildir; yarışma kanıt paketi henüz tamamlanmış
değildir. Yeni Yayın Atölyesi veya genel ürün özelliği eklenmemeli. Sıradaki iş
gerçek kullanıcı testi, release SHA'ya bağlı ekran/video kanıtı ve teknik rapordaki
ölçüm alanlarının gerçek sonuçlarla doldurulmasıdır.
