# nSosyal 5N1K - ürün ve teknik sözleşme

Bu dosya, geliştirme sırasında coding agent ve geliştiricilerin kullanacağı kısa ürün sözleşmesidir. Ayrıntılı kaynak Google Docs'taki **nSosyal 5N1K - Prototip Geliştirme ve Ürün Spesifikasyonu** belgesidir.

## 0. Kaynak önceliği

Çelişki olduğunda şu sıra geçerlidir:

1. Kullanıcının/takımın en güncel açık ürün kararı ve güncel Figma master tasarımı.
2. Ana geliştirme spesifikasyonu.
3. Bu dosya, `AGENTS.md` ve `CLAUDE.md`.
4. Mevcut implementasyon.

Mevcut kod bir özelliği başka türlü yapıyor diye o davranışı otomatik olarak ürün gerçeği kabul etme. Önce üst kaynaklarla karşılaştır.

## 1. Ürün tezi

nSosyal 5N1K, bilim, teknoloji ve inovasyon çevresindeki gündelik sosyalliği, toplulukları, öğrenmeyi, projeleri, etkinlikleri ve yerel ekosistem keşfini tek sosyal kimlik altında bağlayan bir keşif katmanıdır.

Ürün yalnızca kariyer, yarışma veya proje platformu değildir. Mizah, sohbet, soru, kısa video ve gündelik paylaşım birinci sınıf içeriktir.

5N'nin veri dili:

| Boyut | Anlam | Örnek veri |
| --- | --- | --- |
| Ne | konu / içerik / varlık | topic, post type, project, event |
| Nerede | coğrafi bağlam | il, ilçe, çevrim içi |
| Ne zaman | zaman bağlamı | created_at, starts_at, deadline, milestone |
| Nasıl | yöntem / kaynak / öğrenme yolu | resources, process, tools |
| Neden | motivasyon / arka plan | why_stories |
| Kim | sosyal kimlik katmanı | profile, team, institution, community |

Bir içerik yalnızca sahip olduğu bağlamları taşır. Beş alanı doldurmak zorunlu değildir.

## 2. Marka işareti ve 5N selector

Marka işaretinin geometrik kaynağı takımın Figma'da oluşturduğu **master vector**dür. Ekran görüntüsünden veya yaklaşık SVG path'ten tekrar çizilmez.

Değişmez logo kuralları:

- iki uç halka geometrik olarak eşdeğerdir;
- dış çap, iç çap ve stroke kalınlığı aynıdır;
- bağlantı hattı tek sürekli monoline path'tir ve baştan sona aynı kalınlıktadır;
- büyük/küçük düğüm hiyerarşisi veya taper kullanılmaz;
- statik logo particlesız ve glowsuz çalışabilmelidir;
- ışıklı parçacık kullanılırsa ayrı motion layer'dır ve hattın merkezini izler.

5N selector klasik bir radial menu veya tam çark değildir:

1. Kapalı durumda yalnızca N bağlantı işareti görünür.
2. N'ye basınca işaretin yanında **yarım bir yay** açılır.
3. Yay iki uca doğru opacity ile fade olur. Tam daire hiçbir zaman gösterilmez.
4. Ne, Nerede, Ne zaman, Nasıl ve Neden ikonları yay üzerinde hareket eder.
5. Kullanıcı mouse/touch/trackpad ile yayı döndürür veya kaydırır.
6. Seçenek seçim noktasına yaklaşınca belirginleşir, uçlara yaklaşınca kaybolur.
7. Hizalanınca kısa snap/confirm olur.
8. Seçim tamamlanınca selector bütünüyle kaybolur ve ilgili **işlevsel panel** açılır.
9. Başka boyut için kullanıcı N'ye tekrar basar.
10. Kalıcı `çevir`, `seçim noktası`, `çark kaybolur` gibi öğretici metinler kullanma.
11. Reduced-motion ve klavye eşdeğeri zorunludur.

## 3. Görsel dil

Mevcut nSosyal görsel ailesini geliştir, başka bir ürün estetiği icat etme.

Dark-first örnek tokenlar:

- base: `#0A0F1A`
- raised: `#131B28`
- sunken: `#0E1420`
- hover/selected surface: `#1A2333`
- primary text: `#E9EFF7`
- secondary text: `#94A3B8`
- border: `#1F2937`
- accent: `#3D9BFF`

