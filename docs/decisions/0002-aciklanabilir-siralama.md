# 0002 - Açıklanabilir sıralama, makine öğrenmesi yok

**Durum:** Kabul edildi, kişiselleştirme modeli 0010 ile genişletildi

## Bağlam

Ürünün vaadi doğru bağlamı bulmaktır. Prototip ölçeğinde doğrulanabilir eğitim
verisi olmadığı için açıklanamayan bir recommendation modelini yalnızca AI etiketi
uğruna eklemek doğru değildir.

İlk implementasyon topic, follow, community, transient intent, recency, location ve
exploration sinyallerinden açıklanabilir weighted score üretir. Bu, demo için iyi
bir başlangıçtır ancak güncel ürün vizyonundaki long-term profile preferences ile
transient intent ayrımını tek başına karşılamaz.

## Karar

Ranking açıklanabilir signal composition olarak kalır. Makine öğrenmesi zorunlu
değildir.

Mevcut demo başlangıç ağırlıkları:

| Sinyal | Temel ağırlık |
| --- | --- |
| Konu eşleşmesi | 0.30 |
| Takip edilen kaynak | 0.20 |
| Topluluk eşleşmesi | 0.15 |
| Geçici niyet uyumu | 0.10 |
| Tazelik | 0.10 |
| Konum eşleşmesi | 0.10 |
| Keşif bonusu | 0.05 |

Bu değerler **ürün gerçeği değildir**. Demo başlangıç parametreleridir.

Güncel hedef model ayrıca long-term profile preference match sinyali taşır. Bunun
exact ağırlığı kullanıcı testi ve ürün ölçümüyle belirlenmelidir. Yeni signal
eklenirken toplam skor normalize edilmeli ve açıklanabilir kalmalıdır.

## Kalıcı tercih ve transient intent ayrımı

Long-term preferences profile'a aittir. Kullanıcı interests ve platform goals
ayarlarını değiştirmedikçe devam eder.

`Sosyalleş`, `Keşfet`, `Öğren`, `Üret` transient intent'tir. Kullanıcının o anda
ne yapmak istediğini belirtir ve o oturum/task bağlamında signal weight'lerini
geçici olarak yeniden dağıtabilir. Profile goals'u silmez veya yerine geçmez.

Bu ayrımın ayrıntılı kararı:
[0010](0010-kalici-profil-hedefleri-ve-gecici-niyet.md).

## Açıklama

"Neden gösteriliyor?" kullanıcıya teknik weight dökümü vermek zorunda değildir.
Kısa, doğru ve kullanıcı için anlamlı dominant reason gösterilir. Örnek reason
kaynakları topic, followed source, community, profile preference, optional location
ve exploration olabilir.

Recency veya transient intent hemen her kartta tekrar eden anlamsız bir label
üretiyorsa açıklama reason'ı olarak gösterilmeyebilir.

Ana feed card'ında uzun algorithm explanation kullanılmaz. Ayrıntılı weight tablosu
About veya docs yüzeyinde yaşar.

## Paid placement invariant

Sponsorship, ad price, campaign veya newspaper placement scoring signal değildir.
Feed ranking nGazete monetization modelinden bağımsızdır.

## Sonuçlar

- Prototype ranking okunabilir ve test edilebilir kalır.
- Long-term preference ile current task intent birbirine karışmaz.
- Weight tuning kullanıcı testiyle yapılabilir.
- Gelecekte behavior-based model eklenmesi gerekirse bu ayrı, ölçülebilir bir karar
  olarak alınır.

## Değerlendirilen alternatifler

- embedding-only recommendation: prototype için dış model/dependency ve düşük
  doğrulanabilirlik nedeniyle çekirdek karar değil;
- pure chronology: discovery hedefini yetersiz gösterir;
- single permanent intent mode: kullanıcının platformdan birden fazla beklentisini
  temsil etmez ve reddedilmiştir.
