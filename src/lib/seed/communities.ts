import type { Community, CommunityApplication, CommunityMember } from '@/types/domain';
import { uid } from './ids';
import { profileId } from './profiles';
import { topicId, type TopicSlug } from './topics';

/**
 * Topluluk seed verisi (PROJECT_SPEC 7.3).
 *
 * Kok topluluklar platform moderatorlerince acilir ve kalici navigasyon
 * dugumleridir. Dal topluluklar kullanici basvurusu + moderator onayiyla olusur;
 * seed icinde hem onaylanmis dal topluluklar hem de moderator ekraninda
 * incelenecek bekleyen basvurular bulunur.
 */

export const communityId = (slug: string) => uid('community', slug);

interface RootInput {
  slug: string;
  name: string;
  description: string;
  topic: TopicSlug;
  emoji: string;
  memberCount: number;
}

const ROOTS: RootInput[] = [
  {
    slug: 'yapay-zeka',
    name: 'Yapay Zekâ',
    description:
      'Modeller, veri setleri, uygulamalar ve "bu neden böyle çalışıyor?" soruları. Hem gündelik sohbet hem derin teknik tartışma burada.',
    topic: 'yapay-zeka',
    emoji: '🧠',
    memberCount: 4820,
  },
  {
    slug: 'havacilik-uzay',
    name: 'Havacılık ve Uzay',
    description: 'İHA, model roket, uydu ve aviyonik. Uçan, düşen ve tekrar uçan her şey.',
    topic: 'havacilik-uzay',
    emoji: '🚀',
    memberCount: 3960,
  },
  {
    slug: 'biyoteknoloji',
    name: 'Biyoteknoloji',
    description: 'Laboratuvar yöntemleri, biyomedikal cihazlar, makale okuma ve deney günlükleri.',
    topic: 'biyoteknoloji',
    emoji: '🧬',
    memberCount: 2740,
  },
  {
    slug: 'robotik',
    name: 'Robotik',
    description: 'Mekatronik, gömülü sistemler, otonom araçlar ve yarışma hazırlıkları.',
    topic: 'robotik',
    emoji: '🤖',
    memberCount: 5310,
  },
  {
    slug: 'siber-guvenlik',
    name: 'Siber Güvenlik',
    description: 'CTF, güvenli yazılım, ağ güvenliği ve mahremiyet. Zararlı içerik yok, öğrenme var.',
    topic: 'siber-guvenlik',
    emoji: '🛡️',
    memberCount: 3180,
  },
  {
    slug: 'oyun-gelistirme',
    name: 'Oyun Geliştirme',
    description: 'Oyun motoru, tasarım, teknik sanat ve game jam kültürü.',
    topic: 'oyun-gelistirme',
    emoji: '🎮',
    memberCount: 4110,
  },
  {
    slug: 'surdurulebilirlik',
    name: 'Sürdürülebilirlik',
    description: 'Yenilenebilir enerji, iklim teknolojileri, atık ve döngüsel tasarım.',
    topic: 'surdurulebilirlik',
    emoji: '🌱',
    memberCount: 2290,
  },
  {
    slug: 'tasarim-urun',
    name: 'Tasarım ve Ürün',
    description: 'Arayüz, erişilebilirlik, kullanıcı araştırması ve prototipleme.',
    topic: 'tasarim-urun',
    emoji: '🎨',
    memberCount: 3520,
  },
];

interface BranchInput {
  slug: string;
  name: string;
  description: string;
  parent: string;
  topic: TopicSlug;
  emoji: string;
  scope: Community['scope'];
  provinceCode: string | null;
  districtCode: string | null;
  audience: string;
  createdBy: string;
  memberCount: number;
  daysAgo: number;
  rules?: string[];
}

const DEFAULT_RULES = [
  'Sorular aptalca değildir; yeni başlayanlara alan açın.',
  'Bitmemiş ve başarısız denemeler paylaşılabilir.',
  'Reklam ve satış içeriği topluluk akışında değil, nGazete ilanlarında yer alır.',
];

