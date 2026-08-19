# 0008 — Erişilebilirliği ölçüp testle sabitlemek

**Durum:** Kabul edildi

## Bağlam

Yarışma erişilebilirliği açıkça değerlendiriyor ve hedef WCAG 2.2 AA. Erişilebilirlik
tek seferlik bir denetimle korunamaz: tasarım sistemi bir kez değiştiğinde
(bkz. 0006) yüzlerce düğüm aynı anda ihlale düşebiliyor — nitekim düştü de.

Renk kararlarının "göze iyi görünüyor" ile verilmesi de işe yaramıyor. Bağlam
çipleri kendi renginin %12'sini zemin olarak kullandığı için, koyu tema için seçilmiş
canlı bir camgöbeği açık zeminde 1.5:1'e kadar düşüyordu.

## Karar

1. **Renk oranları hesaplanır, tahmin edilmez.** Bir renk değişince oran, gerçek
   yüzeye (kartın zemini, çipin kendi karışımı, sayfa arka planı) karşı hesaplanır ve
   değişkenin yanına ölçülen değer yorum olarak yazılır.
2. **5N1K boyut renkleri temaya bağlıdır.** Koyu ve açık tema için ayrı değerler
   tutulur; her iki temada ölçülen en düşük oran 4.8:1'dir.
3. **Otomatik tarama iki temayı da kapsar.** Playwright varsayılan olarak açık temayı
   taklit eder, oysa ürünün varsayılanı koyu tema. `tests/e2e/accessibility.spec.ts`
   ana sayfaları açık temada, kritik sayfaları ayrıca koyu temada tarar; ayrıca aynı
   testler mobil profilde de koşar.
4. **Renkten bağımsız durum testi.** "Seçili filtre yalnızca renkle değil işaretle de
   belirtilir" gibi kurallar ayrı testlerle sabitlenir.
5. **Otomatik testin sınırı yazılır.** Spec dosyasının başındaki uyarı, axe'ın yalnızca
   makinece tespit edilebilen hataları yakaladığını; klavye sırası, odak yönetimi ve
   ekran okuyucu deneyiminin elle kontrol edilmesi gerektiğini söyler.

## Sonuçlar

- Tasarım sistemi yeniden yazıldığında ortaya çıkan 241 düğümlük kontrast ihlali ve
  dokunma hedefi sorunları ölçülerek kapatıldı; suite şu anda her iki temada,
  masaüstü ve mobilde ihlalsiz.
- Erişilebilirlik regresyonu artık sessizce geçemiyor; testte kırılıyor.
- **Bedeli:** E2E süresi uzuyor (tema ve profil çarpanı). Kabul edilebilir; suite
  tek işçiyle birkaç dakika sürüyor.

## Değerlendirilen alternatifler

- **Yalnızca açık temayı taramak:** ürünün varsayılan görünümünü test dışında
  bırakırdı.
- **Tek bir "erişilebilirlik geçişi" yapıp testsiz bırakmak:** bir sonraki tasarım
  değişikliğinde her şey geri gelirdi — nitekim ilk kez öyle oldu.
- **axe'ın kural kümesini gevşetmek:** ihlali gizler, sorunu çözmez.
