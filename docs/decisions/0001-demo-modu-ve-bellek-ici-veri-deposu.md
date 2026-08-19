# 0001 — Demo modu ve bellek içi veri deposu

**Durum:** Kabul edildi

## Bağlam

Prototip iki farklı seyirciye aynı anda hizmet etmek zorunda: canlı demoyu izleyen
jüri ve depoyu klonlayıp çalıştırmak isteyen bir değerlendirici. İkisi için de en
büyük risk teknik değil, lojistik: sahnede internetin çökmesi, Supabase projesinin
uyuması, anahtarların dolmuş olması, `.env` dosyasının eksik olması.

Spec de bunu ayrıca söylüyor (15.4): kritik demo verisi önceden seed edilmeli, dış
servis bağımlılığı azaltılmalı.

## Karar

Uygulama `DEMO_MODE` ile iki modda çalışır ve **varsayılan demo modudur**:

- Tüm veri `src/lib/seed/` altındaki üreticilerle sunucu belleğinde kurulur.
- Okuma ve yazma `DemoStore` (`src/lib/data/store.ts`) üzerinden yapılır; sayfalar
  seed modüllerine doğrudan dokunmaz.
- `DEMO_MODE=false` yapıldığında Supabase ortam değişkenleri zorunlu olur; eksikse
  uygulama sessizce devam etmek yerine açık hata verir.
- Supabase yolu şema, tetikleyici ve RLS düzeyinde tamamlanmış olarak
  `supabase/migrations/` altında durur.

## Sonuçlar

- `npm install && npm run dev` çalıştırmak için hiçbir yapılandırma gerekmez;
  ağ erişimi de gerekmez.
- Demo, servis kesintisinden etkilenmez.
- Store'un tek erişim noktası olması, Supabase uygulamasının aynı metot imzalarını
  karşılayan ikinci bir sınıf olarak yazılabilmesini sağlar.
- **Bedeli:** demo modunda veri kalıcı değildir; süreç yeniden başlarsa
  değişiklikler kaybolur. Gösterim için bu istenen davranıştır, ürün için değil.
- E2E testleri aynı sunucu içi depoyu paylaştığı için Playwright tek işçiyle
  çalışmak ve her testte `/api/demo/reset` çağırmak zorunda.

## Değerlendirilen alternatifler

- **Doğrudan Supabase'e bağlanmak:** en gerçekçi yol, ama demoyu ağa ve barındırılan
  bir projeye bağımlı kılıyor. Yarışma ortamında kabul edilemez bir risk.
- **SQLite / dosya tabanlı yerel veritabanı:** kalıcılık kazandırırdı, ama kurulum
  adımı ve migration ikilemi getirir; prototipin kazanımı buna değmez.
- **Sabit JSON fixture'ları:** yazma yolu (beğeni, katılma, hatırlatma, onay)
  gösterilemezdi; demonun yarısı ölü ekran olurdu.
