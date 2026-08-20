import { PROVINCES } from '@/lib/geo';
import type { AppEvent, Community, Post, Project } from '@/types/domain';

import { communityId } from './communities';
import { eventId } from './events';
import { postId } from './posts';
import { profileId } from './profiles';
import { projectId } from './projects';
import { topicId } from './topics';

/**
 * Turkiye geneli sentetik dagilim (PROJECT_SPEC 7.4 / 17.18-6).
 *
 * NEDEN VAR: elle yazilmis demo icerigi yalnizca UC ilde topluyordu - Izmir,
 * Istanbul, Ankara. Nerede haritasi 81 ilin 78'ini bos ve ayni renkte
 * ciziyordu, yani "yogunluk haritasi" hicbir yogunluk gostermiyordu: legend
 * vardi ama okunacak bir degisim yoktu. Urun kurali acik - platform Turkiye
 * genelidir ve Izmir bir pilot il degil, yalnizca ilce verisinin bulundugu
 * ildir.
 *
 * NE YAPAR: her il icin agirligina gore topluluk, etkinlik, proje ve
 * paylasim uretir. Icerik elle yazilmis kayitlarin YERINI ALMAZ, uzerine
 * eklenir; Izmir/Istanbul/Ankara'nin zengin, elle yazilmis anlatisi oldugu
 * gibi kalir.
 *
 * DETERMINIZM: uretim il koduna gore tohumlanan bir PRNG kullanir. Ayni
 * girdi her calistirmada ayni ciktiyi verir; aksi halde DemoStore her yeniden
 * kurulusunda baska sayilar uretir ve testler ile ekran goruntuleri
 * birbirini tutmazdi. `Math.random` KULLANILMAZ.
 */

/** Kucuk, hizli, tekrarlanabilir PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function seedFrom(text: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return h >>> 0;
}

/**
 * Illerin bagil etkinlik agirligi.
 *
 * Bu bir nufus tablosu DEGILDIR; bilim-teknoloji-uretim ekosisteminin
 * gorunur yogunlugunu temsil eden sentetik bir dagilimdir. Universite,
 * teknopark ve sanayi yogunlugu olan iller daha yuksek, kucuk iller daha
 * dusuk deger alir. Amaci haritada GERCEK bir degisim uretmek: her il ayni
 * degeri alsaydi choropleth yine duz olurdu.
 *
 * Elle yazilmis icerigin bulundugu uc il (34, 06, 35) burada YER ALMAZ;
 * onlarin hacmi zaten gercek kayitlardan gelir ve ustune sentetik ekleme
 * yapmak o illeri yapay olarak sisirirdi.
 */
const WEIGHTS: Record<string, number> = {
  '16': 9, // Bursa
  '41': 8, // Kocaeli
  '07': 7, // Antalya
  '42': 6, // Konya
  '01': 6, // Adana
  '27': 6, // Gaziantep
  '61': 5, // Trabzon
  '55': 5, // Samsun
  '38': 5, // Kayseri
  '26': 5, // Eskisehir
  '65': 4, // Van
  '31': 4, // Hatay
  '33': 4, // Mersin
  '20': 4, // Denizli
  '45': 4, // Manisa
  '10': 3, // Balikesir
  '48': 3, // Mugla
  '21': 3, // Diyarbakir
  '44': 3, // Malatya
  '23': 3, // Elazig
  '25': 3, // Erzurum
  '09': 3, // Aydin
  '43': 3, // Kutahya
  '54': 3, // Sakarya
  '52': 2, // Ordu
  '46': 2, // Kahramanmaras
  '63': 2, // Sanliurfa
  '17': 2, // Canakkale
  '32': 2, // Isparta
  '03': 2, // Afyonkarahisar
  '22': 2, // Edirne
  '59': 2, // Tekirdag
  '19': 2, // Corum
  '60': 2, // Tokat
  '66': 2, // Yozgat
  '15': 1, // Burdur
  '11': 1, // Bilecik
  '14': 1, // Bolu
  '18': 1, // Cankiri
  '05': 1, // Amasya
  '28': 1, // Giresun
  '29': 1, // Gumushane
  '37': 1, // Kastamonu
  '39': 1, // Kirklareli
  '40': 1, // Kirsehir
  '47': 1, // Mardin
  '49': 1, // Mus
  '50': 1, // Nevsehir
  '51': 1, // Nigde
  '53': 1, // Rize
  '56': 1, // Siirt
  '57': 1, // Sinop
  '58': 1, // Sivas
  '62': 1, // Tunceli
  '64': 1, // Usak
  '67': 1, // Zonguldak
  '68': 1, // Aksaray
  '69': 1, // Bayburt
  '70': 1, // Karaman
  '71': 1, // Kirikkale
  '72': 1, // Batman
  '74': 1, // Bartin
  '77': 1, // Yalova
  '78': 1, // Karabuk
  '81': 1, // Duzce
};

