# Dağıtım

## Şu an nerede yayında

Proje **Render** üzerinde yayında ve `main` dalına her push'ta otomatik yeniden
dağıtılıyor. Render, uygulamayı tek ve kalıcı bir Node süreci olarak çalıştırır —
yani `npm start` ile aynı şekil. Bu önemli: demo veri deposu **bellekte** yaşar,
dolayısıyla isteği farklı örneklere dağıtan serverless bir ortamda (Vercel gibi)
topluluğa katılma veya hatırlatma kurma gibi yazma işlemleri kaybolabilirdi.

Render kurulumu: **New → Web Service** → depoyu seç → build `npm ci && npm run build`,
start `npm start`. Ücretsiz katman ~15 dakika hareketsizlikten sonra uykuya geçer
ve ilk istekte 30-60 saniyede uyanır; demodan önce siteyi bir kez açmak yeterli.

Aşağıdaki Hostinger yolu **isteğe bağlıdır** ve secret'lar tanımlanmadığı sürece
iş akışı sessizce atlanır.

## Neden statik barındırma yetmiyor

nSosyal 5N1K bir **sunucu uygulamasıdır**. `npm run build` çıktısında her rota `ƒ`
(sunucuda render edilir) olarak işaretlenir ve tüm yazma yolları Server Action'lardan
geçer. Bu yüzden:

- Hostinger'ın **paylaşımlı / PHP** planları bu uygulamayı çalıştıramaz.
- Statik export (`output: 'export'`) da bir seçenek değildir: Server Action'lar ve
  sunucu tarafındaki demo deposu statik çıktıda yaşayamaz.

Gereken: **Node çalıştırabilen** bir plan — Hostinger VPS ya da Node.js hosting.

## Sunucuda bir kerelik hazırlık

```bash
# Node 20+ ve pm2
node -v                 # >= 20 olmalı
npm i -g pm2

# Uygulama dizini
mkdir -p ~/nsosyal && cd ~/nsosyal

# Sunucu yeniden başladığında uygulama da başlasın
pm2 startup
```

Ters vekil (nginx) kullanıyorsanız `localhost:3000` adresine yönlendirin. Port
değiştirmek isterseniz pm2 sürecine `PORT` ortam değişkeni geçin.

## GitHub Actions ile otomatik dağıtım

`.github/workflows/deploy.yml`, `main` dalına her push'ta çalışır: önce
`npm run verify` ve E2E testleri koşar, geçerse derleyip sunucuya gönderir ve pm2
sürecini yeniler. **Testler geçmezse dağıtım yapılmaz.**

Depoda **Settings → Secrets and variables → Actions** altında şunlar tanımlanmalı:

| Secret | Zorunlu | Açıklama |
| --- | --- | --- |
| `HOSTINGER_HOST` | evet | Sunucu adresi veya IP |
| `HOSTINGER_USER` | evet | SSH kullanıcısı |
| `HOSTINGER_SSH_KEY` | evet | Özel anahtarın tam içeriği (PEM) |
| `HOSTINGER_PATH` | evet | Sunucudaki uygulama dizini, örn. `/home/user/nsosyal` |
| `HOSTINGER_PORT` | hayır | SSH portu; verilmezse 22 |
| `HOSTINGER_HEALTH_URL` | hayır | Örn. `https://alanadi.com/api/health` — verilirse dağıtım sonrası doğrulanır |

Anahtar hiçbir zaman depoya girmez; iş akışı onu yalnızca çalışma anında yazar ve
adım sonunda siler.

## Elle dağıtım

```bash
npm ci
npm run build
rsync -az --delete .next public package.json package-lock.json next.config.ts \
  kullanici@sunucu:/home/user/nsosyal/
ssh kullanici@sunucu "npm ci --omit=dev && pm2 reload nsosyal"
```

## Doğrulama

`/api/health` uygulamanın ayakta olduğunu ve hangi modda çalıştığını söyler:

```json
{ "status": "ok", "mode": "demo", "topics": 8, "communities": 18 }
```

`mode: "demo"` veri tabanı olmadan çalışıldığı anlamına gelir (varsayılan).
Supabase'e bağlanmak için `DEMO_MODE=false` ve ilgili ortam değişkenleri gerekir;
eksikse uygulama sessizce devam etmez, açık hata verir.