const BRANCHES: BranchInput[] = [
  {
    slug: 'izmir-havacilik',
    name: 'İzmir Havacılık Meraklıları',
    description:
      'İzmir ve çevresinde model uçak, roket ve İHA ile uğraşanların buluşma noktası. Aylık saha uçuşu düzenliyoruz.',
    parent: 'havacilik-uzay',
    topic: 'havacilik-uzay',
    emoji: '🛩️',
    scope: 'local',
    provinceCode: '35',
    districtCode: '35-07',
    audience: 'Genel',
    createdBy: 'kaan.roket',
    memberCount: 412,
    daysAgo: 180,
  },
  {
    slug: 'lise-biyoteknoloji',
    name: 'Lise Öğrencileri için Biyoteknoloji',
    description:
      'Lise seviyesinde biyoteknolojiye giriş. Basitleştirilmiş kaynaklar, güvenli deney önerileri ve üniversite tercih sohbetleri.',
    parent: 'biyoteknoloji',
    topic: 'biyoteknoloji',
    emoji: '🔬',
    scope: 'national',
    provinceCode: null,
    districtCode: null,
    audience: 'Lise öğrencisi',
    createdBy: 'zeynep.bio',
    memberCount: 736,
    daysAgo: 240,
    rules: [
      'Laboratuvar güvenliği olmadan deney tarifi paylaşılmaz.',
      'Kaynak paylaşırken seviye etiketi ekleyin.',
      'Yeni başlayan sorularına küçümseyici yanıt verilmez.',
    ],
  },
  {
    slug: 'izmir-yazilim-bulusmalari',
    name: 'İzmir Yazılım Buluşmaları',
    description: 'Konak ve Bornova çevresinde aylık yazılım buluşmaları, sunum çağrıları ve iş birliği duyuruları.',
    parent: 'tasarim-urun',
    topic: 'tasarim-urun',
    emoji: '💻',
    scope: 'local',
    provinceCode: '35',
    districtCode: '35-21',
    audience: 'Genel',
    createdBy: 'nazli.tasarim',
    memberCount: 890,
    daysAgo: 300,
  },
  {
    slug: 'erisilebilir-arayuz',
    name: 'Erişilebilir Arayüz Kulübü',
    description:
      'WCAG, ekran okuyucu testleri, klavye navigasyonu ve kapsayıcı tasarım. Her ay bir arayüzü birlikte denetliyoruz.',
    parent: 'tasarim-urun',
    topic: 'tasarim-urun',
    emoji: '♿',
    scope: 'online',
    provinceCode: null,
    districtCode: null,
    audience: 'Tasarımcı ve geliştirici',
    createdBy: 'nazli.tasarim',
    memberCount: 524,
    daysAgo: 150,
  },
  {
    slug: 'turkce-nlp',
    name: 'Türkçe Doğal Dil İşleme',
    description: 'Türkçe veri setleri, morfoloji, değerlendirme ölçütleri ve açık kaynak model çalışmaları.',
    parent: 'yapay-zeka',
    topic: 'yapay-zeka',
    emoji: '🔤',
    scope: 'online',
    provinceCode: null,
    districtCode: null,
    audience: 'Orta ve ileri seviye',
    createdBy: 'ayse.veri',
    memberCount: 1310,
    daysAgo: 400,
  },
  {
    slug: 'ege-gunes-enerjisi',
    name: 'Ege Güneş Enerjisi Ağı',
    description: 'Ege bölgesinde çatı GES kurulumları, ölçüm verileri, mevzuat ve kooperatif deneyimleri.',
    parent: 'surdurulebilirlik',
    topic: 'surdurulebilirlik',
    emoji: '☀️',
    scope: 'local',
    provinceCode: '35',
    districtCode: '35-30',
    audience: 'Genel',
    createdBy: 'onur.enerji',
    memberCount: 268,
    daysAgo: 120,
  },
  {
    slug: 'game-jam-ege',
    name: 'Game Jam Ege',
    description: 'Ege bölgesindeki game jamler, takım arama ilanları ve jam sonrası post-mortem paylaşımları.',
    parent: 'oyun-gelistirme',
    topic: 'oyun-gelistirme',
    emoji: '🕹️',
    scope: 'local',
    provinceCode: '35',
    districtCode: '35-17',
    audience: 'Genel',
    createdBy: 'selin.oyun',
    memberCount: 341,
    daysAgo: 90,
  },
  {
    slug: 'ctf-baslangic',
    name: 'CTF Başlangıç Kampı',
    description: 'Sıfırdan CTF öğrenenler için haftalık soru çözümü ve yol haritası. Saldırı değil, savunma odaklı.',
    parent: 'siber-guvenlik',
    topic: 'siber-guvenlik',
    emoji: '🚩',
    scope: 'online',
    provinceCode: null,
    districtCode: null,
    audience: 'Başlangıç',
    createdBy: 'emre.guvenlik',
    memberCount: 655,
    daysAgo: 210,
    rules: [
      'Yalnızca izinli ortamlarda ve yasal yarışmalarda çalışın.',
      'Gerçek sistemlere yönelik saldırı içeriği paylaşılmaz.',
      'Çözümleri yarışma bitmeden paylaşmayın.',
    ],
  },
  {
    slug: 'otonom-arac-takimlari',
    name: 'Otonom Araç Takımları',
    description: 'Üniversite otonom araç takımları için sensör füzyonu, simülasyon ve yarışma hazırlığı.',
    parent: 'robotik',
    topic: 'robotik',
    emoji: '🚗',
    scope: 'national',
    provinceCode: null,
    districtCode: null,
    audience: 'Üniversite takımları',
    createdBy: 'mert.kod',
    memberCount: 487,
    daysAgo: 260,
  },
  {
    slug: 'gece-gokyuzu',
    name: 'Gece Gökyüzü Gözlem',
    description: 'Amatör astronomi, gözlem gecesi planları, teleskop kurulumu ve astrofotoğraf paylaşımı.',
    parent: 'havacilik-uzay',
    topic: 'havacilik-uzay',
    emoji: '🌠',
    scope: 'national',
    provinceCode: null,
    districtCode: null,
    audience: 'Genel',
    createdBy: 'ece.uzay',
    memberCount: 1024,
    daysAgo: 330,
  },
];

