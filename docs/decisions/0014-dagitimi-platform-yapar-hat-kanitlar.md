# 0014 — Dağıtımı platform yapar, hat kanıtlar

**Durum:** Kabul edildi — [0011](0011-dagitim-hattini-kurmak.md)'in dağıtım
yolunu değiştirir, test kapısını korur.

## Bağlam

0011, dağıtımı bu deponun yapması gerektiğini varsaydı ve SSH + rsync + pm2 ile
dosya gönderen bir iş yazdı. İki şey birden yanlıştı.

**Bir: gereksizdi.** Ölçüldü — `main`'e bir push'tan **iki dakika sonra**
Hostinger yeni sürümü sunuyordu; Render da kendi hızında yeniden derliyordu.
Her iki hedef de depoya bağlı ve kendileri çekiyor. İkinci bir yazıcı aynı
dizine dokunacaktı.

**İki: çalışmıyordu.** Sunucu iş akışının anahtarını tanımıyordu
(`Permission denied (publickey,password)`) ve **dokuz koşu üst üste kırmızı
yandı**. Her push'ta kırmızı yanan bir hat zamanla okunmaz olur; asıl bir sorun
çıktığında kimse fark etmez. Yani hat yalnızca işe yaramıyordu değil, aynı
zamanda gerçek sinyali de bastırıyordu.

Bu ikisinin üstüne bir üçüncüsü daha vardı: hattın "başarılı" ölçütü
`/api/health`'in **200** dönmesiydi. 200'ü eski derleme de döner. Proje
defalarca "hiçbir şey değişmemiş" göründü ve her seferinde teşhis elle yapıldı.

## Karar

**Dağıtımı platform yapar.** Depoda dosya gönderen bir adım yoktur.

**Hat iki iş yapar:**

1. `npm run verify` + E2E.
2. `main`'e push'ta, iki canlı adresin `/api/health` çıktısının **push edilen
   SHA'yı** bildirmesini bekler. Kanıt bu; "ayakta" değil, "yeni sürüm yayında".

**Sürüm kimliği derlemeye gömülür.** `next.config.ts` sırayla
`NSOSYAL_COMMIT_SHA`, `RENDER_GIT_COMMIT`, `VERCEL_GIT_COMMIT_SHA`,
`GITHUB_SHA` dener; hiçbiri yoksa `git rev-parse HEAD` ile depoya sorar. Son
adım şart: Hostinger'ın GitHub entegrasyonu hiçbir sürüm değişkeni vermiyor ve
orası bir süre `commit: "unknown"` bildirdi. Platform depoyu klonlayarak
derlediği için `.git` mevcut.

**Doğrulama adresleri secret değildir.** İkisi de herkese açık. Secret'a
bağlamak, doğrulamayı "kimse secret tanımlamadığı için sessizce atlanan" bir
adıma çevirirdi — 0011'in `HOSTINGER_HEALTH_URL`'inin başına gelen tam olarak
buydu.

## Sonuçlar

- `HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_PATH`
  artık hiçbir yerde okunmuyor ve silinebilirler.
- İş akışının adı `deploy.yml` değil `ci.yml`: yaptığı iş dağıtmak değil.
- Bir gün SSH erişimi olan bir sunucuya geçilirse elle dağıtım komutları
  `docs/deployment.md` içinde duruyor; ama o zaman da tek bir yazıcı olmalı.
- Genel ders, bu turda üçüncü kez tekrarlandı: **bir mekanizmanın var olması,
  işe yaradığının kanıtı değildir.** Yeşil test, 200 yanıtı ve tanımlı secret'lar
  üçü de "çalışıyor" gibi görünüp çalışmıyordu. Ölçülen tek şey doğru soruyu
  sormalı — burada soru "canlıdaki commit hangisi?".
