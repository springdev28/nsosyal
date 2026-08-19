# nSosyal 5N — teknik özet

Bu dosya, ürün raporunun geliştirme sırasında kaynak alınan kısa hâlidir. Uzun
rapordaki bölüm numaraları korunmuştur; kod içindeki `PROJECT_SPEC 7.1` gibi
yorumlar bu numaralara işaret eder.

---

## 1. Karar ilkeleri

- Ürün cümlesi tek: **bilim, teknoloji ve inovasyon topluluklarını bağlamıyla
  birlikte buluşturan sosyal keşif katmanı.**
- Prototipin görevi tüm sosyal ağ özelliklerini taşımak değil, farkı gösteren
  akışları eksiksiz çalıştırmaktır.
- Belirsizlikte tahmin değil, spec ve mevcut kod kaynak alınır.
- Ürüne sırf etiket olsun diye yapay zekâ eklenmez; geliştirmede kullanılabilir.

## 2. Ürün konumlandırması

**Değildir:** LinkedIn (kariyer vitrini), X (hız ve tartışma), Discord (kapalı
sohbet), etkinlik platformu (tek amaçlı bilet/kayıt).

**Odur:** bir kişinin *ne* yaptığını, *nerede* ve *ne zaman* olduğunu, *nasıl*
öğrenildiğini ve *neden* başladığını aynı yerde tutan; hem gündelik hem üretken
sosyalliğe izin veren keşif katmanı.

Duygusal vaat: "burada yalnız değilim, benimle aynı şeyi merak eden insanlar var
ve nereden başlayacağımı görüyorum."

## 3. Kullanıcılar

| Persona | İhtiyaç |
| --- | --- |
| Meraklı öğrenci | Nereden başlayacağını görmek, yakınındaki topluluğu bulmak |
| Üreten genç | Bitmemiş işi paylaşabilmek, geri bildirim ve ekip bulmak |
| Topluluk yürüteni | Üyeye ulaşmak, etkinlik duyurmak, kaynak biriktirmek |
| Kurum / teknopark | Doğru kitleye görünmek, etkinlik ve ilan duyurmak |
| Moderatör | Topluluk kalitesini ve güvenliğini korumak |

## 4. 5N bilgi mimarisi

5N bir menü değil, **ortak veri dili**dir:

| Boyut | Anlamı | Veri karşılığı |
| --- | --- | --- |
| Ne | konu / alan | `topics`, `post_topics` |
| Nerede | il / ilçe / çevrim içi | `province_code`, `district_code`, `is_online` |
| Ne zaman | tarih, süre, son başvuru | `events.starts_at`, `deadline_at` |
| Nasıl | öğrenme yolu, kaynak | `resources` (tür, seviye, süre) |
| Neden | motivasyon hikâyesi | `why_stories` |
| Kim | kişi, ekip, kurum | `profiles`, `project_members` |

Bir gönderi yalnızca sahip olduğu bağlamları taşır; beş alanı doldurmak zorunlu
değildir. Bağlam çipleri (arayüzdeki renkli etiketler) yalnızca gerçekten var olan
bağlamlar için gösterilir.

## 5. Kapsam

**P0 (prototipte çalışan çekirdek):** demo girişi ve onboarding, karışık ana akış,
niyet modları, kısa video, topluluk sistemi ve moderatör onayı, Nerede haritası,
Ne zaman keşfi, Neden panosu, Nasıl kaynakları, proje sayfaları, nGazete ve ilan
akışı, bildirimler, ayarlar, yönetim paneli.

**P1 (kısmen):** arama, rozet/ilerleme, gelişmiş analitik.

**P2 (final sonrası):** mesajlaşma, canlı yayın, gerçek ödeme entegrasyonu, mobil
uygulama.

## 6. Ana akışlar

- **A —** gündelik akış → ilgi çeken gönderi → topluluğa katılma.
- **B —** Keşfet → Nerede (il seçimi) → Ne zaman (tarih filtresi) → etkinlik →
  hatırlatma.