export function buildCommunities(now: Date): Community[] {
  const roots: Community[] = ROOTS.map((input) => ({
    id: communityId(input.slug),
    slug: input.slug,
    name: input.name,
    description: input.description,
    kind: 'root',
    rootTopicId: topicId(input.topic),
    scope: 'national',
    provinceCode: null,
    districtCode: null,
    audience: 'Genel',
    rules: DEFAULT_RULES,
    status: 'active',
    createdBy: profileId('moderator.demo'),
    createdAt: new Date(now.getTime() - 900 * 86_400_000).toISOString(),
    memberCount: input.memberCount,
    emoji: input.emoji,
  }));

  const branches: Community[] = BRANCHES.map((input) => ({
    id: communityId(input.slug),
    slug: input.slug,
    name: input.name,
    description: input.description,
    kind: 'branch',
    rootTopicId: topicId(input.topic),
    scope: input.scope,
    provinceCode: input.provinceCode,
    districtCode: input.districtCode,
    audience: input.audience,
    rules: input.rules ?? DEFAULT_RULES,
    status: 'active',
    createdBy: profileId(input.createdBy),
    createdAt: new Date(now.getTime() - input.daysAgo * 86_400_000).toISOString(),
    memberCount: input.memberCount,
    emoji: input.emoji,
  }));

  return [...roots, ...branches];
}

/** Kurucu her zaman yonetici; ek olarak demo hesaplarina baslangic uyelikleri veriyoruz. */
const EXTRA_MEMBERSHIPS: Array<{ community: string; profile: string; role: CommunityMember['role'] }> = [
  { community: 'havacilik-uzay', profile: 'elif.demo', role: 'member' },
  { community: 'robotik', profile: 'elif.demo', role: 'member' },
  { community: 'surdurulebilirlik', profile: 'baran.demo', role: 'member' },
  { community: 'ege-gunes-enerjisi', profile: 'baran.demo', role: 'member' },
  { community: 'tasarim-urun', profile: 'baran.demo', role: 'member' },
  { community: 'izmir-havacilik', profile: 'elif.demo', role: 'member' },
  { community: 'yapay-zeka', profile: 'ayse.veri', role: 'moderator' },
  { community: 'biyoteknoloji', profile: 'zeynep.bio', role: 'moderator' },
  { community: 'lise-biyoteknoloji', profile: 'irem.lise', role: 'member' },
  { community: 'siber-guvenlik', profile: 'emre.guvenlik', role: 'moderator' },
  { community: 'oyun-gelistirme', profile: 'selin.oyun', role: 'member' },
  { community: 'game-jam-ege', profile: 'selin.oyun', role: 'manager' },
  { community: 'tasarim-urun', profile: 'nazli.tasarim', role: 'moderator' },
  { community: 'robotik', profile: 'mert.kod', role: 'member' },
  { community: 'havacilik-uzay', profile: 'kaan.roket', role: 'member' },
  { community: 'havacilik-uzay', profile: 'burak.uav', role: 'member' },
  { community: 'gece-gokyuzu', profile: 'ece.uzay', role: 'manager' },
  { community: 'surdurulebilirlik', profile: 'onur.enerji', role: 'member' },
  { community: 'robotik', profile: 'tolga.mizah', role: 'member' },
  { community: 'yapay-zeka', profile: 'tolga.mizah', role: 'member' },
];

