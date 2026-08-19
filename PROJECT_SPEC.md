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
- filtreler: topic, entity/metric, time range, participation/online-hybrid gibi gerekli bağlamlar;
- seçilebilir metrikler en az communities, events, projects, institutions ve uygun olduğunda people/posts/resources/opportunities;
- il seçilince bölge detay paneli açılır;
- ilçe verisi olan bölgelerde aynı mimari ilçe düzeyine iner;
- kullanıcı kendi konumunu paylaşmadan haritayı keşfedebilir;
- bireysel kesin koordinat veya canlı konum gösterilmez;
- haritadaki sonuçların erişilebilir liste eşdeğeri vardır.

Yoğunluk nüfus değildir. Seçili platform varlıklarının sayısı veya normalize edilmiş skoru üzerinden hesaplanır. Renk tek başına state taşımamalıdır.

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
- notifications, search/saved, profile/settings
- moderation/admin

### P1

- gelişmiş arama
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

Pitch video max 90 saniye olacaksa bu sınır client ve server tarafında gerçek olarak uygulanmalıdır. Upload validation başarısızsa yarım project kaydı bırakmama ve retry'da duplicate project üretmeme davranışı ayrıca test edilmelidir.

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
- reduced motion;
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