Canlı uygulamadaki mevcut tokenlar farklıysa mevcut nSosyal kaynağı kazanır. 5N boyutları için purple/green/red/yellow rainbow sistemi kurma. Aynı blue/cyan family içinde kal; ayrımı ikon, label ve state ile yap.

Ana UI bir teknik rapor değildir. **Göster, açıklama.** Uzun ürün gerekçeleri Hakkında/Yardım/admin/reklamveren/dokümantasyona taşınır. Sponsor etiketi, privacy/security mesajı ve form hata metni gibi kullanıcı kararını etkileyen açıklamalar görünür kalır.

## 4. Kişiselleştirme

Tek `intentMode` bütün kişiselleştirme değildir.

### Kalıcı profil tercihleri

Kullanıcı Ayarlar'dan birden fazla uzun dönem amacı düzenleyebilir. Örnekler:

- sosyalleşmek / yeni insanlarla tanışmak
- topluluk bulmak
- etkinlik keşfetmek
- proje keşfetmek veya proje paylaşmak
- ekip / iş birliği bulmak
- öğrenmek ve kaynak bulmak
- gelişmeleri takip etmek
- yerel ekosistemi ve kurumları keşfetmek
- fırsatları görmek
- gündelik içerik ve tartışma takip etmek
- üretim süreçlerini / Neden hikâyelerini görmek
- bilgili kişileri keşfetmek

Ayrıca interests, content/feed preferences, location/privacy, notifications, accessibility ve nGazete preferences düzenlenebilir olmalıdır.

### Geçici niyet

`Sosyalleş`, `Keşfet`, `Öğren`, `Üret` yalnızca o andaki sıralama/keşif ağırlıklarını etkileyen geçici modlardır. Kalıcı profil amaçlarını silmez veya onların yerine geçmez.

Onboarding bu tercihlerin başlangıç değerlerini toplar. Hepsi daha sonra Settings'ten değiştirilebilir.

## 5. Nerede: Türkiye yoğunluk keşfi

İzmir yalnızca örnek veri olabilir. Ürün veya bilgi mimarisi hiçbir şehri özel pilot olarak kabul etmez.

Nerede ekranının ana sorusu:

> Seçtiğim alanda veya varlık türünde Türkiye'nin nerelerinde daha fazla hareket var?

Gereksinimler:

- ana bileşen gerçek Türkiye haritasıdır;
- il bazında **yoğunluk/choropleth** gösterilir;
- yoğunluk tek nSosyal blue/cyan skalasında düşükten yükseğe okunur;
- legend görünürdür;
- hover/tıklama bölgesel değeri/sayıyı gösterir;
- çalışan prototipte `metric` URL filtresi `all`, `communities`, `events`,
  `projects`, `organizations`, `people` ve `posts` değerlerini kabul eder;
- yenileme, geri gitme, metin araması ve paylaşılan bağlantı seçili metriği korur;
- bilinmeyen bir `metric` değeri güvenli biçimde `all` görünümüne döner;
- seçilen metrik harita rengini, legend metnini, il ve ilçe sayılarını, bölge
  sıralamasını ve gösterilen sonuç kategorilerini birlikte değiştirir;
- diğer filtreler topic, time range ve participation/online-hybrid bağlamlarını taşır;
- il seçilince bölge detay paneli açılır;
- ilçe verisi olan bölgelerde aynı mimari ilçe düzeyine iner;
- kullanıcı kendi konumunu paylaşmadan haritayı keşfedebilir;
- bireysel kesin koordinat veya canlı konum gösterilmez;
- haritadaki sonuçların erişilebilir liste eşdeğeri vardır.

Yoğunluk nüfus değildir. Seçili platform varlıklarının sayısı veya normalize edilmiş skoru üzerinden hesaplanır. Renk tek başına state taşımamalıdır.

MapLibre bilgi kutusuna aktarılan bölge adı ve dinamik varlık adı HTML olarak
kaçırılır. Harita, açıklama metni ve erişilebilir liste aynı DemoStore anlık
görüntüsünden türetilir.

## 6. Ana ürün kapsamı

### P0

- demo giriş + çok katmanlı onboarding
- editable interests + long-term platform goals
- karışık sosyal feed
- geçici niyet modları
- kısa video
- kök/dal topluluklar + moderator approval
- 5N half-fade selector
- Türkiye yoğunluk haritası
- Ne zaman + event reminder
- Neden stories
- Nasıl resources
- yaşayan project pages
- nGazete gerçek editorial layout + ad inventory
- URL tabanlı global arama + private saved collection
- notifications, profile/settings
- moderation/admin

