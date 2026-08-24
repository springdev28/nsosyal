# Gerçek kullanıcı kullanılabilirlik testi

Bu belge iki ayrı amacı taşır: 24 Ağustos 2026 tarihinde tamamlanan görev temelli
kullanılabilirlik çalışmasının anonim toplu kaydını korur ve gelecek test turları
için tekrar kullanılabilir bir protokol sunar. Tamamlanan çalışmanın yöntemi ile
gelecek turların standart yöntemi aşağıda ayrı başlıklarda açıklanır. Otomatik test
sonucu veya ekip içi deneme, gerçek katılımcı çalışmasının yerine geçmez.

## 24 Ağustos 2026 tamamlanan çalışma

Çalışma 24 Ağustos 2026 tarihinde, Hostinger üzerindeki canlı nSosyal prototipinde
moderatör eşliğinde yürütüldü. Test başlangıcında canlı ortamın doğrulanan uygulama
sürümü `52c4044906836ede953ea9aa2f3a899e2ed51965` idi. On anonim hedef
kullanıcının her birine farklı bir kritik görev atandı. Böylece toplam on görev
denemesi ölçüldü. Bu tasarım, akışların tamamını her katılımcıyla tekrar eden bir
karşılaştırma testi değildir.

Katılımcı adları, iletişim bilgileri, okul veya kurum adları kaydedilmedi. Oturum
biçimi, cihaz ve tarayıcı bilgileri toplu kayıt formuna eklenmedi. Bu nedenle
sonuçlar bu alanlarda bir dağılım iddiası içermez.

| Katılımcı ve atanan görev | Ölçülen sonuç | Gözlem ve ürün karşılığı |
| --- | --- | --- |
| K1, 17 yaşında lise öğrencisi. İlk kurulum ve ilgi alanı seçimi | Başarılı, 01:18, 0 yanlış tıklama, 1 kısa tereddüt, yardım yok | Kalıcı tercihler Ayarlar'da tutuldu; Sosyalleş, Keşfet, Öğren ve Üret geçici akış modu olarak ayrıştırıldı. |
| K2, 19 yaşında üniversite öğrencisi. 5N ve Nerede ile ilindeki etkinliği bulma | Başarılı, 02:06, 1 yanlış tıklama, 1 tereddüt | Etkin konu, zaman ve il filtreleri görünür tutuldu; yoğunluk ve erişilebilir il listesi aynı veriye bağlandı. |
| K3, 15 yaşında proje geliştiren öğrenci. Kısa demo videosu paylaşma | Başarılı, 01:47, 0 yanlış tıklama, yardım yok | Yükleme alanına Gündelik, Pitch, Demo, İlerleme, Nasıl, Neden ve Soru türleri eklendi. |
| K4, 18 yaşında genç üretici. Yatay videoyu kısa video akışında kontrol etme | Başarılı, 00:52, 0 yanlış tıklama, 1 görsel kontrol | Video 9:16 çerçevede kırpılmadan ortalandı; boş kenarlar siyah bırakıldı. |
| K5, 21 yaşında topluluk yöneticisi. Topluluk adına gönderi oluşturma | Başarılı, 01:39, 1 yanlış tıklama, yardım yok | Hedef seçimi gönderim alanında tutuldu ve seçili topluluk belirginleştirildi. |
| K6, 18 yaşında içerik üreticisi. Neden hikâyesinden bağlı projeye geçme | Başarılı, 00:41, 0 yanlış tıklama, 1 tereddüt | Proje geçişi içerik metninden ayrılarak görünür bağlantı hâline getirildi. |
| K7, 34 yaşında öğretmen ve mentör. Editoryal ve sponsorlu içeriği ayırma | Başarılı, 00:49, 0 yanlış tıklama, sponsorlu alanı doğru tanıdı | Sponsorlu etiketi gazete düzeni içinde korundu. |
| K8, 27 yaşında kurum iletişim sorumlusu. Yayın Atölyesi'nde alan ve dosya seçme | Başarılı, 02:31, 1 yanlış tıklama, 1 yardım isteği | Düzenleme kontrolleri önizlemeden çıkarıldı; taşma ve çakışma uyarısı gönderim öncesine taşındı. |
| K9, 20 yaşında klavye kullanan öğrenci. Fare olmadan video türü seçip gönderme | Başarılı, 01:22, 0 yanlış tıklama, yardım yok | Türler klavye ile çalışan gerçek bir radyo grubu olarak tanımlandı. |
| K10, 41 yaşında görme desteği kullanan bilim iletişimcisi. Videoyu açmadan içeriği anlama | Başarılı, 01:04, 0 yanlış tıklama, 1 tereddüt | Medya açıklaması zorunlu tutuldu ve kartta erişilebilir bir eylem olarak korundu. |

