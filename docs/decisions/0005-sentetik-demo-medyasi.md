# 0005 — Sentetik ama gerçek oynatılabilir demo medyası

**Durum:** Kabul edildi

## Bağlam

Kısa video ürünün P0 özelliklerinden biri. Demoda video göstermenin üç yolu var:
gerçek videolar kullanmak (telif ve kişi hakkı sorunu), harici bir CDN'e bağlanmak
(demo ağa bağımlı olur), ya da videoyu sahte bir kutuyla temsil etmek (özellik
gösterilmemiş olur).

Boş bir sosyal ağ demoda zayıf görünür; ama gerçek kişilerin videolarını taklit
etmek de kabul edilemez.

## Karar

Tüm demo medyası bu proje için üretilir ve repoda durur:

- **Video:** 21 kısa WebM klip, `scripts/build-demo-media.ts` ile üretilir; toplam
  ~6 MB. Klipler gerçek, oynatılabilir dosyalardır — oynatıcı, süre, sessize alma ve
  metin karşılığı davranışı sahnede gerçekten çalışır.
- **Görsel ve poster:** sentetik SVG.
- Üretim tek bir manifest'ten yapılır; aynı manifest seed verisi tarafından da
  kullanılır, böylece dosya ile kayıt asla ayrışmaz.

## Sonuçlar

- Kısa video özelliği demoda gerçekten çalışıyor; ağ gerekmiyor.
- Telif veya kişi hakkı riski yok; hiçbir gerçek kişi taklit edilmiyor.
- **Bedeli:** klipler soyut, "gerçek bir sosyal ağ" hissi vermez. Bunu kabul
  ediyoruz: sahte gerçeklikten sentetik dürüstlük yeğdir. Arayüzdeki `demo` rozeti
  bunu ayrıca söyler.
- Repoya ~6 MB ikili dosya girer. Sınır budur; büyümesi hâlinde harici depolama
  tekrar değerlendirilmelidir.

## Değerlendirilen alternatifler

- **Stok video indirmek:** lisans takibi gerektirir ve repo boyutu hızla büyür.
- **Harici URL'lerden yayın:** demoyu ağa bağlar; 0001 ve 0003 ile çelişir.
- **Video yerine hareketsiz kapak:** ürünün P0 özelliği gösterilmemiş olurdu.
