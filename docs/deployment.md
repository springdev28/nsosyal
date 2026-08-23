# Dağıtım

## Çalışma zamanı ve üretim derlemesi

Dağıtım ortamları **Node.js 22** kullanmalıdır. Yerelde `.nvmrc` bu ana sürümü
seçer, `package.json` `node >=22` ister ve `.npmrc` içindeki
`engine-strict=true` desteklenmeyen sürümde kurulumu durdurur. CI da
`actions/setup-node` ile Node 22 kullanır.

`npm run build`, Next.js 16.3.2 üzerinde açıkça `next build --webpack`
çalıştırır. Bu bir Next 15'e dönüş değildir. Çalışma ortamında Turbopack'in
PostCSS işçisi yerel port açarken `EPERM` aldığı için desteklenen Webpack yolu
yerel, Hostinger ve Render derlemelerini tekrarlanabilir tutar.

23 Ağustos 2026 tarihli GitHub Actions koşusu 32636167317, güncel
`b4844940a8fc7ddd7eb4974a52ac3bbbbe89e577` kaynağında Node.js 22 ile
130/130 birim testini ve 82 masaüstü ile 82 Pixel 7 senaryosundan oluşan
164/164 Playwright koşusunu tamamladı. Aynı koşunun Confirm live işi Hostinger
ve Render `/api/health` yanıtlarında tam `b484494...` commit kimliğini doğruladı.
Bir canlı adresin yalnızca HTTP 200 döndürmesi dağıtım kanıtı sayılmaz. Yanıttaki
commit alanı, push edilen tam SHA ile eşleşmelidir.

## Bu depo hiçbir yere dosya göndermez

İki hedef de `main`'e push'u kendisi görür, kendisi klonlar, kendisi derler.
Depoda dosya gönderen bir adım **yoktur ve olmamalıdır**.

| Ortam | Adres | Nasıl bağlı | Ölçülen gecikme |
| --- | --- | --- | --- |
| Hostinger | `aliceblue-chimpanzee-816645.hostingersite.com` | Node.js web app, GitHub entegrasyonu | push'tan ~2 dakika sonra ayakta |
| Render | `nsosyal-5n1k.onrender.com` | Web Service, depoya bağlı | birkaç dakika (ücretsiz katman uykudaysa daha uzun) |

İkisi de aynı kaynaktan derlenir ama **ayrı derlemelerdir**; aynı commit'te bile
chunk hash'leri farklıdır. Biri güncelken diğeri eski kalabilir. Bu yüzden
`/api/health` çalıştığı commit'i söyler ve CI bunu doğrular.

### Hostinger tarafı

hPanel'de **Websites → Node.js web app**, GitHub entegrasyonuyla bu depoya
bağlı. Her push'ta Hostinger kendisi çeker, `npm run build` koşar ve uygulamayı
yeniden başlatır. Bağlantı hPanel'den yönetilir; bu depoda karşılığı yoktur.

Not: hPanel'in **Advanced → GIT** ekranı bu kuruluma **ait değildir**. Bu ekran,
Node.js olmayan siteler için ayrı bir özellik. Node.js web app'in dağıtımı
uygulamanın kendi ekranından yönetilir.

### Render tarafı

**New → Web Service** → depoyu seç → build `npm ci && npm run build`,
start `npm start`. Ücretsiz katman ~15 dakika hareketsizlikten sonra uykuya
geçer ve ilk istekte 30-60 saniyede uyanır; demodan önce siteyi bir kez açmak
yeterli.

## Neden statik barındırma yetmiyor

nSosyal bir **sunucu uygulamasıdır**. `npm run build` çıktısında her rota `ƒ`
(sunucuda render edilir) olarak işaretlenir ve tüm yazma yolları Server
Action'lardan geçer. Bu yüzden paylaşımlı/PHP planlar bu uygulamayı çalıştıramaz
ve statik export (`output: 'export'`) da bir seçenek değildir: Server Action'lar
ve sunucu tarafındaki demo deposu statik çıktıda yaşayamaz.

## CI ne yapıyor

`.github/workflows/ci.yml`:

1. **Verify**, kilit dosyasına göre `npm ci` çalıştırır; typecheck, lint ve birim
   testlerini tamamlar; Chromium'u kurar ve tam Playwright paketini yürütür.
