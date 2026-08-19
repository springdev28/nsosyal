# 0010 — Kişiselleştirme iki katmanlıdır

**Durum:** Kabul edildi

## Bağlam

Prototipte kişiselleştirmenin tamamı tek bir alandan geliyordu: `profiles.intent_mode`.
Kullanıcı onboarding'de Sosyalleş / Keşfet / Öğren / Üret'ten birini seçiyor, akış
sıralaması da yalnızca o seçime göre ağırlık dağıtıyordu.

Bunun üç ayrı sorunu vardı.

**Birincisi, model yanlıştı.** Spec 7.10 ve 17.18/10 iki farklı zaman ölçeğinden
söz ediyor: kullanıcının platformdan *genel olarak* ne beklediği (kalıcı) ile o an
ne yapmak istediği (anlık). Tek alan bu ikisini birbirine karıştırıyordu. "Öğrenmek
istiyorum" kalıcı bir yönelimdir; "şu an keşfetmek istiyorum" oturumluktur. İkisini
aynı alana yazmak, birini seçmenin diğerini silmesi demekti.

**İkincisi, alan tekildi.** Spec kullanıcının birden fazla amacı aynı anda
seçebilmesini istiyor. Gerçek kullanıcı hem öğrenmek hem topluluk bulmak hem yerel
etkinlik görmek isteyebilir; tek bir enum bunu ifade edemez.

**Üçüncüsü, "mod seçmemek" ifade edilemiyordu.** Kolon `not null default
'sosyallesme'` idi. Yani hiç mod seçmemiş bir kullanıcı ile bilinçli olarak
Sosyalleş seçmiş bir kullanıcı veritabanında aynı satırdı. Oysa spec 7.10 açıkça
"kullanıcı isterse hiçbir modu özellikle seçmeden varsayılan kişiselleştirilmiş
akışı kullanabilmelidir" diyor — kayıt bu seçimi tutamıyordu.

## Karar

Kişiselleştirme iki katmandır ve katmanlar birbirini silmez.

**Kalıcı katman — `profile_goals`.** Spec 10.1.1'deki on beş değerlik kontrollü
sözlük (`socialize`, `find_communities`, … `discover_people`). Kullanıcı birden
fazlasını seçer, Ayarlar'dan istediği zaman değiştirir. Her amaç, sıralamadaki bir
iki sinyale küçük bir itme uygular (`GOAL_SIGNAL_BIAS`): örneğin
`discover_local_ecosystem` konum ağırlığını, `find_resources` öğrenme sinyalini
yükseltir.

Değerler kasıtlı olarak küçüktür. Amaçlar akışı **yönlendirmeli, ele geçirmemeli**:
beş amaç seçen bir kullanıcının akışı, hiç amaç seçmeyeninkinden tanınmaz hâle
gelmemeli.

**Anlık katman — `intent_mode`.** Artık `nullable`. Bir mod seçilirse kalıcı
katmanın *üzerine* %65 oranında harmanlanır; tam değiştirme değil harmanlama
olması kasıtlıdır: aynı modu seçen iki kullanıcı, farklı kalıcı amaçları varsa
farklı akış görür. Bu davranış birim testiyle sabitlenmiştir — aksi hâlde "iki
katman" iddiası arayüzde kalır, sıralamaya geçmezdi.

Her iki katmandan sonra ağırlıklar 1.0'a yeniden normalize edilir; skorların modlar
arasında karşılaştırılabilir kalması buna bağlı (bkz. 0002).

Serbest metin amaç kabul edilmez. Kapalı sözlük olmasa ne sıralamaya ne analitiğe
bağlanabilirdi, ayrıca iki kullanıcının "öğrenmek" yazısı aynı şey sayılamazdı.

## Sonuçlar

- Onboarding artık mod ön seçmiyor; kalıcı amaçlar ayrı bir adımda toplanıyor
  (teknik rapor 3.3.2 bunu P0 sayıyor).
- Akışta "Amaçlarıma göre" seçeneği var: mod seçmemek geçerli bir seçim.
- `/about` sayfası iki katmanı da açıklıyor, ağırlık tablosuyla birlikte.
- **Bedeli:** ağırlık hesabı tek tablo okumaktan çıktı, iki katmanlı bir
  bileşime dönüştü. Karşılığında hem spec'e uyuyor hem de "neden gösteriliyor?"
  açıklaması doğru kalıyor.
- **Açık nokta:** `profile_goals.weight` alanı şemada var ama arayüz henüz
  ağırlık verdirmiyor; hepsi 1.0. Kullanıcı testi amaçlar arası öncelik ihtiyacı
  gösterirse alan hazır.

## Değerlendirilen alternatifler

- **intent_mode'u çoklu seçime çevirmek:** iki zaman ölçeğini yine karıştırırdı;
  "şu an keşfetmek" ile "genel olarak topluluk aramak" aynı kutuda kalırdı.
- **Amaçları tek JSON alanında tutmak:** spec 10.1.1 bunun mümkün olduğunu ama
  sık sorgulanan alanların ilişkisel tutulmasının sıralamayı ve analitiği daha
  açıklanabilir yaptığını söylüyor. İlişkisel tablo seçildi.
- **Amaçları doğrudan ağırlık olarak almak:** kullanıcıya yedi sinyalin ağırlığını
  elle ayarlatmak demekti; ürün bunu istemiyor, üstelik açıklanabilirliği
  artırmaz.
