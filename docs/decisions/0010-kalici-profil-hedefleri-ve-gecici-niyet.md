# 0010 - Kalıcı profil hedefleri ve geçici niyet

**Durum:** Kabul edildi

## Bağlam

İlk prototip personalization modelinde onboarding sırasında seçilen tek bir
`intentMode` önemli rol oynuyordu. Bu model, kullanıcının platformdan aynı anda
birden fazla şey bekleyebilmesini ve bu beklentilerin zaman içinde Settings
üzerinden değişebilmesini yeterince temsil etmiyor.

Örneğin aynı kullanıcı hem topluluk bulmak, hem öğrenmek, hem proje paylaşmak, hem
de gündelik teknoloji sohbeti görmek isteyebilir. Buna karşılık belirli bir
oturumda yalnızca etkinlik keşfetmek isteyebilir.

Bu iki ihtiyaç farklı zaman ölçekleridir.

## Karar

Personalization iki katmana ayrılır.

### 1. Kalıcı profil tercihleri

Profile'a bağlı ve Settings'ten düzenlenebilir:

- interests;
- long-term platform goals;
- content/feed preferences;
- location/privacy;
- notification preferences;
- accessibility preferences;
- nGazete preferences.

Örnek platform goals:

- socialize;
- meet_people;
- find_communities;
- discover_events;
- discover_projects;
- share_projects;
- find_collaborators;
- learn;
- find_resources;
- follow_developments;
- discover_local_ecosystem;
- find_institutions;
- discover_opportunities;
- casual_discussion;
- follow_creation_stories;
- discover_people.

Birden fazla goal aynı anda seçilebilir. Gerekirse weight veya priority tutulabilir.

Önerilen veri modeli:

```text
profile_goals
  profile_id
  goal_key
  weight
  created_at
```

### 2. Geçici niyet

`Sosyalleş`, `Keşfet`, `Öğren`, `Üret` gibi modlar kullanıcının **şu anda** ne
yapmak istediğini belirtir.

- profile goals'u değiştirmez;
- onboarding seçimiyle sonsuza kadar kilitlenmez;
- feed/discovery ranking'i geçici olarak yeniden ağırlıklandırabilir;
- kullanıcı hiçbir özel transient mode seçmeden normal personalized feed'i de
  kullanabilir.

## Onboarding

Onboarding profil tercihleri için başlangıç değerlerini toplar. Kullanıcının bu
seçimleri daha sonra değiştiremeyeceği izlenimi verilmez.

Onboarding en az interests, birkaç platform goal, optional location/privacy ve
başlangıç current-intent tercihini alabilir. Product kullanımını hızlandırmak için
bazı adımlar skip edilebilir.

## Settings

Settings en az şu bölümleri ayrı kontrol eder:

1. İlgi alanları.
2. Platform amaçları.
3. Akış ve içerik tercihleri.
4. Konum ve gizlilik.
5. Bildirimler.
6. Erişilebilirlik.
7. nGazete tercihleri.

## Ranking etkisi

Long-term goal/preference match kalıcı personalization signal'dır. Transient intent
ise current task için geçici signal veya weight redistribution uygular.

Bu karar mevcut fixed ranking weights'i ürün gerçeği yapmaz. Exact weights test ve
ölçümle değişebilir.

## Sonuçlar

- Kullanıcı platformdan birden fazla beklentiyi aynı anda ifade edebilir.
- Current task ile long-term identity birbirine karışmaz.
- Settings gerçek personalization control surface olur.
- Onboarding geri döndürülemez product configuration olmaktan çıkar.

## Değerlendirilen alternatifler

- Tek permanent intent: reddedildi, çok boyutlu kullanıcı beklentisini temsil
  etmiyor.
- Sadece topic interests: reddedildi, `neyle ilgileniyorum` ile `platformda ne
  yapmak istiyorum` aynı şey değil.
- Tamamen behavior-based black-box personalization: prototype aşamasında
  açıklanabilirlik ve veri doğrulaması yetersiz.
