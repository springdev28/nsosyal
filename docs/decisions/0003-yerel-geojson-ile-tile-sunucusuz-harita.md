# 0003 - Yerel GeoJSON ile tile sunucusuz harita

**Durum:** Kısmen geçerli. Tile sunucusuz yerel harita kararı geçerlidir. Ürün
kapsamı ve density davranışı 0009 ile genişletilmiştir.

## Bağlam

Nerede ekranı ürünün görünür farklarından biridir. Dış tile sağlayıcısı demo için
ağ kesintisi, API anahtarı, kota ve kullanım koşulu riski getirir.

Ürünün discovery amacı sokak seviyesinde bir basemap gerektirmez. Province ve
district polygon'ları, region selection ve density visualization için yeterlidir.

## İlk karar

MapLibre GL JS dış tile kaynağı olmadan kullanılacaktır:

- style ve polygon sources yereldir;
- province GeoJSON repoda tutulur;
- source attribution görünürdür;
- feature-state gibi MapLibre mekanizmaları etkileşim için kullanılabilir;
- map başarısız olursa aynı discovery result'larının list equivalent'i vardır.

## Mevcut repo veri envanteri

Repo şu anda:

- Türkiye'nin 81 province polygon'unu;
- İzmir district polygon paketini

içerir.

Bu durum **ürünün İzmir pilotu olduğu anlamına gelmez**. İzmir district dosyası
mevcut implementasyon/data inventory'sidir. Güncel ürün mimarisi Türkiye-wide'dır
ve district data bulunan her province için aynı drill-down sözleşmesini kullanır.

## Güncel product extension

0009 ile Nerede yalnızca region selection yapan map olmaktan çıkar ve selected
metric/topic/time bağlamında province-level density/choropleth üretir. Density
population değildir. Platform entity count veya normalized score'dur.

Color scale nSosyal blue/cyan single-hue family kullanır. Rainbow heatmap product
kararı değildir.

## Sonuçlar

- Demo dış tile/API bağımlılığı olmadan çalışabilir.
- Province map Türkiye-wide'dır.
- District coverage veri eklenerek genişler, component architecture değişmez.
- Current İzmir district data bir demo örneğidir, product boundary değildir.
- Harita discovery'nin görsel yüzüdür; accessible list aynı bilgiyi taşır.

## Erişilebilirlik

Map tek erişim yolu değildir. List view aynı region values ve entity results'ı
sunmalıdır. Keyboard, focus ve selected state color-only olmamalıdır.

## Değerlendirilen alternatifler

- Dış tile provider: daha zengin basemap, fakat demo dependency ve quota riski.
- Static SVG: basit ama MapLibre state, zoom ve future district expansion sınırlı.
- District data'yı tek bir city ile product olarak sınırlamak: reddedildi. Data
  availability implementation concern'dür, product information architecture değil.

Güncel kapsam kararı:
[0009](0009-turkiye-geneli-yogunluk-ve-ilce-genislemesi.md).