### P1

- semantik ve typo-tolerant gelişmiş arama
- badges/progress
- gelişmiş analytics
- richer recommendation tuning

### P2

- gerçek ödeme/faturalandırma
- tam video transcoding/CDN
- native apps
- real-time messaging/live
- production-scale semantic search

## 7. Feed

Feed karışık sosyal ürün gibi davranır: text, image, short video, question, casual/humour, project update, event, resource ve Why-linked content.

Explainable ranking başlangıç sinyalleri: topic match, followed source, community match, long-term profile preference match, transient intent match, recency, optional location match, exploration bonus.

Mevcut sabit ağırlıklar yalnızca demo başlangıç değeridir. Kalıcı ürün gerçeği değildir.

Mevcut prototipte oluşturucu metin taslağını tarayıcıda korur; gönderi türü, konu,
herkese açık veya topluluk görünürlüğü ve isteğe bağlı profil konumu seçilebilir.
Sayaç, taslak etiketi ve Gönder eylemi dar reflow görünümünde birlikte satır
atlayabildiği için 320 CSS pikselde eylem kırpılmaz ve yatay taşma oluşmaz.
Bir gönderiye en fazla dört JPG/PNG/WebP görsel veya MP4/WebM video eklenir.
Görseller 12 MB; videolar 50 MB ve 90 saniye ile sınırlıdır. Sunucu görsellerde
dosya imzasını, bildirilen MIME değerini ve gerçek byte sayısını; videolarda
bunlara ek olarak MP4/WebM kapsayıcısını ve kapsayıcıdan okunan süreyi doğrular.
Tüm medya dosyaları yazma başlamadan hazırlanır ve tek bir grup olarak
`public/uploads` dizinine alınır. Dosya yazma veya sonraki veri mutasyonu
başarısız olursa o isteğin oluşturduğu dosyalar ile medya kayıtları geri alınır.
`/uploads/[filename]` Route Handler'ı güvenli üretilmiş adları doğru içerik türü
ve değişmez önbellek başlığıyla sunar. Medya açıklaması zorunludur. Akıştaki
medyalı gönderilerin ilk 12'si tam ekran hikâye izleyicisinde açılır. Görsel
hikâyeler altı saniyede ilerler; duraklatma, klavye gezinmesi, odak geri dönüşü ve
`prefers-reduced-motion` davranışı uygulanmıştır. Yerel disk yolu prototip
kapsamındadır; kalıcı Supabase Storage/CDN yolu planlanandır.

Beğeni, kaydetme, yorum ve takip eylemleri mevcut prototipte gerçek Server Action
ve `DemoStore` mutasyonlarıdır. Kaydedilen gönderiler `/saved` rotasında yalnızca
oturum sahibine ait kişisel koleksiyon olarak listelenir. Koleksiyona masaüstünde
ana gezinmeden, mobilde kullanıcının kendi profilindeki `Kaydedilenler`
kısayolundan ulaşılır. Kısa video kartları da beğeni, yorum ve kaydetme
eylemlerini aynı sosyal veri sözleşmesiyle kullanır.

## 7.1.1 Global arama

Mevcut prototipte uygulama kabuğundaki arama kutusu ve `/explore` formu sorguyu
`/explore?q=...` URL'sine taşır. Kullanıcı kişi, kurum, paylaşım, topluluk, proje
ve etkinlik arayabilir. Sonuçlar türlerine göre başlıklı bölümlerde gösterilir;
paylaşımlar ana akıştaki gerçek `PostCard` bileşenini kullanır. Arama etkinleşince
keşif ana sayfasındaki öneri alanları gizlenir ve sonuç toplamına kişi ile kurumlar
da dahil edilir. Sonuç yoksa filtre temizleme eylemi olan açık bir boş durum
gösterilir.

Genel ad, kullanıcı adı veya biyografi araması için konum paylaşımı gerekmez. İl
filtresinde yalnız il ya da ilçe düzeyinde paylaşımı açık profiller, ilçe
filtresinde yalnız ilçe düzeyinde paylaşımı açık profiller gösterilir. Kesin veya
canlı konum UI'a aktarılmaz. Yalnız zaman veya katılım biçimi filtresi, profil
kayıtlarında karşılığı olmadığı için kişi ya da kurum sonucu üretmez.