- **C —** Neden hikâyesi → bağlı proje sayfası.
- **D —** proje oluşturma → kısa pitch videosu.
- **E —** nGazete → sponsorlu alan → ilan başvurusu.

## 7. Özellik notları

### 7.1 Ana akış
Gönderi türleri: metin, görsel, video, soru, proje güncellemesi, etkinlik duyurusu,
kaynak önerisi, Neden bağlantısı. Kart alanları: yazar, zaman, gövde, medya, bağlam
çipleri, etkileşim satırı, "Neden gösteriliyor?" açıklaması.

Niyet modları akışın ağırlıklarını değiştirir: **Sosyalleş, Keşfet, Öğren, Üret.**

### 7.2 Kısa video
Dikey, kısa (≤ 60 sn), ses varsayılan kapalı, metin karşılığı zorunlu alan olarak
sunulur. Otomatik oynatma `prefers-reduced-motion` tercihinde devre dışı kalır.

### 7.3 Topluluklar
Kök topluluk (geniş alan) + dal topluluk (şehir, okul, alt konu). **Topluluk
oluşturmak moderatör onayına tabidir**; başvuru kuyruğu ve denetim kaydı vardır.
Sekmeler: Akış, Etkinlikler, Kaynaklar, Üyeler, Hakkında.

### 7.4 Nerede
MapLibre + yerel GeoJSON. İl seçimi haritadan veya listeden yapılabilir; **harita
sonuçları her zaman eşdeğer bir liste görünümüyle birlikte sunulur.** Pilot ilde
(İzmir) ilçe katmanı açılır.

### 7.5 Ne zaman
Geçmiş / bugün / gelecek üç bölmesi, tarih aralığı ön ayarları, son başvuru
uyarısı, etkinliğe hatırlatma kurma.

### 7.6 Neden
Motivasyon panosu; bir kişiyi alana getiren gerçek deneyim. **Motivasyon sözü
duvarı değildir.** Hikâye kartı projeye, topluluğa veya kaynağa bağlanabilir.

### 7.7 Nasıl
Topluluk kaynakları: tür, seviye (başlangıç/orta/ileri), tahmini süre, moderatör
doğrulaması.

### 7.8 Projeler
Özet, ekip, ilerleme günlüğü, bağlı Neden hikâyesi, kısa pitch videosu, bağlı
topluluk ve konular.

### 7.9 nGazete
Günlük sayı; oturumda bir kez açılır ve kapatma düğmesi kısa bir gecikmeden sonra
etkinleşir (erişilebilirlik tercihinde gecikme kalkar). Ücretli yerleşim yalnızca
burada yaşar; her sponsorlu kart açıkça etiketlenir.

## 8. Tasarım ve erişilebilirlik

Koyu tema varsayılan, üç kolonlu masaüstü düzeni, alt gezinme çubuğu ile mobil.
Hedef **WCAG 2.2 AA**:

- tüm kontroller klavyeyle erişilebilir, odak göstergesi gizlenmez;
- renk tek başına durum iletmez (ikon/metin/işaret eşlik eder);
- ikon düğmelerinde erişilebilir isim, form alanlarında ilişkilendirilmiş hata;
- video için metin karşılığı, harita için liste eşdeğeri;
- `prefers-reduced-motion` tercihinde animasyon ve otomatik oynatma azalır;
- dokunma hedefleri en az 24 px.

## 9. Mimari

Next.js App Router + TypeScript tek repoda; UI Tailwind; veri Supabase Postgres;
yetki Row Level Security; harita MapLibre + yerel GeoJSON; test Vitest + Playwright
+ axe-core.

Prototip iki modda çalışır:

- `DEMO_MODE=true` (varsayılan): veri sunucu belleğinde üretilir, dış servis yok.
- `DEMO_MODE=false`: `supabase/migrations/` altındaki şema ve RLS politikaları
  kullanılır.