2. **Confirm live**, yalnızca `main` push'undan ve Verify başarısından sonra iki
   canlı adresin `/api/health` çıktısında **push edilen tam SHA'yı** arar.

İkinci adım hattın asıl işi. "200 dönüyor" bir şey kanıtlamaz: eski derleme de
200 döner. Bu proje tam olarak bu yüzden birkaç kez "hiçbir şey değişmemiş"
göründü.

Adresler secret değil, iş akışında düz yazılıdır: ikisi de herkese açık.
Secret'a bağlamak, doğrulamayı "kimse secret tanımlamadığı için sessizce
atlanan" bir adıma çevirirdi.

### Canlı doğrulama istekleri

Her platform en fazla 12 kez kontrol edilir. Doğrudan istek IPv4 kullanır,
bağlantı ve toplam süreyi sınırlar, `nSosyal-release-check/<SHA>` User-Agent
değerini gönderir ve sağlık adresine `?verify=<SHA>` sorgusu ekler. Bu sorgu,
önbellekte kalmış eski bir sağlık yanıtının güncel sürüm gibi okunmasını önler.

Hostinger bazen GitHub Actions'ın Azure runner IP'lerine boş yanıt verir.
Doğrudan Hostinger yanıtı boşsa iş akışı, aynı herkese açık sağlık adresini
okuyan `r.jina.ai` gözlemcisini dener. Gözlemci farklı bir veri kaynağı veya
dağıtım hedefi değildir. Yalnızca herkese açık yanıtı başka bir ağ yolundan
okur. Doğrudan yanıtta veri varsa gözlemci kullanılmaz. Render her zaman
doğrudan kontrol edilir. Her iki Hostinger yolunda ve Render kontrolünde başarı
için yanıttaki commit alanının push edilen tam SHA ile eşleşmesi gerekir.

### Sürüm kimliği nereden geliyor

`next.config.ts` derleme anında çözer ve `env` ile gömer:

1. `NSOSYAL_COMMIT_SHA`
2. `RENDER_GIT_COMMIT` (Render kendisi verir)
3. `VERCEL_GIT_COMMIT_SHA`
4. `GITHUB_SHA`
5. `git rev-parse HEAD`

Beşinci adım Hostinger için gerekli: GitHub entegrasyonu hiçbir sürüm değişkeni
vermiyor, o yüzden orası bir süre `commit: "unknown"` bildirdi. Platform depoyu
klonlayarak derlediği için `.git` mevcut ve soru doğrudan depoya sorulabiliyor.

```json
{ "status": "ok", "commit": "076ae7f…", "mode": "demo", "topics": 8, "communities": 137 }
```

## Kaldırılan SSH dağıtımı

Bir dönem bu depoda SSH + rsync + pm2 ile dosya gönderen bir iş vardı. İki
sorunu birden taşıyordu:

- **Gereksizdi.** Hostinger ve Render zaten kendileri çekiyor. İkinci bir yazıcı
  aynı dizine dokunacaktı.
- **Çalışmıyordu.** Sunucu iş akışının anahtarını tanımıyordu
  (`Permission denied (publickey)`) ve **dokuz koşu üst üste kırmızı yandı**. Her
  push'ta kırmızı yanan bir hat zamanla okunmaz olur; asıl bir sorun çıktığında
  da kimse fark etmez.

Bu yüzden kaldırıldı. `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`,
`HOSTINGER_PATH` secret'ları artık hiçbir yerde okunmuyor; GitHub → Settings →
Secrets and variables → Actions altından silinebilirler.

İleride SSH erişimi olan bir sunucuya (örn. VPS) geçilirse elle dağıtım:

```bash
npm ci
npm run build          # sürüm kimliğini git'ten kendisi alır
rsync -az --delete .next public package.json package-lock.json next.config.ts \
  kullanici@sunucu:/uygulama/dizini/
ssh kullanici@sunucu "cd /uygulama/dizini && npm ci --omit=dev && pm2 reload nsosyal"
```

## Mod

`mode: "demo"` veri tabanı olmadan çalışıldığı anlamına gelir (varsayılan).
Supabase'e bağlanmak için `DEMO_MODE=false` ve ilgili ortam değişkenleri gerekir;
eksikse uygulama sessizce devam etmez, açık hata verir.