Bu kapsam basit alt dize aramasıyla uygulanmıştır. Typo toleransı, eş anlamlılar,
semantik sorgu çözümleme, ayrı arama indeksi ve production ölçekli sıralama P1/P2
çalışmasıdır.

> **Değişmez:** sponsorship feed scoring'e girmez. Paid visibility sadece nGazete'de yaşar.

## 8. Topluluklar

Kök topluluklar platform tarafından açılır. Kullanıcı yerel/niş dal topluluğu önerebilir. Community create doğrudan publish olmaz, moderator approval gerekir ve karar audit log'a yazılır.

Sekmeler: Akış, Etkinlikler, Kaynaklar/Nasıl, Üyeler, Hakkında. Proje ilişkileri ilgili içeriklerde görünür olabilir.

## 9. Neden ve Nasıl

**Neden:** motivasyon sözü duvarı değildir. Bir kişiyi alana, projeye, probleme veya başarıya götüren gerçek deneyim/merak/düşünceyi anlatır ve bağlı profile/project/community'ye geçiş sağlar.

**Nasıl:** ayrı kurs platformu değildir. Topluluk deneyiminden üretilen guide, link, video, checklist, Q&A ve process kaynaklarını sosyal bağlam içinde toplar.

## 10. Projects

Project page statik CV/portfolio değildir. Yaşayan üretim sayfasıdır.

Sekmeler: Genel, Neden, Nasıl, İlerleme, Medya, Ekip, Topluluklar, Etkinlikler.

Mevcut demo yolunda pitch video en fazla 90 saniye ve 50 MB olabilir. İstemci
metadata ile hızlı geri bildirim verir; sunucu MIME, gerçek byte sayısı ve
MP4/WebM kapsayıcı süresini dosya yazılmadan önce yeniden doğrular. Geçerli dosya
çakışmaya kapalı biçimde yazılır, ardından proje ve medya kaydı oluşturulur.
Sonraki adımlardan biri başarısız olursa oluşturulan proje, kurucu ilişkisi, medya
kaydı ve dosya geri alınır. Tekrar deneme yarım veya yinelenen proje bırakmaz.
Production Storage/CDN, codec dönüştürme ve kötü amaçlı dosya taraması
planlanandır.

## 11. nGazete

nGazete generic card grid değildir. Gerçek dijital gazete kompozisyonudur:

- masthead
- issue/date
- hero/headline hierarchy
- article images + alt text
- sections
- columns/grid
- internal/external links
- editorial priority/layout variants

### Mevcut prototipte Yayın Atölyesi

`/publish` ana uygulama kabuğundan ayrılmış, yeni sekmede açılan bağımsız yayın
çalışma alanıdır. Uygulanan kapsam:

- nGazete okuyucusu ve Yayın Atölyesi boyunca korunan ortak koyu gazete kâğıdı
  yüzeyinde 30×40 sayı, sayfa ve alan seçimi; pointer/klavye ile yerleşim ve
  yeniden boyutlandırma;
- tek PNG/JPG/WebP kreatif yükleme, 8 MB sunucu sınırı ve zorunlu alt metin;
- kreatif ile seçili alan içinde CTA butonları; düzenleme ızgarası ve alan seçim
  çerçevesi olmadan temiz önizleme; taslak kaydetme, rezervasyon ve demo ödeme;
- standart hesapta bir CTA ve yalnızca nSosyal içi bağlantılar;
- 200 TL/ay olarak gösterilen demo Yayınevi aboneliğinde üç CTA, dış `https`
  bağlantıları, gradyan/hareket seçenekleri ve yüzde 5 alan indirimi;
- ödeme simülasyonu sonrası moderasyon kuyruğu; moderator/admin için onay,
  reddetme veya düzenleme isteme, audit kaydı ve kullanıcı bildirimi;
- onay anındaki kreatif, alt metin ve CTA görünümünün değişmez okuyucu kaydına
  alınması; gelecek tarihli sayının İstanbul saatiyle 06.00'dan önce doğrudan
  tarih bağlantısıyla da açılmaması ve eşik sonrasındaki ilk okumada yayımlanması;
- uzun süre çalışan demo sunucusunda yeni İstanbul gününün ilk okumada, mevcut
  kullanıcı mutasyonları sıfırlanmadan oluşturulması;
- yeni sayıya son yayımlanmış sayının yalnızca sponsorlu olmayan editoryal
  omurgasının kopyalanması; önceki günün sponsorlu yerleşimlerinin taşınmaması ve
  ücretli yerleşimin tek başına gazete oluşturmaması;
