# 0013 — Gerçek marka vektörü, gerçek yoğunluk verisi, gerçek gazete sayfaları

**Durum:** Kabul edildi

## Bağlam

Bu kayıt tek bir kök nedeni belgeliyor: **doğru görünen kod, yanlış görünen ürün.**
Aşağıdaki dört sorunun hepsinde mekanizma çalışıyordu; ekranda karşılığı yoktu.

**1. Marka işareti yanlış dosyadan geliyordu.** Kod, Figma master dosyasındaki
`Brand Mark / Hero` (74:2) düğümünden çıkarılmıştı. Takımın gerçek logosu aynı
dosyada **`Group 1` (82:73)** olarak duruyor. İkisi aynı şey değil: gerçek işaret
düz dikey parçalar ve **yarım daire dönüşlerden** oluşur, iki ucunda birer halka
taşır ve **lacivertten (#0B3158) parlak maviye (#3D9BFF) giden gradyanlıdır**.
Kodda olan ise yumuşak bir kübik S eğrisiydi, tek renkti ve oranı 4:3'tü.
Kullanıcı üst üste "hâlâ eski logo" dedi; haklıydı.

**2. Yoğunluk haritasının yoğunluğu yoktu.** Choropleth, tek renkli skala,
legend, hover, seçim — hepsi doğruydu. Eksik olan **veriydi**: elle yazılmış demo
içeriği yalnızca üç ile bağlıydı (İzmir, İstanbul, Ankara), yani 81 ilin 78'i aynı
koyu tonda çiziliyordu. Legend bir değişimi tarif ediyordu ama gösterecek bir
değişim yoktu.

**3. Harita hiçbir ekrana oturmuyordu.** Sabit `center` + `zoom: 4.6`
kullanılıyordu. Zoom kapsayıcının boyutundan bağımsız olduğu için geniş
masaüstünde iki yanda boşluk kalıyor, dar kolonda doğu-batı kırpılıyordu.

**4. nGazete bir gazete gibi davranmıyordu.** Sayfa yoktu (tek uzun kaydırma),
takvim yoktu (arşiv üç adet tarih rozetiydi), sabit grid span'leri kartların
gerçek yüksekliğiyle örtüşmediği için kompozisyonda büyük delikler kalıyordu ve
okuyucuya **reklam envanteri** gösteriliyordu ("600×400 · Bölüm içi geniş").

## Karar

**Marka.** İşaret `Group 1` (82:73) düğümünden alınır; geometri ve üç gradyan
master ile birebir aynıdır ve `currentColor` ile boyanmaz. `FiveNMark` artık bir
istemci bileşenidir: `useId` ile her örnek kendi gradyan kimliklerini üretir,
böylece aynı sayfadaki birden fazla işaret birbirinin boyasını çalmaz. İşaret
gezinme kolonunda, mobil üst barda, giriş ekranında ve 5N göbeğinde
**animasyonludur**; parçacık bağlantı çizgisinin ta kendisini izler ve
`prefers-reduced-motion` altında `.ns-mark-particle` kuralıyla hiç boyanmaz
(genel reduced-motion bloğu yalnızca CSS animasyonlarını kısaltır, parçacık ise
SMIL ile hareket eder).

**Yoğunluk verisi.** `src/lib/seed/regional.ts` illere ağırlıklarına göre
topluluk, etkinlik, proje ve paylaşım üretir. Üretim il koduna göre tohumlanmış
bir PRNG ile yapılır — `Math.random` kullanılmaz, çünkü DemoStore her yeniden
kurulduğunda aynı sayılar çıkmalı. Elle yazılmış içerik **değiştirilmez**, üstüne
eklenir. `tests/unit/map-density.test.ts` en az 60 ilin dolu olmasını, en yoğun
ilin en seyrekten belirgin ayrılmasını ve skalanın ara duraklarının da
kullanılmasını ölçer.

**Harita.** Açılışta ve seçim kalktığında `fitBounds` kullanılır; bir
`ResizeObserver` kapsayıcı boyu değişince haritayı yeniden ölçer. Hover'da
imlecin yanında ilin adını ve **tür kırılımını** gösteren bir balon çıkar; toplam
tek başına neyin yoğun olduğunu söylemiyordu.

**nGazete.** Manşet birinci sayfada tam genişlikte durur; geri kalan kartlar CSS
kolonlarına akar (`break-inside: avoid`), böylece delik kalmaz. Sayı sayfalara
bölünür ve altta sayfa gezinmesi bulunur. Ücretli kartlar editoryal içerikten
**ayrı sayfalanır** ve sayfalara sırayla dağıtılır; düz sayfalama hepsini son
sayfada yığıyordu, oysa gerçek gazetede reklam her sayfada bulunur. Bir ay
takvimi eklendi: sayısı olan günler bağlantıdır, bugün işaretlidir, varsayılan
sayı **bugünün** sayısıdır. Arşiv son on haftayı günlük sayılarla doldurur;
üç sayılık bir takvim boş bir aydan ibaret olurdu.

**Ücretli yerleşim işaretlemesi.** Her kartın üstünde tekrarlanan "Sponsorlu"
rozeti kaldırıldı. Yerine sayı başına **tek** bir açıklama satırı kondu ve kart
sponsorun adıyla, renkli şeritle işaretlendi. Rozeti tekrarlamak gürültüydü; ama
açıklamayı tamamen kaldırmak ücretli içeriği editoryal içerikten ayırt edilemez
hale getirirdi ve bu kabul edilebilir değil. Envanter ölçüleri okuyucu
görünümünden çıkarıldı; veri silinmedi, `/newspaper/advertise` ve yönetici
ekranı aynı kayıtları kullanmaya devam ediyor.

**5N seçici.** Dizi kapalıdır: son boyuttan sonra yeniden ilki gelir. Önceki
sürüm iki ucunda duruyordu, dolayısıyla "Ne" seçiliyken yayın üstünde boş bir
parça kalıyordu.

## Sonuçlar

- Marka değişirse master'dan yeniden dışa aktarılır; `FiveNMark.tsx` içindeki
  path ve gradyan sabitleri elle düzeltilmez.
- Bölgesel içerik sentetiktir ve açıklamasında "Sentetik demo" ibaresi taşır
  (ürün değişmezi 7). Bir birim testi bunu sabitler.
- Ekran görüntüsüne bakıp "çalışıyor" demek yetmiyor. Bu turdaki dört hatanın
  dördü de yeşil testlerle birlikte yaşıyordu; testler mekanizmayı ölçüyordu,
  ürünü değil. Eklenen ölçümler (yoğunluk yayılımı, takvim, sayfa gezinmesi,
  envanter sızıntısı) bu boşluğu kapatmayı hedefler.