export function buildMemberships(now: Date): CommunityMember[] {
  const joinedAt = new Date(now.getTime() - 60 * 86_400_000).toISOString();

  const founders: CommunityMember[] = BRANCHES.map((input) => ({
    communityId: communityId(input.slug),
    profileId: profileId(input.createdBy),
    role: 'manager',
    joinedAt: new Date(now.getTime() - input.daysAgo * 86_400_000).toISOString(),
  }));

  const extras: CommunityMember[] = EXTRA_MEMBERSHIPS.map((entry) => ({
    communityId: communityId(entry.community),
    profileId: profileId(entry.profile),
    role: entry.role,
    joinedAt,
  }));

  // Ayni (topluluk, profil) ciftini iki kez eklemeyelim; kurucu kaydi oncelikli.
  const seen = new Set(founders.map((m) => `${m.communityId}:${m.profileId}`));
  return [...founders, ...extras.filter((m) => !seen.has(`${m.communityId}:${m.profileId}`))];
}

/**
 * Moderator ekraninda incelenecek basvurular (PROJECT_SPEC 6.1 ekran 12).
 * Ilk kayit demo senaryosunda onaylanacak olan basvurudur ve kasitli olarak
 * mevcut "İzmir Havacılık Meraklıları" toplulugu ile benzer isimlidir;
 * boylece moderator ekranindaki "benzer topluluk" uyarisi calisirken gorulur.
 */
export function buildApplications(now: Date): CommunityApplication[] {
  const at = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

  return [
    {
      id: uid('application', 'izmir-uydu'),
      name: 'İzmir Uydu ve Yer İstasyonu Topluluğu',
      rootTopicId: topicId('havacilik-uzay'),
      rationale:
        'İzmir çevresinde cubesat ve amatör yer istasyonu ile ilgilenen 20+ kişiyiz ama tek tek dağınık ilerliyoruz. Ortak antenle takip günleri düzenlemek ve okullardan gelen öğrencilere kapı açmak istiyoruz.',
      scope: 'local',
      provinceCode: '35',
      districtCode: '35-07',
      audience: 'Genel',
      rules:
        'Amatör telsiz mevzuatına uyulur. Frekans ve konum bilgisi paylaşımı yasal sınırlar içinde kalır. Yeni başlayanlara mentor eşleştirilir.',
      applicantId: profileId('kaan.roket'),
      status: 'pending',
      reviewerId: null,
      reviewerNote: null,
      createdAt: at(2),
      reviewedAt: null,
    },
    {
      id: uid('application', 'tarim-teknolojileri'),
      name: 'Tarım Teknolojileri Ağı',
      rootTopicId: topicId('surdurulebilirlik'),
      rationale:
        'Sera otomasyonu, toprak sensörleri ve sulama optimizasyonu ile uğraşan üreticiler ve mühendisler için ortak bir alan. Ödemiş ve Tire çevresinde saha ziyaretleri planlıyoruz.',
      scope: 'local',
      provinceCode: '35',
      districtCode: '35-25',
      audience: 'Genel',
      rules: 'Ürün satışı yerine yöntem paylaşımı. Saha verisi paylaşırken üreticinin izni alınır.',
      applicantId: profileId('onur.enerji'),
      status: 'pending',
      reviewerId: null,
      reviewerNote: null,
      createdAt: at(4),
      reviewedAt: null,
    },
    {
      id: uid('application', 'kripto-kazanc'),
      name: 'Hızlı Kazanç Kripto Sinyal Grubu',
      rootTopicId: topicId('yapay-zeka'),
      rationale: 'Günlük al-sat sinyalleri paylaşacağız, kesin kazanç garantili.',
      scope: 'online',
      provinceCode: null,
      districtCode: null,
      audience: 'Genel',
      rules: 'Sinyallere uyulması zorunludur.',
      applicantId: profileId('tolga.mizah'),
      status: 'pending',
      reviewerId: null,
      reviewerNote: null,
      createdAt: at(1),
      reviewedAt: null,
    },
    {
      id: uid('application', 'game-jam-ege'),
      name: 'Game Jam Ege',
      rootTopicId: topicId('oyun-gelistirme'),
      rationale: 'Ege bölgesindeki game jam katılımcılarını tek yerde toplamak.',
      scope: 'local',
      provinceCode: '35',
      districtCode: '35-17',
      audience: 'Genel',
      rules: 'Takım arama ilanları serbest, hakaret yok.',
      applicantId: profileId('selin.oyun'),
      status: 'approved',
      reviewerId: profileId('moderator.demo'),
      reviewerNote: 'Kapsam net, benzer aktif topluluk yok. Onaylandı.',
      createdAt: at(95),
      reviewedAt: at(90),
    },
  ];
}
