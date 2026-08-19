# 0009 — Tasarımın kaynağı takımın Figma dosyasıdır

**Durum:** Kabul edildi
**Değiştirir:** [0006](0006-tasarim-dilini-canli-siteden-almak.md)

## Bağlam

0006, görsel dilin canlı nsosyal.com arayüzünden alındığını kaydediyordu. Bu kayıt
yanlıştı — daha doğrusu, elde olmayan bir şeyin yerine konmuş bir tahmindi.
Takımın Figma'da ürettiği bir tasarım dosyası vardı; prototipi yazan taraf onu
istemedi, ekran görüntülerinden ve yazılı spec'ten bir görsel dil türetti ve bunu
karar kaydına "kaynak" diye yazdı.

Sonuç, tahminin kendisinden daha kötüydü: tahmin, belgelendiği anda karara
dönüştü. Sonraki kararlar da onun üstüne kuruldu. Örneğin 0008, 5N boyutları için
seçilmiş mor/yeşil/kırmızı/sarı paletinin kontrastını ölçüp sabitledi — oysa spec
8.1.1 o paleti zaten yasaklıyordu. Ölçüm doğruydu, ölçülen şey yanlıştı.

Marka işaretinde aynı hata daha keskin biçimde tekrarlandı. Spec üç ayrı yerde
(4.4, 8.1.1, 17.18/2) işaretin master vector'den gelmesini ve ekran görüntüsünden
ya da yaklaşık bir SVG path'ten **yeniden çizilmemesini** şart koşuyor. Prototipte
önce gradyanlı bir "N" harfi, sonra da "yer tutucu" diye not düşülmüş, elle
çizilmiş bir geometri kullanıldı. Yorum satırındaki "yer tutucu" ibaresi onu
yeniden çizilmiş bir logo olmaktan çıkarmıyor.

## Karar

Görsel kaynak sıralaması nettir ve spec 17.18 bunu zaten söylüyor:

1. Takımın Figma dosyası (`QiXXYwqSFvcx2N2hHLw8DP` — master vector ve bileşenler).
2. Bu depodaki `PROJECT_SPEC.md` ve ürün spesifikasyonu dokümanı.
3. Mevcut nSosyal ürün ailesinin görsel dili.

Çakışma hâlinde üstteki kazanır. Kodda veya eski karar kayıtlarında bunlarla
çelişen bir şey varsa, çelişen taraf değişir.

Uygulama kuralları:

- **Marka işareti yeniden çizilmez.** `FiveNMark` içindeki üç path master
  bileşenden SVG olarak dışa aktarılıp birebir kopyalanmıştır; dışa aktarılan
  dosya provenans için `public/brand/nsosyal-5n-mark.svg` altında durur. Marka
  değişirse master'dan yeniden dışa aktarılır, elle düzeltilmez.
- **Bileşen ölçüleri tasarımdan okunur.** 5N seçicinin kademe boyutları,
  opaklıkları, hizalama işareti ve etiketi tasarım dosyasındaki bileşenden
  alınmıştır; gözle yaklaştırılmaz.
- **Tasarımda karşılığı olmayan bir yüzey icat edilmeden önce sorulur.** Tasarım
  dosyasında ekran tasarımı bulunmayan sayfalar (Keşfet panelinin içeriği, admin
  ekranları) spec'ten türetilmiştir; bu, kaydedilmesi gereken bir boşluktur, sessiz
  bir varsayım değil.

## Sonuçlar

- Prototipin görsel dili artık doğrulanabilir bir kaynağa dayanıyor; "ürünün
  devamı gibi görünüyor" iddiası ölçülebilir hâle geldi.
- 5N boyut renkleri tek vurgu rengine indi (tasarım dosyası `--color-5n-*`
  değişkenlerinin hepsini aynı maviye eşitliyor); ayrım ikon, etiket, konum ve
  seçili state ile yapılıyor.
- **Bedeli:** tasarım dosyası değiştiğinde prototip elle güncellenmek zorunda.
  Otomatik bir token senkronu yok; olması gerekirse ayrı bir karar konusudur.
- **Açık boşluk:** tasarım dosyasında yalnızca Cover ve 5N Navigation sayfaları
  var. Ekran tasarımları geldiğinde Keşfet panelinin içeriği, nGazete düzeni ve
  form ekranları o tasarımlara göre yeniden gözden geçirilmelidir.

## Değerlendirilen alternatifler

- **Tasarımı kodda "yorumlamak":** hızlı görünüyor ama bu kaydın konusu olan
  hatanın ta kendisi. Yorum, belgelendiği anda karara dönüşüyor.
- **Figma token'larını otomatik senkronlamak:** doğru yön, ama prototip ölçeğinde
  kurulum maliyeti kazancından büyük; dosyada iki sayfa var.
