# 0003 — Yerel GeoJSON ile tile sunucusuz harita

**Durum:** Kabul edildi

## Bağlam

"Nerede" ekranı ürünün en görünür farklarından biri. Alışılmış çözüm bir tile
sağlayıcısına (Mapbox, MapTiler, OSM tile sunucuları) bağlanmak. Bu, demo için üç
risk taşıyor: ağ kesintisi, API anahtarı/kota, ve kullanım koşulları.

Üstelik ürünün ihtiyacı sokak seviyesinde bir taban harita değil: il ve ilçe
poligonlarını seçilebilir biçimde göstermek.

## Karar

MapLibre GL JS kullanılır ama **hiçbir dış kaynağa bağlanılmaz**:

- Stil nesnesi yereldir: tek bir arka plan katmanı, ardından GeoJSON kaynakları.
- Poligonlar `public/geo/` altındadır: 81 il ve pilot il İzmir'in 30 ilçesi.
  OpenStreetMap türevi veri Douglas–Peucker ile sadeleştirilmiştir (toplam ~210 KB).
- Vurgu ve seçim `feature-state` ile yapılır; kaynak yeniden yüklenmez.
- Stil nesnesinde `glyphs` **tanımlı değildir**; hiçbir katman metin çizmediği için
  gereksiz ve tanımlamak uzak bir font sunucusu bağımlılığı yaratırdı.
- Kaynak gösterimi (OpenStreetMap katkıda bulunanlar, ODbL) arayüzde yer alır.

## Sonuçlar

- Harita çevrimdışı açılır; demo ağa bağımlı değildir.
- Anahtar, kota ve faturalandırma yok.
- Sadeleştirme yüzünden sınırlar milimetrik doğru değildir. Arayüzde "görsel keşif
  amaçlıdır, resmî idari sınır verisi değildir" notu bulunur.
- İlçe katmanı yalnızca pilot il için vardır; diğer illerde keşif il düzeyindedir.
  Bu, veri boyutunu makul tutmak için bilinçli bir sınırdır.

## Erişilebilirlik notu

Harita **yardımcı** bir görünümdür: aynı sonuçlar her zaman sayfadaki il listesi ve
sonuç panelinde metin olarak da bulunur, dolayısıyla klavye ve ekran okuyucu
kullanıcıları hiçbir şey kaçırmaz. Harita bir nedenle yüklenemezse sayfa çalışmaya
devam eder.

Sarmalayıcı öğe `role="group"`tur, `role="img"` değil: MapLibre kendi odaklanabilir
tuvalini, yakınlaştırma düğmelerini ve kaynak bağlantısını bu kutunun içine ekler ve
bir `img` odaklanabilir çocuk barındıramaz. MapLibre'in kendi denetim metinleri de
Türkçeye çevrilmiştir.

## Değerlendirilen alternatifler

- **Tile sağlayıcı + anahtar:** daha güzel taban harita, ama demo riski ve kota
  bağımlılığı.
- **Statik SVG Türkiye haritası:** en hafifi, ama yakınlaştırma, ilçe katmanı ve
  `feature-state` etkileşimi kaybolurdu.
- **Tüm illerin ilçeleri:** veri birkaç MB'a çıkıyordu; pilot il yaklaşımı aynı
  ürün fikrini yeterince gösteriyor.
