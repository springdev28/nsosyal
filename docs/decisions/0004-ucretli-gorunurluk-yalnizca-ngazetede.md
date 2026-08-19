# 0004 — Ücretli görünürlük yalnızca nGazete'de

**Durum:** Kabul edildi

## Bağlam

Ürünün gelir modeli var: kurumlar görünürlük satın alabiliyor. Sosyal ağlarda bunun
alışılmış yolu sponsorlu içeriği kişisel akışa karıştırmak. Bu prototipte bu yol
kapalıdır — hem ürün vaadi (güvenilir keşif) hem de yarışma anlatısı bunun üstüne
kurulu.

Kural niyet beyanı olarak kalırsa er ya da geç ihlal edilir: birinin akış
sıralamasına küçük bir "sponsor bonusu" eklemesi yeterlidir.

## Karar

Ücretli yerleşim yalnızca **nGazete** yüzeyinde yaşar. Bunu kod düzeyinde
kısıtlıyoruz:

- `src/lib/ranking/rank.ts` sponsorluk, ilan, ödeme veya gazete kavramlarını
  **bilmez** ve o modüllerden import yapmaz.
- `tests/unit/ranking.test.ts` bu dosyanın kaynağını okuyup bu terimlerin
  geçmediğini doğrular. Yani kuralı ihlal eden bir değişiklik testi kırar.
- Bir E2E testi akışta hiçbir sponsorlu kart bulunmadığını doğrular.
- Gazetedeki her sponsorlu kart açıkça etiketlenir ve etiketi yüksek kontrastlıdır.

## Sonuçlar

- Gelir modeli gösterilebiliyor, ama akışın güveni bozulmuyor.
- Kural bir belge cümlesi değil, kırılabilir bir test.
- **Bedeli:** gazete yüzeyi kendi başına değer üretmek zorunda; "akışa serpiştir"
  kolaylığı yok. Gazetenin oturumda bir kez açılması ve kapatma düğmesinin kısa bir
  gecikmeyle etkinleşmesi bu yüzden var.

## Değerlendirilen alternatifler

- **Akışta etiketli sponsorlu kart:** sektör standardı, ama ürünün ayırt edici
  iddiasını doğrudan çürütürdü.
- **Sponsorlu içeriğe negatif olmayan küçük bir bonus:** "az miktarda" kirlilik yine
  kirliliktir ve sınırı savunmak imkânsız hâle gelir.
