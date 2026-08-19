# 0007 — Ürünün günü Europe/Istanbul günüdür

**Durum:** Kabul edildi

## Bağlam

Ürünün pek çok yerinde "gün" kavramı var: bugünün gazete sayısı, bugünün
etkinlikleri, son başvuru tarihine kalan süre, "Ne zaman" ekranının geçmiş / bugün /
gelecek bölmeleri.

İlk uygulamada bu tarihler sunucunun yerel saatine göre üretiliyor, ama İstanbul
gününe göre aranıyordu. UTC'de çalışan bir sunucuda ikisi saat 21:00'den sonra
ayrışıyor ve **bugünün gazete sayısı ortadan kayboluyordu.** Hata testlerde ortaya
çıktı çünkü testler o saat aralığında koştu; sahnede çıksaydı demoyu bozardı.

## Karar

Ürünün günü **Europe/Istanbul** günüdür. `src/lib/time` bu dönüşümü sabit UTC+3 ile
yapar (`toIstanbulDateKey`, `startOfIstanbulDay`) ve gün sınırına bağlı tüm hesaplar
oradan geçer — üretim tarafı (seed) da, sorgu tarafı (store) da.

Playwright `timezoneId: 'Europe/Istanbul'` ile çalışır; birim testlerinde ise gün
sınırını aşan bir senaryo regresyon testi olarak sabitlenmiştir.

## Sonuçlar

- "Bugün" kullanıcı için ne anlama geliyorsa kod için de aynı anlama geliyor.
- Sunucunun saat dilimi artık davranışı değiştirmiyor; barındırma ortamı serbest.
- **Bedeli:** yaz saati uygulaması geri gelirse sabit UTC+3 varsayımı yeniden
  değerlendirilmelidir. Türkiye 2016'dan beri kalıcı UTC+3 kullandığı için prototip
  ölçeğinde bu kabul edilebilir bir sadeleştirmedir; tek yerde durduğu için
  değiştirmek de kolaydır.

## Değerlendirilen alternatifler

- **Her yerde UTC kullanmak:** hesap kolaylaşır ama kullanıcıya gösterilen "bugün"
  yanlış olur.
- **Tarayıcının saat dilimine güvenmek:** sunucuda üretilen içerik (gazete sayısı,
  akış) için mümkün değil; ayrıca kullanıcıdan kullanıcıya farklı sonuç üretirdi.
- **Tam IANA saat dilimi kütüphanesi:** doğru ama bu prototipin ihtiyacı için fazla;
  tek bir sabit ofset yeterli ve bağımlılık eklemiyor.