Ortam değişkenleri `.env.example` içinde. **Service role anahtarı yalnızca sunucu
tarafındadır; `NEXT_PUBLIC_` önekiyle tanımlanmaz.**

## 10. Veri modeli

Ana tablolar: `profiles`, `topics`, `follows`, `communities`, `community_members`,
`community_applications`, `posts`, `comments`, `post_likes`, `saves`, `media`,
`projects`, `project_members`, `project_updates`, `events`, `reminders`,
`why_stories`, `resources`, `newspaper_issues`, `newspaper_items`, `ad_requests`,
`notifications`, `reports`, `moderation_actions`, `analytics_events`.

5N bağlam tabloları içeriği konuma, konuya ve zamana bağlar (`post_topics`,
`project_communities`, il/ilçe alanları).

Roller: `user`, `organization`, `moderator`, `admin`. Rol yükseltme yalnızca
yönetici tarafından yapılabilir ve tetikleyiciyle korunur.

## 11. Güvenlik, mahremiyet, moderasyon

- **Konum isteğe bağlıdır ve kullanıcı denetimindedir.** En ince ayrıntı ilçe
  düzeyidir; kesin adres veya canlı konum yoktur. Konum paylaşmamak keşfi
  engellemez, yalnızca kişinin yerel kişi sonuçlarında görünmesini engeller.
- Topluluk oluşturma moderatör onayına tabidir; her karar denetim kaydına yazılır.
- Raporlama akışı ve moderasyon kuyruğu vardır.
- Tüm tablolarda RLS açıktır; admin işlemleri sunucu tarafındadır.

## 12. Sıralama ve keşif

Akış skoru **açıklanabilir ağırlıklı toplam**dır (makine öğrenmesi yok):

| Sinyal | Ağırlık |
| --- | --- |
| Konu eşleşmesi | 0.30 |
| Takip edilen kaynak | 0.20 |
| Topluluk eşleşmesi | 0.15 |
| Niyet uyumu | 0.10 |
| Tazelik | 0.10 |
| Konum eşleşmesi | 0.10 |
| Keşif bonusu | 0.05 |

Niyet modu bu ağırlıkları yeniden dağıtır; toplam her modda 1.0'da kalır. Yeni
seslere küçük bir keşif payı ayrılır.

"Neden gösteriliyor?" açıklaması yalnızca beş sinyalden en güçlüsünü söyler: konu,
takip, topluluk, konum, keşif.

> **Değişmez kural:** ücretli yerleşim kişisel akış sıralamasını hiçbir koşulda
> etkilemez. Sıralama modülü sponsorluk kavramını bilmez.

## 13. Test

- **Birim (Vitest):** sıralama, zaman yardımcıları, veri deposu — 97 test.
- **E2E (Playwright):** yarışma için kritik yedi akış + ek senaryolar.
- **Erişilebilirlik (axe-core):** tüm ana sayfalar, açık ve koyu tema, masaüstü ve
  mobil görünüm.

## 14. Git akışı

Küçük, anlamlı commit'ler; her değişiklikten sonra typecheck + lint + ilgili
testler. `main` her zaman demo edilebilir durumda tutulur.

## 15. Demo

Sentetik seed veri seti (21 profil, 18 topluluk, 60 gönderi, 21 video, 9 proje,
12 etkinlik, 12 Neden hikâyesi, 15 kaynak, 3 gazete sayısı, 4 ilan başvurusu) ve
tek tıkla giriş yapılan dört demo hesabı. Sunum sırası ve dayanıklılık notları:
[docs/demo.md](docs/demo.md).

## 16. Ajanla çalışma

Repo kuralları [AGENTS.md](AGENTS.md) ve [CLAUDE.md](CLAUDE.md) dosyalarındadır.
Karar kayıtları `docs/decisions/` altındadır.
