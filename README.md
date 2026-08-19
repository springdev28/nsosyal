# nSosyal 5N

Bilim, teknoloji ve inovasyon topluluklarını birbirine bağlayan **bağlamsal sosyal
keşif katmanı** prototipi. Gündelik sosyalliği (paylaşım, mizah, kısa video) proje,
öğrenme, topluluk ve etkinlik keşfiyle aynı üründe birleştirir; ücretli görünürlüğü
ise kişisel akıştan tamamen ayrı bir yüzeyde — **nGazete** — tutar.

Ürünün omurgası 5N bağlam modelidir: **Ne, Nerede, Ne zaman, Nasıl, Neden** (ve
tamamlayıcı olarak **Kim**). 5N bir menü değil, tüm içeriklerin paylaştığı ortak
veri dilidir: bir gönderi yalnızca sahip olduğu bağlamları taşır, beş alanı
doldurmak zorunlu değildir.

> **Bu bir yarışma prototipidir.** Tüm hesaplar, gönderiler, projeler, kurumlar ve
> videolar sentetiktir ve arayüzde `demo` rozetiyle işaretlenir. Gerçek kişi verisi
> taklit edilmez.

## Hızlı başlangıç

Gereksinim: Node.js 20+ (geliştirme Node 22 ile yapıldı).

```bash
npm install
cp .env.example .env.local     # varsayılan DEMO_MODE=true yeterli
npm run dev                    # http://localhost:3000
```

Giriş ekranında dört demo hesabından biri tek tıkla seçilir; parola yoktur.
Ayrıntı için [docs/demo.md](docs/demo.md).

Uygulama varsayılan olarak **DEMO_MODE** ile çalışır: veri sunucu belleğinde
üretilir, hiçbir dış servise bağlanılmaz. Kurulum için Supabase projesi, API
anahtarı veya internet bağlantısı gerekmez — harita, video ve görseller dahil her
şey repodan gelir. Bunun gerekçesi ve üretim yolu: [docs/decisions/0001-demo-modu-ve-bellek-ici-veri-deposu.md](docs/decisions/0001-demo-modu-ve-bellek-ici-veri-deposu.md).

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve sunumu |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm test` | Vitest birim testleri (97 test) |
| `npm run test:e2e` | Playwright E2E + erişilebilirlik (49 test × 2 profil) |
| `npm run verify` | typecheck + lint + birim testleri |
| `npm run build:geo` | Harita GeoJSON'larını kaynak veriden yeniden üretir |
| `npm run build:media` | Demo videolarını yeniden üretir |
| `npm run build:supabase-seed` | `supabase/seed.sql` dosyasını seed verisinden üretir |

`npm run test:e2e` gerektiğinde uygulamayı kendisi derleyip başlatır
(`playwright.config.ts` → `webServer`).

## Ekranlar

| Alan | Yol | İçerik |
| --- | --- | --- |
| Ana akış | `/feed` | Karışık akış, niyet modları (Sosyalleş / Keşfet / Öğren / Üret), "Neden gösteriliyor?" |
| Kısa video | `/video` | Dikey video akışı, metin karşılığı, ses varsayılan kapalı |
| Keşfet | `/explore` | 5N giriş noktaları |
| Nerede | `/explore/map` | MapLibre Türkiye haritası + eşdeğer liste görünümü |
| Ne zaman | `/explore/time` | Geçmiş/bugün/gelecek zaman makinesi, son başvuru uyarıları |
| Neden | `/explore/why` | Motivasyon hikâyeleri panosu ve projeye geçiş |
| Nasıl | `/explore/how` | Topluluk kaynakları, seviye ve süre filtreleri |
| Topluluklar | `/communities` | Kök/dal topluluklar, katılma, başvuru formu |
| Projeler | `/projects` | Proje sayfaları, ilerleme günlüğü, pitch videosu |
| nGazete | `/newspaper` | Günlük sayı, sponsorlu alan, ilan başvurusu |
| Yönetim | `/admin` | Topluluk onay kuyruğu, raporlar, gazete/ilan yönetimi (moderatör ve yönetici) |

## Teknoloji

- **Next.js 15 (App Router) + React 19 + TypeScript** — sunucu bileşenleri ve
  Server Actions; ayrı bir API katmanı yok.
- **Tailwind CSS 4** — tema değişkenleri `src/app/globals.css` içinde; koyu tema
  varsayılan, açık tema kullanıcı tercihiyle.
- **MapLibre GL JS + yerel GeoJSON** — tile sunucusu yok, harita çevrimdışı çalışır.
- **Supabase (Postgres + RLS)** — üretim yolu. Şema, tetikleyiciler ve satır
  düzeyinde güvenlik politikaları `supabase/migrations/` altında hazır.
- **Vitest + Playwright + axe-core** — birim, kritik akış ve erişilebilirlik testleri.

## Klasör düzeni

```
src/
  app/            App Router sayfaları ((app) grubu = oturum açılmış kabuk)
  actions/        Server Actions (sosyal etkileşim, topluluk, proje, gazete)
  components/     feed, map, video, community, discovery, newspaper, layout, ui
  lib/
    auth/         demo oturumu ve rol kontrolleri
    data/         DemoStore: tüm okuma ve mutasyonlar
    ranking/      açıklanabilir akış sıralaması
    geo/          il/ilçe verisi ve yardımcıları
    seed/         sentetik veri seti üreticileri
    supabase/     istemci yapılandırması (DEMO_MODE=false yolu)
    time/         Europe/Istanbul tarih yardımcıları
  types/          domain ve view tipleri
supabase/         migration'lar ve üretilmiş seed.sql
public/geo/       81 il + İzmir ilçeleri GeoJSON
public/demo/      sentetik görsel, poster ve video dosyaları
tests/            unit (Vitest) ve e2e (Playwright + axe)
docs/             mimari, demo ve karar kayıtları
```

## Erişilebilirlik

Hedef WCAG 2.2 AA. Otomatik tarama (axe-core) tüm ana sayfalarda hem açık hem koyu
temada, masaüstü ve mobil görünümde ihlalsiz çalışır. Otomatik testin
kanıtlamadıkları — klavye sırası, odak yönetimi, ekran okuyucu deneyimi — elle
kontrol edilir. Ayrıntı: [docs/architecture.md](docs/architecture.md#erişilebilirlik).

## Veri ve lisans

Harita sınırları OpenStreetMap katkıda bulunanlarından türetilmiştir (ODbL) ve
uygulama içinde kaynak gösterilir. Görsel keşif amaçlıdır; resmî idari sınır verisi
değildir. Diğer tüm içerik bu prototip için üretilmiş sentetik veridir.

## Belgeler

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — ürün ve teknik özet
- [docs/architecture.md](docs/architecture.md) — veri modeli ve sistem kararları
- [docs/demo.md](docs/demo.md) — demo hesapları ve sunum senaryosu
- [docs/decisions/](docs/decisions/) — karar kayıtları
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) — kodlama ajanları için repo kuralları