| Gösterge | Ölçülen sonuç |
| --- | --- |
| Görev tamamlama | 10 / 10, yüzde 100 |
| Yardım istemeden tamamlama | 9 / 10 |
| Medyan görev süresi | 01:20 |
| Yanlış tıklama | 3 |
| Tereddüt | 4 |
| Yardım isteği | 1 |
| Görsel kontrol | 1 |

Medyan süre, on süre sıralandığında ortadaki 01:18 ve 01:22 değerlerinin
ortalamasıdır. Ayrıntılı açıklama [teknik raporun 3.3.5 bölümünde](https://docs.google.com/document/d/1mZMjH6gxb4-UHDv3bRB5ItY4HcqF2P8R7cMCO9L_0Yw/edit)
yer alır. Tablodaki ürün karşılıkları gözlemlere verilen arayüz yanıtlarını
özetler. Her satır için ayrı commit ve aynı katılımcıyla yeniden test kaydı
toplanmadığından bu çalışma değişiklik öncesi ve sonrası karşılaştırması olarak
sunulmaz.

## Bu çalışma neyi kanıtlar?

Test şu sorulara ölçülebilir yanıt üretir:

- Yeni bir kullanıcı nSosyal'in ne işe yaradığını açıklama almadan anlayabiliyor mu?
- 5N seçicisi bir görsel efekt değil, işe yarayan keşif yolu olarak kullanılabiliyor mu?
- Kullanıcı etkinlik, topluluk, kaynak, proje ve Neden hikâyesi arasında yolunu bulabiliyor mu?
- Konum paylaşımı ve sponsorlu içerik ayrımı doğru anlaşılıyor mu?
- Kritik işlemler mobil ve masaüstünde yardım almadan tamamlanabiliyor mu?

Bu çalışma memnuniyet araştırması değildir. Katılımcının ürünü beğenmesi, bir
görevi tamamlayabildiğini kanıtlamaz.

## Katılımcılar

Bu turda **10 kişi** yer aldı. Gelecek yeniden testlerde aynı hedef kitle çeşitliliği korunur. Örneklem mümkünse şu grupları kapsar:

- lise veya üniversite öğrencisi;
- teknolojiyle ilgilenen fakat düzenli proje üretmeyen gündelik kullanıcı;
- proje üreten öğrenci veya genç geliştirici;
- topluluk üyesi ya da topluluk yöneticisi;
- öğretmen, mentör veya kurum temsilcisi.

Katılımcı nSosyal ekibinde çalışmamalı ve arayüzü daha önce ayrıntılı görmemiş
olmalıdır. Aynı kişi hem ilk turda hem yeniden testte yer alabilir; bu durumda
öğrenme etkisi sonuç notunda belirtilir.

18 yaşından küçük bir katılımcıyla kayıt alınacaksa veli/onay süreci ekip
tarafından tamamlanır. Repo veya rapora ad, e-posta, telefon, okul numarası,
yüz görüntüsü ya da başka bir kişisel veri eklenmez. Katılımcılar `K01`, `K02`
gibi anonim kodlarla kaydedilir.

## Test edilecek sürüm

Her oturum başlamadan önce aşağıdakiler yazılır:

| Alan | Kayıt |
| --- | --- |
| Release commit SHA | `________________` |
| Canlı ortam | Hostinger / Render |
| Tarih ve İstanbul saati | `________________` |
| Cihaz ve ekran | `________________` |
| Tarayıcı ve sürüm | `________________` |
| Giriş hesabı | Elif / Baran / Ege Teknopark / Deniz |
| Hareket azaltma veya yardımcı teknoloji | `________________` |

Oturum yalnızca `/api/health` yanıtındaki commit, test formuna yazılan SHA ile
aynıysa başlatılır. Hostinger ve Render farklı commit bildiriyorsa test ertelenir.

## Hazırlık

1. Testten önce demo verisini bilinen başlangıç durumuna getir.
2. Katılımcıya çalışan bağlantıyı ver; doğrudan alt sayfa bağlantısı verme.
3. Ekran veya ses kaydı alınacaksa başlamadan açık izin al.
4. Katılımcıya görevlerin ürünü değil arayüzü sınadığını söyle.
5. Görev sırasında buton adı, rota, 5N seçeneği veya doğru cevap söyleme.
6. Teknik arıza ile kullanılabilirlik hatasını ayrı kaydet.
7. Bir görev 5 dakika boyunca ilerlemiyorsa görevi durdur; başarıya zorlayarak
   süreyi uzatma.

### Moderatörün okuyacağı giriş

> Bugün seni değil arayüzü test ediyoruz. Ne düşündüğünü sesli söyleyebilirsin.
> Bir noktada takılırsan bunun nedeni sen değilsin; arayüzü düzeltmemiz gerekir.
> Görev sırasında nasıl yapacağını anlatmayacağım. İstediğin anda testi
> durdurabilirsin.

## Gelecek test turları için ortak görev havuzu

Aşağıdaki sekiz görev, gelecek karşılaştırmalı test turlarında tüm katılımcılara
aynı sırayla ve aynı metinle verilir. Moderatör parantez içindeki başarı ölçütlerini
katılımcıya okumaz. Bu standart görev havuzu, 24 Ağustos 2026 çalışmasının yöntemi
değildir; o çalışmada her katılımcıya bir farklı görev atanmıştır.

### Görev 1 : Giriş ve ilk anlam

**Katılımcıya:** Uygulamaya gündelik kullanıcı olarak gir. Ana sayfayı incele ve
bu uygulamada ilk olarak ne yapabileceğini bize anlat.

**Başarı:** Elif hesabıyla giriş yapar, ana akışı görür ve en az bir gerçek eylemi
(paylaşım okuma, hikâye açma, keşfetme veya gönderi oluşturma) doğru tarif eder.

### Görev 2 : 5N ile yerel etkinlik bulma

**Katılımcıya:** İzmir'de havacılık veya uzayla ilgili bir etkinlik bul. Ne zaman
olduğunu öğren ve hatırlatma kur.

**Başarı:** 5N veya Keşfet üzerinden ilgili etkinliğe ulaşır, tarih/saat bilgisini
bulur ve hatırlatmayı etkinleştirir.

### Görev 3 : Topluluğa katılma ve kaynak bulma

**Katılımcıya:** Havacılıkla ilgilenen bir topluluk bul, katıl ve topluluğun
paylaştığı bir öğrenme kaynağına ulaş.

**Başarı:** İlgili topluluğa ulaşır, üyelik eylemini tamamlar ve Kaynaklar
bölümündeki bir öğeyi bulur.

### Görev 4 : Bir projenin başlangıç nedenini bulma

**Katılımcıya:** Rüzgâr ölçer projesini yapan kişiyi bu projeye götüren deneyimi
veya problemi bul. Ardından yaşayan proje sayfasına geç.

**Başarı:** Neden hikâyesini bulur, motivasyonu doğru özetler ve bağlı proje
sayfasına ulaşır.

### Görev 5 : Türkiye haritasını yorumlama

**Katılımcıya:** Türkiye genelinde robotik topluluklarının hangi illerde daha
yoğun olduğunu karşılaştır. Bir il seç ve sonucu oluşturan kayıtları göster.

**Başarı:** Varlık türünü topluluk, konuyu robotik olarak seçer; legend veya
sayısal değeri yorumlar; bir ili açar ve harita ile sonuç listesinin aynı
kayıtları anlattığını gösterir.

### Görev 6 : Konum mahremiyetini değiştirme

**Katılımcıya:** Profilinde yalnızca il düzeyinde konum görünmesini sağla. Daha
sonra konum paylaşımını tamamen kapatabileceğin yeri göster.

**Başarı:** Ayarlar içinden konum düzeyini il olarak kaydeder ve kapalı seçeneğini
yardım almadan bulur. Kesin adres veya canlı konum paylaşılmadığını doğru anlar.

### Görev 7 : nGazete'de ücretli içeriği ayırt etme

**Katılımcıya:** Bugünün gazetesini aç. Bir editör seçkisi ile ücretli yerleşimi
ayırt et ve ücretli içeriğin kişisel akışını etkileyip etkilemediğini söyle.

**Başarı:** Gazete sayısını açar, `Sponsorlu` etiketli yerleşimi doğru tanır ve
ödemenin kişisel akış sıralamasını yükseltmediğini belirtir.

### Görev 8 : 5N'yi kendi sözleriyle açıklama

**Katılımcıya:** Uygulamayı kullandıktan sonra 5N işaretinin ne yaptığını kendi
sözlerinle anlat.

**Başarı:** 5N'yi zorunlu gönderi formu veya yalnızca animasyon olarak değil;
içeriği konu, yer, zaman, yöntem/kaynak ve neden bağlamlarından yeniden bulma yolu
olarak açıklar.

## Her görev için kayıt

Başarı değerleri:

- `2` : yardım almadan tamamladı;
- `1` : küçük yönlendirmeyle veya dolaylı yoldan tamamladı;
- `0` : tamamlayamadı ya da yanlış sonucu doğru sandı.

Yanlış dönüş, katılımcının hedefe yaklaştırmayan yeni sayfa, panel veya eyleme
geçmesidir. Aynı yerde tekrarlanan tıklamalar ayrı yanlış dönüş olarak sayılmaz;
tek bir takılma notu olarak kaydedilir.

| Görev | Başarı 0/1/2 | Süre | Yanlış dönüş | Yardım | Gözlenen kırılma | Katılımcı sözü |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |

Her görevin sonunda yalnızca şu soru sorulur: **Bu görevi yapmak ne kadar kolay
veya zordu?** Katılımcı 1 (çok zor) ile 7 (çok kolay) arasında puan verir.

## Oturum sonu soruları

1. Uygulamanın ne işe yaradığını bir arkadaşına nasıl anlatırdın?
2. En çok güvendiğin ve en az güvendiğin bölüm hangisiydi? Neden?
3. Bir yerde ne olacağını tahmin edemediğin oldu mu?
4. 5N işaretini tekrar kullanır mıydın? Hangi amaçla?
5. Konum ve sponsorlu içerik konusunda ne anladın?
6. Tek bir şeyi değiştirebilseydin neyi değiştirirdin?

## Bulguları birleştirme

Her görev için aşağıdaki değerler hesaplanır:

- yardımsız başarı oranı: `2 alan katılımcı / toplam katılımcı`;
- toplam başarı oranı: `1 veya 2 alan katılımcı / toplam katılımcı`;
- ortanca tamamlama süresi;
- ortanca kolaylık puanı;
- toplam yanlış dönüş ve yardım sayısı;
- aynı kırılmayı yaşayan katılımcı sayısı.

| Görev | Yardımsız başarı | Toplam başarı | Ortanca süre | Kolaylık 1-7 | Ortak kırılma |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |
| 5 |  |  |  |  |  |
| 6 |  |  |  |  |  |
| 7 |  |  |  |  |  |
| 8 |  |  |  |  |  |

## Önem derecesi ve düzeltme sırası

| Derece | Tanım | Eylem |
| --- | --- | --- |
| Bloker | Görev tamamlanamıyor; mahremiyet, ödeme veya veri algısı yanlış oluşuyor | Release durur; düzeltme ve yeniden test zorunlu |
| Yüksek | Katılımcıların en az üçte biri aynı kritik noktada yardıma ihtiyaç duyuyor | Yeni özellikten önce düzeltilir |
| Orta | Görev tamamlanıyor fakat belirgin yanlış dönüş veya gereksiz süre var | Release öncesi mümkünse düzeltilir |
| Düşük | Kozmetik veya tekil tercih; görevi etkilemiyor | Kanıtla kaydedilir, gerekirse ertelenir |

İlk önerilen yayın eşiği şudur: kritik görevlerin her birinde en az `%80` toplam
başarı, mahremiyet ve sponsor ayrımında `%100` doğru anlama, hiçbir bloker ve
aynı yüksek önem dereceli kırılmanın yeniden testte tekrarlanmaması. Bu eşik ürün
gerçeği değildir; ilk tur verisi görüldükten sonra gerekçesiyle güncellenebilir.

## Değişiklik ve yeniden test kaydı

Gelecek turlarda bir sorun yalnızca düzeltilmiş görünmesiyle kapanmaz. Aşağıdaki
zincirin tamamı kaydedilir. 24 Ağustos 2026 çalışmasında bu zincir her bulgu için
toplanmadığından ürün karşılıkları yeniden test edilmiş sonuç olarak sunulmaz:

| Bulgu | İlk tur kanıtı | Değişen dosya/commit | Beklenen etki | Yeniden test sonucu | Durum |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | Açık |

Yeniden test aynı görev metni, aynı başarı ölçütü ve aynı ölçüm yöntemiyle
yapılır. Değişiklik başka bir görevi etkiliyorsa o görev de yeniden çalıştırılır.

## Yarışma kanıtına aktarım

Teknik rapora yalnızca gerçekten ölçülen değerler yazılır:

- anonim katılımcı sayısı ve hedef kitle dağılımı;
- test edilen tam release SHA;
- görev bazında başarı oranı ve ortanca süre;
- en sık görülen kırılma;
- kaydedildiyse bu kırılma için yapılan değişikliğin commit'i;
- yapıldıysa aynı görevin yeniden test sonucu;
- kalan sınırlamalar.

Ham kayıtlar kişisel veri içermeden ekip alanında tutulur. Repo yalnızca anonim
toplu sonucu ve düzeltme bağlantılarını taşır. Test yapılmadıysa tablo boş kalır
ve ürün `kullanıcı doğrulandı` olarak sunulmaz.
