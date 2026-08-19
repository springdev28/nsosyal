# 0011 — Dağıtım bir hat olmalı, elle yükleme değil

**Durum:** Kabul edildi

## Bağlam

Depoda bugüne kadar **hiçbir CI/CD tanımı yoktu**: `.github/` dizini yok, dağıtım
betiği yok, sunucu yapılandırması yok. Yani hiçbir commit hiçbir zaman canlıya
çıkmadı. Canlıda ne varsa oraya bir kez elle konmuş ve o gün bugündür
güncellenmemiş.

Bu, prototip için görünmez ama pahalı bir sorun. Depo yeşil, testler geçiyor,
`main` güncel — ve canlı sürüm aylar öncesinin kodu. Aradaki farkı kimse fark
etmiyor çünkü bir bağ yok. "Neden değişmedi?" sorusunun cevabı her seferinde
elle yükleme yapılmamış olması.

Ek olarak barındırma tarafında bir yanlış varsayım riski var: nSosyal 5N1K bir
**sunucu uygulamasıdır**. `npm run build` çıktısında her rota `ƒ` işaretlidir ve
bütün yazma yolları Server Action'lardan geçer. Paylaşımlı/PHP barındırma bunu
çalıştıramaz; statik export da mümkün değildir.

## Karar

Dağıtım bir hattır ve `main` dalına bağlıdır.

- `.github/workflows/deploy.yml`, `main`'e her push'ta çalışır.
- Önce `npm run verify` ve E2E koşar. **Testler geçmezse dağıtım yapılmaz** —
  hattın varlık sebebi hız değil, kırık sürümün canlıya çıkmaması.
- Geçerse derler, yalnızca çalışmak için gerekli dosyaları sunucuya gönderir,
  üretim bağımlılıklarını kurar ve pm2 sürecini yeniler.
- Kimlik bilgileri depoda durmaz; dördü de repository secret'tır
  (`HOSTINGER_HOST`, `HOSTINGER_USER`, `HOSTINGER_SSH_KEY`, `HOSTINGER_PATH`).
  İş akışı anahtarı yalnızca çalışma anında yazar ve adım sonunda siler.
- `HOSTINGER_HEALTH_URL` verilirse dağıtım sonrası `/api/health` doğrulanır;
  yani "dağıtıldı" demek "ayakta" demektir.

Hedef ortam Node çalıştırabilen bir plan olmak zorundadır (Hostinger VPS veya
Node.js hosting). Sunucuda bir kerelik Node 20+ ve pm2 kurulumu gerekir.

## Sonuçlar

- `main`'e giren her şey, testleri geçtiği sürece canlıya çıkar.
- Canlı sürümün hangi commit olduğu artık belirsiz değil.
- **Bedeli:** secret'lar tanımlanana kadar hat kırmızı yanar. Bu bilinçli:
  sessizce hiçbir şey yapmayan bir hat, olmayan hattan daha kötüdür.
- **Sınır:** ilk kurulum (Node, pm2, ters vekil) elle yapılır. Sunucu
  sağlamlaştırma bu kaydın konusu değildir.

## Değerlendirilen alternatifler

- **Elle rsync/FTP:** bugünkü durum. Unutulabilir olduğu için güvenilmez ve
  hangi sürümün canlıda olduğunu kimse bilemez.
- **Statik export + paylaşımlı barındırma:** ucuz olurdu ama Server Action'lar
  ve sunucu tarafı demo deposu statik çıktıda yaşayamaz; ürünün yarısı giderdi.
- **Vercel/Railway:** Next.js için en az sürtünmeli yol. Yarışma altyapısı
  Hostinger üzerinden planlandığı için seçilmedi; karar değişirse iş akışı
  küçük bir değişiklikle taşınabilir.
