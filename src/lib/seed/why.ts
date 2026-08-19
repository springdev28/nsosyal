import type { WhyStory } from '@/types/domain';
import { communityId } from './communities';
import { uid } from './ids';
import { profileId } from './profiles';
import { projectId } from './projects';
import { topicId, type TopicSlug } from './topics';

/**
 * "Neden" panosu seed verisi (PROJECT_SPEC 7.6).
 *
 * Bu bir motivasyon sozu duvari DEGILDIR. Sorulan soru sudur:
 * "Seni bu ise, projeye, alana veya basariya ne goturdu?"
 * Her hikaye somut bir deneyim, problem veya donum noktasi anlatir.
 */

export const whyStoryId = (slug: string) => uid('why', slug);

interface WhyInput {
  slug: string;
  author: string;
  title: string;
  body: string;
  linkedType: WhyStory['linkedEntityType'];
  /** Proje slug'i, profil kullanici adi veya topluluk slug'i. */
  linkedKey: string | null;
  topics: TopicSlug[];
  provinceCode: string | null;
  daysAgo: number;
  featured?: boolean;
  /** Video ile anlatilan hikayeler kisa video akisinda da gorunur. */
  hasVideo?: boolean;
  visibility?: WhyStory['visibility'];
}

export const WHY_STORIES: WhyInput[] = [
  {
    slug: 'ruzgar-olcer-nedeni',
    author: 'baran.demo',
    title: 'Bu projeye neden başladım: cevaplayamadığımız bir soru',
    body: 'Komşumuz çatısına küçük bir rüzgâr türbini kurmak istedi ve bize "burada rüzgâr var mı?" diye sordu. Hiçbirimiz cevap veremedik. En yakın meteoroloji istasyonu 14 km uzaktaydı ve o verinin bizim sokağımızla ilgisi yoktu. O akşam eve dönerken şunu düşündüm: bir şeyi ölçemiyorsak, onun hakkında konuşurken aslında tahmin yürütüyoruz. Rüzgâr ölçeri, o soruya "bilmiyorum" demek zorunda kalmamak için yapmaya başladım. Üç kez baştan tasarladım, iki kez rulman yüzünden durdu. Şimdi Konak’taki bir çatıda üç haftadır kesintisiz veri topluyor ve komşumuz artık kendi sayısına bakıyor.',
    linkedType: 'project',
    linkedKey: 'ruzgar-olcer',
    topics: ['surdurulebilirlik', 'robotik'],
    provinceCode: '35',
    daysAgo: 12,
    featured: true,
    hasVideo: true,
  },
  {
    slug: 'basarisiz-deney-arsivi',
    author: 'zeynep.bio',
    title: 'Üç ayımı geri istemiyorum, sadece kimse kaybetmesin',
    body: 'Yüksek lisansın ilk yılında bir protokolü üç ay boyunca tekrarladım ve her seferinde aynı yerde tıkandım. Sonradan öğrendim ki bir önceki dönem başka bir öğrenci aynı şeyi yaşamış. Kimse yazmamıştı, çünkü "başarısız" sonuçlar kaydedilmeye değer görülmüyordu. Beni biyoteknolojide bir araç yazmaya iten şey merak değil, o üç ayın boşa gitmesiydi. Açık laboratuvar günlüğünde en çok kullanılan filtrenin "başarısız" etiketi olması, bu hissin yalnız bana ait olmadığını gösteriyor.',
    linkedType: 'project',
    linkedKey: 'laboratuvar-gunlugu',
    topics: ['biyoteknoloji'],
    provinceCode: '34',
    daysAgo: 26,
    featured: true,
  },
  {
    slug: 'olcmedigimiz-sey',
    author: 'kaan.roket',
    title: 'İlk roketimiz neden yarı yükseklikte kaldı?',
    body: 'Hedefimiz 400 metreydi, 190 metrede tepe yaptık. İki hafta boyunca aerodinamiği tartıştık, gövdeyi suçladık. Sonra biri sordu: motorun gerçek itkisini ölçtük mü? Ölçmemiştik. Katalog değerine güvenmiştik. O gün defterime "ölçmediğimiz şeyi tartışıyoruz" diye yazdım. İtki test standı o cümleden çıktı. Şimdi her motoru ateşlemeden önce kendi eğrimizi çiziyoruz ve tartışmalarımız çok daha kısa sürüyor.',
    linkedType: 'project',
    linkedKey: 'model-roket-itki',
    topics: ['havacilik-uzay'],
    provinceCode: '35',
    daysAgo: 33,
    hasVideo: true,
  },
  {
    slug: 'arkadasimin-kardesi',
    author: 'selin.oyun',
    title: 'Yaptığımız oyunu oynayamayan ilk kişi',
    body: '48 saatlik bir jam sonunda oyunumuzu arkadaşlarıma gösterdim. Arkadaşımın az gören kardeşi oynamak istedi ve menüde kayboldu. Yazılar küçüktü, odak göstergesi yoktu, renk dışında hiçbir ipucu vermemiştik. O ana kadar erişilebilirliği "vakit kalırsa yapılacak" bir iş sanıyordum. O akşam, oyunun kendisinin değil menünün engel olduğunu gördüm. Şimdi her projeye menüden başlıyorum.',
    linkedType: 'project',
    linkedKey: 'erisilebilir-oyun-menusu',
    topics: ['oyun-gelistirme', 'tasarim-urun'],
    provinceCode: '35',
    daysAgo: 19,
    featured: true,
    hasVideo: true,
  },
  {
    slug: 'kirk-saniye',
    author: 'burak.uav',
    title: 'GPS’in kaybolduğu kırk saniye',
    body: 'Test uçuşunda telemetride GPS kayboldu. Uçak havadaydı, biz yerdeydik ve hiçbirimiz onun nereye gittiğini bilmiyorduk. Kırk saniye sürdü. Sinyal geri geldiğinde herkes güldü ama ben o geceyi uyuyamadım. Tek bir sinyale bağımlı olmanın ne demek olduğunu anlatan bir ders kitabı okumamıştım; kırk saniyede öğrendim. Görsel iniş yardımcısı o korkunun ürünü.',
    linkedType: 'project',
    linkedKey: 'iha-inis-yardimcisi',
    topics: ['havacilik-uzay', 'yapay-zeka'],
    provinceCode: '06',
    daysAgo: 41,
  },
  {
    slug: 'olcut-yanlissa',
    author: 'ayse.veri',
    title: 'Puanlar yükseliyordu ama özetler kötüydü',
    body: 'Bir Türkçe özetleme modelini geliştiriyordum ve ölçüt puanı her hafta artıyordu. Bir gün çıktıları oturup okudum: özetler anlamsızdı. Ölçüt İngilizce için tasarlanmıştı ve Türkçenin yapısını görmüyordu. O gün modeli iyileştirmeyi bırakıp ölçmeyi düzeltmeye karar verdim. Yanlış ölçüt, insanı emin adımlarla yanlış yere götürüyor.',
    linkedType: 'project',
    linkedKey: 'turkce-ozetleme-seti',
    topics: ['yapay-zeka'],
    provinceCode: '34',
    daysAgo: 55,
  },
  {
    slug: 'kopyala-yapistir-yil',
    author: 'emre.guvenlik',
    title: 'Bir yılımı kopyala-yapıştır ile geçirdim',
    body: 'Güvenliğe başlarken bana bir site adresi verip "kır bakalım" dediler. Çözümleri buldum, yapıştırdım, bayrağı aldım. Ne öğrendiğimi soran olsa cevap veremezdim. Bir yıl böyle geçti. Sonra sıfırdan, sırayla ve nedenini anlayarak çalışmaya başladım ve altı ayda çok daha ileri gittim. Yol haritasını, benim kaybettiğim o yılı kimse kaybetmesin diye yazdım.',
    linkedType: 'project',
    linkedKey: 'ctf-yol-haritasi',
    topics: ['siber-guvenlik'],
    provinceCode: '34',
    daysAgo: 62,
  },
  {
    slug: 'dedemin-serasi',
    author: 'onur.enerji',
    title: 'Dedemin serasında iki yıl üst üste yanıldık',
    body: 'Bir yıl fazla suladık, kökler çürüdü. Ertesi yıl korkup az suladık, verim düştü. Dedem kırk yıllık üreticiydi ve yine de tahmin ediyordu, çünkü elinde sayı yoktu. Tecrübe, ölçüm olmadığında bir yere kadar taşıyor. Sera sensör ağını, o iki yılın tekrar etmemesi için kurmaya başladım.',
    linkedType: 'project',
    linkedKey: 'sera-sensor-agi',
    topics: ['surdurulebilirlik'],
    provinceCode: '35',
    daysAgo: 29,
  },
  {
    slug: 'simulasyon-yalan-soyledi',
    author: 'mert.kod',
    title: 'Simülasyonda mükemmeldik, pistte kaybolduk',
    body: 'Yarışma öncesi haftalarca simülasyonda çalıştık, model neredeyse hiç hata yapmıyordu. Piste çıktığımızda tabelaları tanıyamadı. Simülasyondaki işaretler bizim yollarımızdakine benzemiyordu. O gün anladım ki gerçeğe benzemeyen bir simülasyon sadece zaman kaybettirmez, insana yanlış bir güven verir. Türkiye yollarına benzeyen bir sahne yapmaya böyle başladım.',
    linkedType: 'project',
    linkedKey: 'otonom-simulasyon',
    topics: ['robotik', 'yapay-zeka'],
    provinceCode: '06',
    daysAgo: 47,
  },
  {
    slug: 'ekran-okuyucu-ilk-kez',
    author: 'nazli.tasarim',
    title: 'Kendi tasarımımı ilk kez gözlerim kapalı dinledim',
    body: 'Bir eğitimde ekran okuyucuyu açıp kendi tasarladığım formu doldurmayı denedim. Üç dakika sonra vazgeçtim; hata mesajının hangi alana ait olduğunu anlayamadım. Kendi işimi kullanamamak beni utandırmadı, şaşırttı. O günden sonra her tasarımı önce klavyeyle, sonra sesle deniyorum. Erişilebilir Arayüz Kulübü’nü de aynı deneyimi yaşatmak için kurduk.',
    linkedType: 'community',
    linkedKey: 'erisilebilir-arayuz',
    topics: ['tasarim-urun'],
    provinceCode: '35',
    daysAgo: 38,
    featured: true,
  },
  {
    slug: 'lise-merak',
    author: 'irem.lise',
    title: 'Mikroskopta ilk kez kendi hücremi gördüğümde',
    body: 'Okulda yanak epiteli örneğine baktığımız gün, o güne kadar kitapta gördüğüm şeyin gerçekten var olduğunu ilk kez hissettim. Garip ama o ana kadar biyoloji benim için sadece sınav konusuydu. Şimdi biyoteknoloji okumak istiyorum ve platformda çok soru soruyorum çünkü sormaya utandığım her şey beni yavaşlatıyor.',
    linkedType: 'profile',
    linkedKey: 'irem.lise',
    topics: ['biyoteknoloji'],
    provinceCode: '35',
    daysAgo: 8,
  },
  {
    slug: 'gokyuzu-kasabasi',
    author: 'ece.uzay',
    title: 'Şehir ışığı olmayan bir kasabada büyümek',
    body: 'Büyüdüğüm kasabada sokak lambası azdı ve gökyüzü inanılmaz açıktı. Şehre taşındığımda aynı gökyüzünü göremeyince ilk kez "kaybettiğim bir şey var" diye düşündüm. Astrofiziğe yönelmem büyük bir keşif anıyla değil, o eksiklik hissiyle başladı. Gözlem geceleri düzenlememin sebebi de bu: bir kere görenler kolay kolay vazgeçmiyor.',
    linkedType: 'community',
    linkedKey: 'gece-gokyuzu',
    topics: ['havacilik-uzay'],
    provinceCode: null,
    daysAgo: 15,
    hasVideo: true,
  },
];

function linkedIdFor(input: WhyInput): string | null {
  if (!input.linkedKey) return null;
  if (input.linkedType === 'project') return projectId(input.linkedKey);
  if (input.linkedType === 'community') return communityId(input.linkedKey);
  if (input.linkedType === 'profile') return profileId(input.linkedKey);
  return null;
}

export function buildWhyStories(now: Date): WhyStory[] {
  return WHY_STORIES.map((input) => ({
    id: whyStoryId(input.slug),
    authorId: profileId(input.author),
    title: input.title,
    body: input.body,
    mediaId: input.hasVideo ? uid('media', `why-${input.slug}`) : null,
    linkedEntityType: input.linkedType,
    linkedEntityId: linkedIdFor(input),
    topicIds: input.topics.map(topicId),
    provinceCode: input.provinceCode,
    visibility: input.visibility ?? 'public',
    featured: Boolean(input.featured),
    createdAt: new Date(now.getTime() - input.daysAgo * 86_400_000).toISOString(),
  }));
}
