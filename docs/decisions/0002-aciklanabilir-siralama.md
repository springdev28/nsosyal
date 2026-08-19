# 0002 — Açıklanabilir sıralama, makine öğrenmesi yok

**Durum:** Kabul edildi

## Bağlam

Ürünün vaadi "doğru bağlamı bulmak". Bunu bir öneri modeliyle yapmak cazip
görünüyor, ama prototip ölçeğinde eğitim verisi yok, doğrulama yolu yok ve modelin
neden o kartı gösterdiğini kimse söyleyemez. Yarışma ayrıca ürün fikrinin ve
katkının takıma ait olmasını bekliyor; açıklanamayan bir kutu bunu zorlaştırır.

Ayrıca arayüzde her kartın altında **"Neden gösteriliyor?"** açıklaması sözü
verilmiş durumda. Bu söz ancak skorun bileşenleri okunabiliyorsa tutulabilir.

## Karar

Akış skoru, ağırlıklı ve tamamen okunabilir bir toplamdır
(`src/lib/ranking/rank.ts`):

| Sinyal | Temel ağırlık |
| --- | --- |
| Konu eşleşmesi | 0.30 |
| Takip edilen kaynak | 0.20 |
| Topluluk eşleşmesi | 0.15 |
| Niyet uyumu | 0.10 |
| Tazelik | 0.10 |
| Konum eşleşmesi | 0.10 |
| Keşif bonusu | 0.05 |

Niyet modu (Sosyalleş / Keşfet / Öğren / Üret) bu ağırlıkları yeniden dağıtır;
**toplam her modda 1.0'da kalır**, böylece skorlar modlar arasında
karşılaştırılabilir. Tazelik üstel azalır (yarılanma 36 saat).

Ağırlıklar `/about` sayfasında tablo olarak yayımlanır ve "demo başlangıç değeri,
ürün gerçeği iddiası değil" notuyla verilir.

## Sonuçlar

- Her kart için tek cümlelik, doğru bir gerekçe yazılabiliyor.
- Ağırlıklar kullanıcı testiyle değiştirilebilir; değişiklik tek dosyada.
- Sıralama birim testleriyle sabitlenebiliyor (32 test).
- **Bedeli:** kişiselleştirme sığ. Uzun vadede davranış sinyalleriyle beslenen bir
  model daha iyi sonuç verebilir — ama o kararın önkoşulu ölçüm altyapısıdır.

## Ek kısıt: açıklama yalnızca beş sinyal

`explainRanking` yalnızca konu, takip, topluluk, konum ve keşif sinyallerini
gerekçe olarak döndürür. Niyet uyumu ve tazelik hesaba katılır ama açıklama olarak
gösterilmez: ikisi de neredeyse her kartta yüksek çıkıyor ve açıklamayı
"çünkü yeni" gibi anlamsız bir cümleye indirgiyordu. Bunu bir birim testi korur.

## Değerlendirilen alternatifler

- **Gömme (embedding) tabanlı benzerlik:** içerik az olduğu için gürültülü; ayrıca
  bir model servisi bağımlılığı demoyu ağa bağlar.
- **Saf kronolojik akış:** açıklanabilir ama ürünün keşif vaadini göstermez.
- **Etkileşimden öğrenen basit bandit:** demo süresi içinde anlamlı veri
  toplanamayacağı için ölçülemez kalırdı.
