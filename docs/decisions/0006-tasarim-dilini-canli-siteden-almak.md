# 0006 — Tasarım dilini canlı siteden almak, emoji yerine ikon seti

**Durum:** Değiştirildi — bkz. [0009](0009-tasarim-kaynagi-figma-master-dosyasi.md)

## Bağlam

Prototipin ilk arayüzü yalnızca yazılı spec'ten türetilmişti. Sonuç teknik olarak
doğru ama üründen kopuktu: farklı bir renk hissi, farklı yoğunluk, gezinme
düzeni tutmuyordu ve arayüz mobilyası (gezinme, etiketler, boş durumlar) emoji ile
kurulmuştu. Bu prototipin işi yeni bir ürün icat etmek değil, mevcut nSosyal
arayüzünün üstüne 5N bağlam katmanını göstermek.

## Karar

Görsel dil canlı nsosyal.com arayüzünden alınır:

- koyu varsayılan tema, üç kolonlu masaüstü düzeni (sol gezinme, merkez içerik,
  sağ panel: arama + Popüler), mobilde alt gezinme çubuğu;
- 16 px yuvarlak kartlar, tam yuvarlak (pill) düğmeler;
- canlı mavi vurgu, birincil eylemde camgöbeği→mavi gradyan;
- aktif gezinme öğesi dolgulu hap + dolu ikon;
- gönderi kartı düzeni: avatar, kalın ad, doğrulama işareti, `@kullanıcı · süre`.

Arayüz mobilyası emoji değil, `src/components/ui/Icon.tsx` içindeki tek tip 24×24
SVG setidir. Emoji her işletim sisteminde farklı çizilir, boyutu ve optik ağırlığı
denetlenemez ve arayüzün tonunu istemeden "gündelik" yapar. Emoji **içerik olarak**
(bir projenin simgesi gibi) kullanılmaya devam eder.

## Sonuçlar

- Prototip, ürünün devamı gibi görünüyor; jüri iki arayüz arasında zihinsel çeviri
  yapmak zorunda kalmıyor.
- İkonlar `currentColor` devraldığı için tema değişiminde ve kontrast
  düzeltmelerinde otomatik olarak doğru davranıyor.
- Tema değişkenleri tek yerde (`src/app/globals.css`) toplandığı için renk
  düzeltmeleri ölçülebilir ve tekrarlanabilir hâle geldi (bkz. 0008).
- **Bedeli:** canlı arayüz değişirse prototip geride kalır. Referans ekran
  görüntüleri ve bu kayıt, farkın nereden geldiğini göstermek için yeterlidir.

## Değerlendirilen alternatifler

- **Hazır bir bileşen kütüphanesi (MUI, shadcn vb.):** hızlı olurdu ama kendi görsel
  kimliğini dayatır; ürünle benzerlik kaybolurdu.
- **Spec'ten türetilmiş özgün tasarım:** ilk denenen yol; ürünle bağı kopuk çıktı.
