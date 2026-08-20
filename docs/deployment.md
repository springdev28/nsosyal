# Dağıtım

## Şu an nerede yayında

İki yerde, birbirinden bağımsız:

| Ortam | Adres | Nasıl güncelleniyor |
| --- | --- | --- |
| Render | `nsosyal-5n1k.onrender.com` | `main`'e push → Render kendi çeker, derler, yeniden başlatır |
| Hostinger | `aliceblue-chimpanzee-816645.hostingersite.com` | aşağıya bakın |

İkisi de aynı kaynaktan derlenir ama **ayrı derlemelerdir**; aynı commit'te bile
chunk hash'leri farklıdır. Biri güncelken diğeri eski kalabilir — bu yüzden
`/api/health` artık çalıştığı commit'i söyler ve iş akışı bunu doğrular.

Render kurulumu: **New → Web Service** → depoyu seç → build `npm ci && npm run build`,
start `npm start`. Ücretsiz katman ~15 dakika hareketsizlikten sonra uykuya geçer
ve ilk istekte 30-60 saniyede uyanır; demodan önce siteyi bir kez açmak yeterli.
Render `RENDER_GIT_COMMIT` değişkenini kendisi sağlar, `/api/health` onu okur.

## Neden statik barındırma yetmiyor

nSosyal bir **sunucu uygulamasıdır**. `npm run build` çıktısında her rota `ƒ`
(sunucuda render edilir) olarak işaretlenir ve tüm yazma yolları Server Action'lardan
geçer. Bu yüzden:

- Hostinger'ın **paylaşımlı / PHP** planları bu uygulamayı çalıştıramaz.
- Statik export (`output: 'export'`) da bir seçenek değildir: Server Action'lar ve
  sunucu tarafındaki demo deposu statik çıktıda yaşayamaz.

Gereken: **Node çalıştırabilen** bir plan — Hostinger VPS ya da Node.js hosting.

## Hostinger: iki yol var, birini seçin

İş akışı hangisinin yapılandırıldığını secret'lara bakarak anlar. Hiçbiri
tanımlı değilse dağıtım **sessizce atlanır** ve iş akışı yeşil kalır.

### Yol A — hPanel Git webhook (basit olan)

hPanel'de zaten bir Git dağıtımı kuruluysa bu yolu seçin. Dosyaları biz
göndermeyiz; Hostinger depodan kendisi çeker.

1. hPanel → **Advanced → GIT**. Depo bağlı değilse bağlayın (`main` dalı).
2. Aynı ekrandaki **Deploy webhook** adresini kopyalayın.
3. GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - `HOSTINGER_DEPLOY_HOOK` = kopyaladığınız adres

Bu secret varsa iş akışı SSH'a hiç bakmaz.

### Yol B — SSH (dosyaları biz gönderiyoruz)

| Secret | Zorunlu | Açıklama |
| --- | --- | --- |
| `HOSTINGER_HOST` | evet | Yalnızca IP veya alan adı. `https://` yok, port yok |
| `HOSTINGER_USER` | evet | SSH kullanıcısı |
| `HOSTINGER_SSH_KEY` | evet | **Özel** anahtarın tamamı (BEGIN satırından END satırına) |
| `HOSTINGER_PATH` | evet | Sunucudaki uygulama dizini |
| `HOSTINGER_PORT` | hayır | SSH portu; verilmezse 22 |
| `HOSTINGER_RESTART` | hayır | Yeniden başlatma komutu. Boşsa pm2 denenir, o da yoksa `touch tmp/restart.txt` |

Anahtar hiçbir zaman depoya girmez; iş akışı onu yalnızca çalışma anında yazar ve
adım sonunda siler.

#### "Permission denied (publickey)" alıyorsanız

Bu hata **özel anahtarın secret'ta olmadığı** anlamına gelmez. Neredeyse her
zaman şu ikisinden biridir:

1. **Açık anahtar sunucuda yok.** Preflight adımı artık bu durumda kullandığı
   açık anahtarı log'a yazdırır — o satırı kopyalayıp sunucuya ekleyin:
   - Paylaşımlı barındırma: hPanel → **Advanced → SSH Access → SSH Keys → Import**
   - VPS: hPanel → **VPS → Settings → SSH Keys**, ya da sunucuda:
     ```bash
     mkdir -p ~/.ssh
     echo '<açık anahtar satırı>' >> ~/.ssh/authorized_keys
     chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
     ```
2. **Kullanıcı adı yanlış.** Hostinger paylaşımlı barındırmada kullanıcı adı
   genelde `uXXXXXXXXX` biçimindedir, `root` değil. hPanel → SSH Access ekranında
   yazar.

Anahtarın kendisini kaybettiyseniz yenisini üretip ikisini birden yenileyin:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nsosyal_deploy -N "" -C "nsosyal-deploy"
cat ~/.ssh/nsosyal_deploy      # bunun TAMAMI -> HOSTINGER_SSH_KEY secret'ı
cat ~/.ssh/nsosyal_deploy.pub  # bu satır  -> sunucudaki authorized_keys
```

## Dağıtımın canlıya yansıdığını doğrulama

`/api/health` çalıştığı commit'i söyler:

```json
{ "status": "ok", "commit": "3671e37...", "mode": "demo", "topics": 8, "communities": 84 }
```

İş akışının son işi (`Confirm live`) bu adresi çeker ve **push edilen SHA'yı**
bekler. "200 dönüyor" yeterli değildir: eski derleme de 200 döner. Bu proje tam
olarak bu yüzden birkaç kez "hiçbir şey değişmemiş" göründü.

Doğrulanacak adresleri secret olarak verin (ikisi de isteğe bağlı, ama en az
biri olmadan dağıtımın yansıdığı hiçbir zaman kanıtlanmaz):

| Secret | Örnek |
| --- | --- |
| `HOSTINGER_HEALTH_URL` | `https://aliceblue-chimpanzee-816645.hostingersite.com/api/health` |
| `RENDER_HEALTH_URL` | `https://nsosyal-5n1k.onrender.com/api/health` |

`commit: "unknown"` görüyorsanız derlemeye sürüm kimliği geçilmemiş demektir.
SSH yolunda iş akışı bunu kendisi yazar; hPanel Git yolunda uygulama ortamına
`NSOSYAL_COMMIT_SHA` ekleyin (hPanel → Node.js uygulaması → Environment
variables) ya da bu kontrolü Render üzerinden yapın.

## Elle dağıtım

```bash
npm ci
NSOSYAL_COMMIT_SHA=$(git rev-parse HEAD) npm run build
rsync -az --delete .next public package.json package-lock.json next.config.ts \
  kullanici@sunucu:/home/user/nsosyal/
ssh kullanici@sunucu "cd /home/user/nsosyal && npm ci --omit=dev && pm2 reload nsosyal"
```

## Mod

`mode: "demo"` veri tabanı olmadan çalışıldığı anlamına gelir (varsayılan).
Supabase'e bağlanmak için `DEMO_MODE=false` ve ilgili ortam değişkenleri gerekir;
eksikse uygulama sessizce devam etmez, açık hata verir.