/** Her ile atanacak konu havuzu; slug'lar `topics.ts` ile ayni. */
const TOPIC_POOL = [
  'yapay-zeka',
  'havacilik-uzay',
  'robotik',
  'biyoteknoloji',
  'surdurulebilirlik',
  'siber-guvenlik',
  'oyun-gelistirme',
  'tasarim-urun',
] as const;

const TOPIC_LABEL: Record<(typeof TOPIC_POOL)[number], string> = {
  'yapay-zeka': 'Yapay Zekâ',
  'havacilik-uzay': 'Havacılık ve Uzay',
  robotik: 'Robotik',
  biyoteknoloji: 'Biyoteknoloji',
  surdurulebilirlik: 'Sürdürülebilirlik',
  'siber-guvenlik': 'Siber Güvenlik',
  'oyun-gelistirme': 'Oyun Geliştirme',
  'tasarim-urun': 'Tasarım ve Ürün',
};

const TOPIC_EMOJI: Record<(typeof TOPIC_POOL)[number], string> = {
  'yapay-zeka': '🧠',
  'havacilik-uzay': '🛰️',
  robotik: '🤖',
  biyoteknoloji: '🧬',
  surdurulebilirlik: '🌱',
  'siber-guvenlik': '🛡️',
  'oyun-gelistirme': '🎮',
  'tasarim-urun': '🎨',
};

const COMMUNITY_FORMS = [
  'Topluluğu',
  'Atölyesi',
  'Kulübü',
  'Çalışma Grubu',
  'Buluşmaları',
] as const;

const EVENT_FORMS = [
  { title: 'açık atölye', mode: 'physical' as const, hours: 3 },
  { title: 'tanışma buluşması', mode: 'physical' as const, hours: 2 },
  { title: 'proje sunum akşamı', mode: 'hybrid' as const, hours: 3 },
  { title: 'başlangıç semineri', mode: 'online' as const, hours: 2 },
  { title: 'hafta sonu kampı', mode: 'physical' as const, hours: 8 },
] as const;

const PROJECT_FORMS = [
  { suffix: 'ölçüm ağı', need: 'Sensör montajı yapabilecek bir gönüllü' },
  { suffix: 'açık veri seti', need: 'Veri etiketlemede yardım' },
  { suffix: 'eğitim seti', need: 'Ders içeriği hazırlayacak biri' },
  { suffix: 'prototip denemesi', need: 'Atölye erişimi olan bir ekip' },
  { suffix: 'saha çalışması', need: 'Yerelden bir irtibat kişisi' },
] as const;

const POST_TEMPLATES = [
  (place: string, topic: string) =>
    `${place}'de ${topic} çalışan kaç kişi var acaba? Küçük bir grup kurmayı deniyoruz, tanışalım.`,
  (place: string, topic: string) =>
    `${topic} için ${place} tarafında ekipman paylaşabileceğimiz bir yer arıyoruz. Öneri olan var mı?`,
  (place: string, topic: string) =>
    `${place} ${topic} buluşmasının notlarını yazdım, isteyene gönderirim. İlk defa bu kadar kalabalıktık.`,
  (place: string, topic: string) =>
    `Geçen haftaki ${topic} atölyesinden sonra ${place}'de düzenli devam etme kararı aldık.`,
] as const;

/** Sentetik kayitlarin sahibi: demo moderatoru. Gercek bir kisi degildir. */
const AUTHOR = 'moderator.demo';

interface RegionalSeed {
  communities: Community[];
  events: AppEvent[];
  projects: Project[];
  posts: Post[];
}

/**
 * Ile gore uretilmis ek icerik.
 *
 * `now` disaridan gelir cunku butun demo veri kumesi ona gore uretilir;
 * boylece demo haftalar sonra acildiginda da "gelecek 30 gun" dolu gelir.
 */
