import type { Resource } from '@/types/domain';
import { communityId } from './communities';
import { uid } from './ids';
import { profileId } from './profiles';
import { topicId, type TopicSlug } from './topics';

/**
 * "Nasil" kaynaklari (PROJECT_SPEC 7.7).
 *
 * Bu bir kurs platformu degildir. Her kayit, bir toplulugun kendi deneyiminden
 * urettigi kisa bir rehber, kontrol listesi veya derlemedir. Moderator
 * dogrulamasi yalnizca yetkili islemle degisir.
 */

export const resourceId = (slug: string) => uid('resource', slug);

interface ResourceInput {
  slug: string;
  title: string;
  summary: string;
  type: Resource['type'];
  level: Resource['level'];
  minutes: number;
  community: string;
  author: string;
  topics: TopicSlug[];
  verified?: boolean;
  url?: string;
  body?: string;
  daysAgo: number;
}

const RESOURCES: ResourceInput[] = [
  {
    slug: 'akademik-makale-okuma',
    title: 'Akademik makale okumaya başlangıç',
    summary:
      'Bir makaleyi baştan sona okumadan önce hangi bölümlere hangi sırayla bakmalı? Özet, şekiller, yöntem ve sınırlılıklar için pratik bir sıra.',
    type: 'rehber',
    level: 'baslangic',
    minutes: 12,
    community: 'biyoteknoloji',
    author: 'zeynep.bio',
    topics: ['biyoteknoloji'],
    verified: true,
    body: '1) Başlık ve özeti oku, ne iddia ediliyor not al. 2) Şekillere bak, veri iddiayı destekliyor mu? 3) Yöntemi tara, tekrar üretilebilir mi? 4) Sınırlılıklar bölümünü mutlaka oku. 5) En son giriş bölümüne dön. İlk okumada her cümleyi anlamak zorunda değilsin.',
    daysAgo: 120,
  },
  {
    slug: 'laboratuvar-guvenlik-kontrol-listesi',
    title: 'Laboratuvara ilk giriş güvenlik kontrol listesi',
    summary: 'Lise ve lisans öğrencileri için deney öncesi 10 maddelik güvenlik kontrolü.',
    type: 'kontrol_listesi',
    level: 'baslangic',
    minutes: 5,
    community: 'lise-biyoteknoloji',
    author: 'zeynep.bio',
    topics: ['biyoteknoloji'],
    verified: true,
    body: 'Önlük ve gözlük takıldı mı? Göz duşu ve yangın söndürücü nerede biliyor musun? Kullanacağın maddenin güvenlik bilgi formunu okudun mu? Atık kutuları ayrıldı mı? Yalnız çalışmıyorsun, değil mi?',
    daysAgo: 96,
  },
  {
    slug: 'model-roket-guvenlik',
    title: 'Model roket güvenlik kuralları ve saha seçimi',
    summary: 'Ateşleme mesafesi, rüzgâr sınırı, kurtarma sistemi kontrolü ve izin gereken durumlar.',
    type: 'rehber',
    level: 'baslangic',
    minutes: 15,
    community: 'izmir-havacilik',
    author: 'kaan.roket',
    topics: ['havacilik-uzay'],
    verified: true,
    body: 'Ateşleme en az 15 m mesafeden ve elektrikli tetikleyiciyle yapılır. Rüzgâr 20 km/s üzerindeyse uçuş ertelenir. Kurtarma sistemi her uçuş öncesi elle test edilir. Yerleşim yerine yakın alanlarda uçuş yapılmaz ve gerekli izinler önceden alınır.',
    daysAgo: 74,
  },
  {
    slug: 'itki-egrisi-okuma',
    title: 'İtki eğrisi nasıl okunur?',
    summary: 'Tepe itki, toplam impuls ve yanma süresi arasındaki farkı bir grafik üzerinden anlatan kısa rehber.',
    type: 'rehber',
    level: 'orta',
    minutes: 10,
    community: 'izmir-havacilik',
    author: 'kaan.roket',
    topics: ['havacilik-uzay', 'robotik'],
    body: 'Tepe itki bir andır, toplam impuls ise eğrinin altındaki alandır. İki motor aynı tepe itkiyi verip çok farklı irtifalar üretebilir. Katalog değeri her zaman ölçtüğünüzle aynı çıkmaz; kendi eğrinizi çizin.',
    daysAgo: 28,
  },
  {
    slug: 'klavye-ile-test',
    title: 'Arayüzünü klavyeyle test etmek: 15 dakikalık tur',
    summary: 'Fareyi bırak, Tab ile gez. Odak görünüyor mu, sıra mantıklı mı, tuzağa düşüyor musun?',
    type: 'kontrol_listesi',
    level: 'baslangic',
    minutes: 15,
    community: 'erisilebilir-arayuz',
    author: 'nazli.tasarim',
    topics: ['tasarim-urun'],
    verified: true,
    body: 'Tab ile tüm etkileşimli öğelere ulaşabiliyor musun? Odak göstergesi her zaman görünüyor mu? Modal açıldığında odak içeride kalıyor mu ve Esc kapatıyor mu? Atlama bağlantısı var mı? Sıra görsel düzenle uyuşuyor mu?',
    daysAgo: 63,
  },
  {
    slug: 'ekran-okuyucu-baslangic',
    title: 'Ekran okuyucuyla ilk 30 dakika',
    summary: 'NVDA ve VoiceOver için temel kısayollar ve kendi arayüzünü dinlerken nelere dikkat edilmeli.',
    type: 'video',
    level: 'baslangic',
    minutes: 25,
    community: 'erisilebilir-arayuz',
    author: 'nazli.tasarim',
    topics: ['tasarim-urun'],
    url: 'https://ornek.nsosyal.demo/kaynak/ekran-okuyucu',
    daysAgo: 45,
  },
  {
    slug: 'turkce-veri-temizleme',
    title: 'Türkçe metin verisi temizlerken sık yapılan 6 hata',
    summary: 'Büyük-küçük harf dönüşümü, ekler, birleşik kelimeler ve noktalama üzerine pratik notlar.',
    type: 'rehber',
    level: 'orta',
    minutes: 18,
    community: 'turkce-nlp',
    author: 'ayse.veri',
    topics: ['yapay-zeka'],
    verified: true,
    body: 'toLowerCase() Türkçede "I" harfini bozar, yerelleştirilmiş dönüşüm kullanın. Kök bulma ile gövde bulma aynı şey değildir. Noktalama silmek soru cümlelerini bozabilir. Emoji ve URL’leri silmeden önce görevinizi düşünün.',
    daysAgo: 150,
  },
  {
    slug: 'degerlendirme-olcutu-secimi',
    title: 'Doğru değerlendirme ölçütünü seçmek',
    summary: 'Ölçüt görevi temsil etmiyorsa modeliniz iyileşiyor gibi görünürken kötüleşebilir.',
    type: 'soru_cevap',
    level: 'ileri',
    minutes: 20,
    community: 'turkce-nlp',
    author: 'ayse.veri',
    topics: ['yapay-zeka'],
    body: 'S: Puanım yükseliyor ama çıktılar kötü. Neden? C: Ölçütünüz muhtemelen yüzeysel örtüşmeyi ödüllendiriyor. Küçük bir insan değerlendirme kümesi tutun ve otomatik ölçütle korelasyonunu düzenli kontrol edin.',
    daysAgo: 88,
  },
  {
    slug: 'ctf-ilk-hafta',
    title: 'CTF’e başlarken ilk hafta ne yapmalı?',
    summary: 'Yalnızca yasal ve izinli platformlarda ilerleyen, sıralı bir başlangıç planı.',
    type: 'rehber',
    level: 'baslangic',
    minutes: 30,
    community: 'ctf-baslangic',
    author: 'emre.guvenlik',
    topics: ['siber-guvenlik'],
    verified: true,
    body: 'Gün 1-2: temel Linux ve ağ kavramları. Gün 3-4: kodlama/çözme ve basit tersine mühendislik. Gün 5-7: izinli bir eğitim platformunda 5 kolay soru ve her biri için kendi çözüm notunu yaz. Gerçek sistemlere asla dokunma.',
    daysAgo: 110,
  },
  {
    slug: 'guvenli-yazilim-kontrol',
    title: 'Küçük projeler için güvenli yazılım kontrol listesi',
    summary: 'Gizli anahtar yönetimi, girdi doğrulama, bağımlılık taraması ve yetki kontrolü.',
    type: 'kontrol_listesi',
    level: 'orta',
    minutes: 12,
    community: 'siber-guvenlik',
    author: 'emre.guvenlik',
    topics: ['siber-guvenlik'],
    body: 'Anahtarlar depoda mı? Girdiler sunucu tarafında da doğrulanıyor mu? Yetki kontrolü yalnızca arayüzde mi yapılıyor? Bağımlılıklar güncel mi? Hata mesajları iç detay sızdırıyor mu?',
    daysAgo: 57,
  },
  {
    slug: 'lora-menzil-notlari',
    title: 'LoRa menzil testi saha notları',
    summary: 'Anten yüksekliği, gövde malzemesi ve yayılma faktörünün menzile etkisi üzerine ölçüm notları.',
    type: 'rehber',
    level: 'orta',
    minutes: 14,
    community: 'surdurulebilirlik',
    author: 'onur.enerji',
    topics: ['surdurulebilirlik', 'robotik'],
    body: 'Anteni 2 metre yükseltmek menzili neredeyse iki katına çıkardı. Metal kutu menzili yarıya düşürdü. Yayılma faktörünü artırmak menzili uzatır ama pil ömrünü kısaltır; ölçüm aralığınıza göre seçin.',
    daysAgo: 40,
  },
  {
    slug: 'ges-oncesi-kontrol',
    title: 'Çatı GES kurulumundan önce 8 kontrol',
    summary: 'Çatı taşıma kapasitesi, gölgelenme analizi, yönelim, mevzuat ve sayaç konuları.',
    type: 'kontrol_listesi',
    level: 'baslangic',
    minutes: 10,
    community: 'ege-gunes-enerjisi',
    author: 'onur.enerji',
    topics: ['surdurulebilirlik'],
    verified: true,
    body: 'Çatının statik raporu var mı? Gün içi gölgelenme ölçüldü mü? Panel yönelimi ve eğimi hesaplandı mı? Şebeke bağlantı izni süreci başlatıldı mı? Bakım erişimi düşünüldü mü?',
    daysAgo: 35,
  },
  {
    slug: 'jam-postmortem',
    title: 'Game jam sonrası post-mortem nasıl yazılır?',
    summary: 'Ne işe yaradı, ne yaramadı, bir daha ne yapmayız. 30 dakikada yazılabilen bir şablon.',
    type: 'rehber',
    level: 'baslangic',
    minutes: 8,
    community: 'game-jam-ege',
    author: 'selin.oyun',
    topics: ['oyun-gelistirme'],
    body: 'Üç başlık yeter: İşe yarayanlar, tıkandığımız yerler, bir dahakine kural. Şablonu jam biter bitmez doldurun; bir hafta sonra ayrıntılar kayboluyor.',
    daysAgo: 22,
  },
  {
    slug: 'simulasyondan-gercege',
    title: 'Simülasyondan gerçeğe geçerken başarım neden düşer?',
    summary: 'Alan farkı, sensör gürültüsü ve veri artırma stratejileri üzerine derleme.',
    type: 'soru_cevap',
    level: 'ileri',
    minutes: 22,
    community: 'otonom-arac-takimlari',
    author: 'mert.kod',
    topics: ['robotik', 'yapay-zeka'],
    body: 'S: Simülasyonda %95, pistte %60. Ne yapmalı? C: Önce farkı ölçün: hangi sınıflarda düşüyor? Genellikle ışık, doku ve sensör gürültüsü. Rastgeleleştirilmiş doku ve ışıkla eğitim, ardından küçük gerçek veri ile ince ayar en hızlı kazanç.',
    daysAgo: 30,
  },
  {
    slug: 'ilk-pitch-videosu',
    title: 'İlk 60 saniyelik pitch videonu çekerken',
    summary: 'Problem, çözüm, kanıt ve çağrı. Telefon kamerasıyla yeterli, önemli olan sıralama.',
    type: 'video',
    level: 'baslangic',
    minutes: 9,
    community: 'tasarim-urun',
    author: 'nazli.tasarim',
    topics: ['tasarim-urun'],
    url: 'https://ornek.nsosyal.demo/kaynak/pitch',
    daysAgo: 17,
  },
];

export function buildResources(now: Date): Resource[] {
  return RESOURCES.map((input) => ({
    id: resourceId(input.slug),
    title: input.title,
    summary: input.summary,
    type: input.type,
    level: input.level,
    estimatedMinutes: input.minutes,
    url: input.url ?? null,
    body: input.body ?? null,
    communityId: communityId(input.community),
    authorId: profileId(input.author),
    topicIds: input.topics.map(topicId),
    verificationStatus: input.verified ? 'moderator_verified' : 'community',
    createdAt: new Date(now.getTime() - input.daysAgo * 86_400_000).toISOString(),
  }));
}

export const RESOURCE_SLUGS = RESOURCES.map((r) => r.slug);