- ilk oturum kapağının 06.00'dan önce son yayımlanmış sayıyı, eşikten sonra yeni
  sayıyı göstermesi ve görülme kaydının takvim günü yerine sunulan sayı tarihine
  bağlanması.

Gerçek ödeme, faturalandırma ve Supabase Storage/RLS kalıcılığı uygulanmış değildir.
Abonelik etkinleştirme ve ödeme yalnızca yarışma prototipi akışını gösterir.

Sponsorlu alanlar ayrı `Ücretli alanlar` listesinin altında toplanmaz. Gazetenin grid'inde tanımlı spatial inventory satın alır ve açık `Sponsorlu` etiketi taşır.

Örnek envanter ölçüleri: `300x250`, `728x90`, `300x600`, `600x400`, `970x250`. Bunlar sabit zorunlu liste değildir. Responsive için `grid_column_span`, `grid_row_span` veya `aspect_ratio` da tutulur.

Pricing modeli açıklanabilir olmalıdır:

`price = base × area_factor × placement_factor × issue_count_or_duration × demand_factor × subscription_discount`

Tek issue, 4 issue, monthly/weekly recurring ve organization subscription gibi paketler desteklenebilir. Subscription sınırsız alan değildir, tanımlı size/placement/frequency hakkıdır.

Advertiser request en az creative image, alt text, target URL, requested size/grid area, placement, issue start/count, plan ve pricing snapshot taşımalıdır.

Reader UI'da `Gelir modeli nasıl çalışıyor?` gibi eğitim kartları yoktur. Ayrıntılar advertiser/admin/About/docs'ta yaşar.

## 12. Veri modeli hedefleri

Mevcut şemanın yanında aşağıdaki hedefler hesaba katılmalıdır:

- `profile_goals(profile_id, goal_key, weight, created_at)` veya eşdeğer açıklanabilir model;
- `newspaper_items`: image, alt, source/author, link, section, layout variant, grid spans, priority, sponsored metadata, placement, width/height, price snapshot, campaign;
- `ad_requests`: creative, alt, target, size, placement, issue range/count, subscription plan, pricing snapshot, organization/contact/status.

Migration gerektiğinde yeni migration ekle, geçmiş migration'ı değiştirme.

## 13. Güvenlik ve erişilebilirlik

- location optional, district finest user granularity;
- no exact/live individual location;
- RLS enabled and forced where appropriate;
- service-role server-only;
- moderator/admin routes server-authorized;
- keyboard operation + visible focus;
- accessible names and labelled errors;
- no colour-only state;
- reduced-motion tercihinde marka SMIL katmanının gizlenmesi ve nGazete ile Yayın
  Atölyesi sürekli dekoratif CSS animasyonlarının tamamen durması;
- video text/caption equivalent;
- map list equivalent;
- mobile touch targets and overflow verified.

## 14. Teknik stack

Next.js App Router + React + TypeScript + Tailwind, Supabase Postgres/Auth/Storage/RLS production path, `DemoStore` synthetic offline demo path, MapLibre + local GeoJSON, Vitest + Playwright + axe-core.

## 15. Test ve belge doğruluğu

README veya dokümanda test sayısı bulunabilir, ancak **testleri bu görevde gerçekten çalıştırmadıysan `passes` veya `all tests green` yazma**. Sayıyı test suite inventory olarak ifade et.

Critical E2E hedefleri:

- login/onboarding/profile goals
- feed
- N selector → Nerede density → region → time/event → reminder
- community join/resources + moderator approval
- Why → project
- project create + validated pitch upload
- like/save/comment/follow Server Action journeys + private `/saved` collection
- nGazete reader + spatial sponsored placement + advertiser request/admin approval
- location/privacy + accessibility states

## 16. Coding-agent çalışma kuralı

Kodlamadan önce:

1. İlgili mevcut ekranı ve kodu incele.
2. Üst kaynaklarla fark analizi yap.
3. Kısa plan ve değişecek dosyaları yaz.
4. İstenen kapsamı uygula.
5. Typecheck/lint/relevant tests çalıştır.
6. Görsel UI değişikliğini gerçek viewport'ta doğrula.
7. Çalıştırmadığın testi geçmiş gibi raporlama.

Ürün vizyonuyla mevcut implementasyon çelişiyorsa implementasyonu kaynak olarak kullanıp vizyonu değiştirme.