export function buildRegional(now: Date): RegionalSeed {
  const communities: Community[] = [];
  const events: AppEvent[] = [];
  const projects: Project[] = [];
  const posts: Post[] = [];

  const nameByCode = new Map(PROVINCES.map((province) => [province.code, province.name]));

  for (const [code, weight] of Object.entries(WEIGHTS)) {
    const place = nameByCode.get(code);
    if (!place || weight <= 0) continue;

    const random = rng(seedFrom(`nsosyal-regional-${code}`));
    const pick = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)];

    // Agirlik hem kayit SAYISINI hem de topluluk buyuklugunu belirler; harita
    // yogunlugu bu iki eksenin toplamindan okunur.
    const communityCount = Math.max(1, Math.round(weight * 0.7));
    const eventCount = Math.max(1, Math.round(weight * 0.8));
    const projectCount = Math.max(1, Math.round(weight * 0.6));
    const postCount = Math.max(1, Math.round(weight * 1.1));

    for (let i = 0; i < communityCount; i += 1) {
      const topic = pick(TOPIC_POOL);
      const form = pick(COMMUNITY_FORMS);
      const slug = `bolge-${code}-${topic}-${i + 1}`;
      communities.push({
        id: communityId(slug),
        slug,
        name: `${place} ${TOPIC_LABEL[topic]} ${form}`,
        description: `${place} ve çevresinde ${TOPIC_LABEL[topic].toLocaleLowerCase('tr')} ile ilgilenenlerin buluştuğu yerel alan. Sentetik demo içeriği.`,
        kind: 'branch',
        rootTopicId: topicId(topic),
        scope: 'local',
        provinceCode: code,
        districtCode: null,
        audience: 'Genel',
        rules: [
          'Kendi işini ve sürecini paylaş.',
          'Yerel etkinlik duyuruları serbest.',
          'Reklam ve satış içeriği yasak.',
        ],
        status: 'active',
        createdBy: profileId(AUTHOR),
        createdAt: new Date(
          now.getTime() - (120 + Math.floor(random() * 600)) * 86_400_000,
        ).toISOString(),
        memberCount: 30 + Math.floor(random() * weight * 90),
        emoji: TOPIC_EMOJI[topic],
      });
    }

    for (let i = 0; i < eventCount; i += 1) {
      const topic = pick(TOPIC_POOL);
      const form = pick(EVENT_FORMS);
      const slug = `bolge-${code}-etkinlik-${i + 1}`;
      // Etkinlikler gecmise ve gelecege yayilir; "bugun", "bu hafta" ve
      // "gelecek 30 gun" filtrelerinin hepsi dolu gelsin.
      const startsInDays = Math.floor(random() * 45) - 10;
      const start = new Date(now.getTime() + startsInDays * 86_400_000);
      start.setHours(10 + Math.floor(random() * 9), 0, 0, 0);

      events.push({
        id: eventId(slug),
        slug,
        title: `${place} ${TOPIC_LABEL[topic]} ${form.title}`,
        description: `${TOPIC_LABEL[topic]} alanında yerel katılıma açık ${form.title}. Sentetik demo içeriği.`,
        organizerType: 'community',
        organizerId: communityId(`bolge-${code}-${topic}-1`),
        startsAt: start.toISOString(),
        endsAt: new Date(start.getTime() + form.hours * 3_600_000).toISOString(),
        deadlineAt: null,
        provinceCode: code,
        districtCode: null,
        venue: form.mode === 'online' ? null : `${place} merkez`,
        onlineUrl: form.mode === 'physical' ? null : 'https://ornek.nsosyal.demo/yayin',
        mode: form.mode,
        topicIds: [topicId(topic)],
        communityId: null,
        emoji: TOPIC_EMOJI[topic],
      });
    }

    for (let i = 0; i < projectCount; i += 1) {
      const topic = pick(TOPIC_POOL);
      const form = pick(PROJECT_FORMS);
      const slug = `bolge-${code}-proje-${i + 1}`;
      projects.push({
        id: projectId(slug),
        slug,
        ownerId: profileId(AUTHOR),
        title: `${place} ${TOPIC_LABEL[topic].toLocaleLowerCase('tr')} ${form.suffix}`,
        summary: `${place} çevresinde yürüyen açık bir çalışma. Ham veriler ve süreç notları paylaşılıyor. Sentetik demo içeriği.`,
        status: random() > 0.65 ? 'fikir' : 'prototip',
        topicIds: [topicId(topic)],
        provinceCode: code,
        districtCode: null,
        whyText: `${place} için bu konuda derli toplu bir kaynak yoktu; kendi ölçümümüzü yapmaya karar verdik.`,
        howText: 'Haftalık kısa notlar, açık ham veri, iki haftada bir yüz yüze buluşma.',
        needs: form.need,
        communityIds: [communityId(`bolge-${code}-${topic}-1`)],
        startedAt: new Date(
          now.getTime() - (20 + Math.floor(random() * 320)) * 86_400_000,
        ).toISOString(),
        targetEndAt: null,
        emoji: TOPIC_EMOJI[topic],
        pitchMediaId: null,
      });
    }

    for (let i = 0; i < postCount; i += 1) {
      const topic = pick(TOPIC_POOL);
      const template = pick(POST_TEMPLATES);
      const slug = `bolge-${code}-gonderi-${i + 1}`;
      posts.push({
        id: postId(slug),
        authorId: profileId(AUTHOR),
        type: 'text',
        body: template(place, TOPIC_LABEL[topic].toLocaleLowerCase('tr')),
        visibility: 'public',
        communityId: null,
        topicIds: [topicId(topic)],
        provinceCode: code,
        districtCode: null,
        projectId: null,
        eventId: null,
        whyStoryId: null,
        resourceId: null,
        mediaIds: [],
        createdAt: new Date(
          now.getTime() - (1 + Math.floor(random() * 40)) * 86_400_000,
        ).toISOString(),
        likeCount: Math.floor(random() * 24),
        commentCount: Math.floor(random() * 6),
        repostCount: Math.floor(random() * 4),
        isShortVideo: false,
        videoKind: null,
      });
    }
  }

  return { communities, events, projects, posts };
}

/** Toplam sentetik kayit sayisi - testler ve "kac il dolu" kontrolu icin. */
export function regionalProvinceCodes(): string[] {
  return Object.entries(WEIGHTS)
    .filter(([, weight]) => weight > 0)
    .map(([code]) => code);
}
