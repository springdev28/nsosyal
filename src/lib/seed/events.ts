import type { AppEvent } from '@/types/domain';
import { communityId } from './communities';
import { uid } from './ids';
import { profileId } from './profiles';
import { topicId, type TopicSlug } from './topics';

/**
 * Etkinlik seed verisi (PROJECT_SPEC 7.5).
 *
 * Tarihler her zaman "simdi"ye gore uretilir; boylece demo haftalar sonra
 * acildiginda da "gelecek 30 gun" filtresi dolu gelir.
 *
 * Demo senaryosu (PROJECT_SPEC 15.3) icin kritik: onumuzdeki 30 gun icinde
 * Izmir'de en az bir havacilik etkinligi bulunmali.
 */

export const eventId = (slug: string) => uid('event', slug);

interface EventInput {
  slug: string;
  title: string;
  description: string;
  organizerType: AppEvent['organizerType'];
  organizer: string;
  /** Simdiye gore gun farki. Negatif = gecmis. */
  startsInDays: number;
  startHour: number;
  durationHours: number;
  deadlineInDays?: number;
  provinceCode: string | null;
  districtCode: string | null;
  venue: string | null;
  onlineUrl: string | null;
  mode: AppEvent['mode'];
  topics: TopicSlug[];
  community: string | null;
  emoji: string;
}

const EVENTS: EventInput[] = [
  // --- Izmir, yakin gelecek (demo senaryosunun merkezi) --------------------
  {
    slug: 'izmir-model-roket-atolyesi',
    title: 'İzmir Model Roket Atölyesi',
    description:
      'Sıfırdan model roket yapımı: gövde, motor seçimi, kurtarma sistemi ve güvenlik kuralları. Malzeme sağlanır, önceden deneyim gerekmez.',
    organizerType: 'community',
    organizer: 'izmir-havacilik',
    startsInDays: 9,
    startHour: 10,
    durationHours: 6,
    deadlineInDays: 6,
    provinceCode: '35',
    districtCode: '35-07',
    venue: 'Bornova Gençlik Merkezi (Demo)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['havacilik-uzay', 'robotik'],
    community: 'izmir-havacilik',
    emoji: '🚀',
  },
  {
    slug: 'izmir-iha-saha-ucusu',
    title: 'İHA Saha Uçuşu ve Telemetri Günü',
    description:
      'Sabit kanatlı ve çok rotorlu İHA’larla açık saha uçuşu. Telemetri verisi paylaşımı ve otopilot ayar sohbeti.',
    organizerType: 'community',
    organizer: 'izmir-havacilik',
    startsInDays: 22,
    startHour: 9,
    durationHours: 5,
    provinceCode: '35',
    districtCode: '35-23',
    venue: 'Menemen açık saha (Demo)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['havacilik-uzay', 'yapay-zeka'],
    community: 'izmir-havacilik',
    emoji: '🛸',
  },
  {
    slug: 'ege-teknopark-demo-gunu',
    title: 'Ege Teknopark Demo Günü',
    description:
      'Erken aşama takımların 5 dakikalık demo sunumları. Jüri yok, geri bildirim var. Sunum yapmak için başvuru gerekiyor.',
    organizerType: 'organization',
    organizer: 'egeteknopark.demo',
    startsInDays: 16,
    startHour: 14,
    durationHours: 4,
    deadlineInDays: 8,
    provinceCode: '35',
    districtCode: '35-07',
    venue: 'Ege Teknopark Konferans Salonu (Demo)',
    onlineUrl: null,
    mode: 'hybrid',
    topics: ['tasarim-urun', 'yapay-zeka', 'surdurulebilirlik'],
    community: null,
    emoji: '🎤',
  },
  {
    slug: 'izmir-erisilebilirlik-denetimi',
    title: 'Birlikte Arayüz Denetimi: Erişilebilirlik',
    description:
      'Bir kamu hizmeti arayüzünü birlikte klavye ve ekran okuyucu ile deneyip WCAG 2.2 kriterlerine göre not alıyoruz.',
    organizerType: 'community',
    organizer: 'erisilebilir-arayuz',
    startsInDays: 12,
    startHour: 20,
    durationHours: 2,
    provinceCode: '35',
    districtCode: '35-21',
    venue: 'Konak Kültür Merkezi (Demo)',
    onlineUrl: 'https://ornek.nsosyal.demo/erisilebilirlik',
    mode: 'hybrid',
    topics: ['tasarim-urun'],
    community: 'erisilebilir-arayuz',
    emoji: '♿',
  },
  {
    slug: 'ege-ges-saha-gezisi',
    title: 'Ege GES Saha Gezisi',
    description: 'Urla’da kooperatif çatı GES kurulumunu yerinde inceliyoruz. Ölçüm verileri paylaşılacak.',
    organizerType: 'community',
    organizer: 'ege-gunes-enerjisi',
    startsInDays: 27,
    startHour: 11,
    durationHours: 3,
    provinceCode: '35',
    districtCode: '35-30',
    venue: 'Urla kooperatif çatısı (Demo)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['surdurulebilirlik'],
    community: 'ege-gunes-enerjisi',
    emoji: '☀️',
  },
  {
    slug: 'game-jam-ege-48',
    title: 'Game Jam Ege 48 Saat',
    description: 'Tema açıklamayla başlayan 48 saatlik jam. Takım kurmadan gelebilirsiniz, eşleştirme yapılıyor.',
    organizerType: 'community',
    organizer: 'game-jam-ege',
    startsInDays: 34,
    startHour: 18,
    durationHours: 48,
    deadlineInDays: 25,
    provinceCode: '35',
    districtCode: '35-17',
    venue: 'Karşıyaka Üretim Atölyesi (Demo)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['oyun-gelistirme', 'tasarim-urun'],
    community: 'game-jam-ege',
    emoji: '🕹️',
  },

  // --- Diger iller ve cevrim ici ------------------------------------------
  {
    slug: 'ankara-otonom-arac-calistayi',
    title: 'Otonom Araç Takımları Çalıştayı',
    description: 'Sensör füzyonu, simülasyondan gerçeğe geçiş ve yarışma kuralları üzerine takım sunumları.',
    organizerType: 'organization',
    organizer: 'anadoluuzay.demo',
    startsInDays: 19,
    startHour: 10,
    durationHours: 7,
    provinceCode: '06',
    districtCode: null,
    venue: 'Ankara (Demo mekân)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['robotik', 'yapay-zeka'],
    community: 'otonom-arac-takimlari',
    emoji: '🚗',
  },
  {
    slug: 'turkce-nlp-okuma-grubu',
    title: 'Türkçe NLP Okuma Grubu',
    description: 'Bu ayın makalesi: morfolojik ayrıştırmanın özetleme başarımına etkisi. Çevrim içi, kayıt yok.',
    organizerType: 'community',
    organizer: 'turkce-nlp',
    startsInDays: 5,
    startHour: 21,
    durationHours: 2,
    provinceCode: null,
    districtCode: null,
    venue: null,
    onlineUrl: 'https://ornek.nsosyal.demo/nlp-okuma',
    mode: 'online',
    topics: ['yapay-zeka'],
    community: 'turkce-nlp',
    emoji: '📄',
  },
  {
    slug: 'istanbul-biyo-lab-turu',
    title: 'Lise Öğrencileri için Laboratuvar Turu',
    description: 'Biyoteknoloji laboratuvarında güvenlik, temel ekipman ve bir günlük araştırmacı deneyimi.',
    organizerType: 'organization',
    organizer: 'biyolab.demo',
    startsInDays: 24,
    startHour: 13,
    durationHours: 3,
    deadlineInDays: 14,
    provinceCode: '34',
    districtCode: null,
    venue: 'İstanbul (Demo laboratuvar)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['biyoteknoloji'],
    community: 'lise-biyoteknoloji',
    emoji: '🧪',
  },
  {
    slug: 'ctf-baslangic-turnuvasi',
    title: 'CTF Başlangıç Turnuvası',
    description: 'Yalnızca izinli ve yasal ortamda, yeni başlayanlara açık takım turnuvası. Çözümler sonrasında anlatılır.',
    organizerType: 'community',
    organizer: 'ctf-baslangic',
    startsInDays: 41,
    startHour: 11,
    durationHours: 8,
    deadlineInDays: 33,
    provinceCode: null,
    districtCode: null,
    venue: null,
    onlineUrl: 'https://ornek.nsosyal.demo/ctf',
    mode: 'online',
    topics: ['siber-guvenlik'],
    community: 'ctf-baslangic',
    emoji: '🚩',
  },

  // --- Gecmis etkinlikler (zaman makinesi icin) ---------------------------
  {
    slug: 'izmir-gozlem-gecesi',
    title: 'İzmir Gece Gökyüzü Gözlem Etkinliği',
    description: 'Karaburun’da teleskop kurulumu ve astrofotoğraf denemeleri. Katılım raporu ve fotoğraflar paylaşıldı.',
    organizerType: 'community',
    organizer: 'gece-gokyuzu',
    startsInDays: -21,
    startHour: 21,
    durationHours: 5,
    provinceCode: '35',
    districtCode: '35-16',
    venue: 'Karaburun (Demo alan)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['havacilik-uzay'],
    community: 'gece-gokyuzu',
    emoji: '🌠',
  },
  {
    slug: 'izmir-yazilim-bulusmasi-mayis',
    title: 'İzmir Yazılım Buluşması',
    description: 'Üç kısa sunum ve serbest sohbet. Sunum kayıtları topluluk kaynaklarına eklendi.',
    organizerType: 'community',
    organizer: 'izmir-yazilim-bulusmalari',
    startsInDays: -47,
    startHour: 19,
    durationHours: 3,
    provinceCode: '35',
    districtCode: '35-21',
    venue: 'Konak (Demo mekân)',
    onlineUrl: null,
    mode: 'physical',
    topics: ['tasarim-urun', 'yapay-zeka'],
    community: 'izmir-yazilim-bulusmalari',
    emoji: '💻',
  },
];

function organizerIdFor(input: EventInput): string {
  return input.organizerType === 'community' ? communityId(input.organizer) : profileId(input.organizer);
}

export function buildEvents(now: Date): AppEvent[] {
  return EVENTS.map((input) => {
    const start = new Date(now.getTime() + input.startsInDays * 86_400_000);
    start.setHours(input.startHour, 0, 0, 0);
    const end = new Date(start.getTime() + input.durationHours * 3_600_000);

    return {
      id: eventId(input.slug),
      slug: input.slug,
      title: input.title,
      description: input.description,
      organizerType: input.organizerType,
      organizerId: organizerIdFor(input),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      deadlineAt:
        input.deadlineInDays === undefined
          ? null
          : new Date(now.getTime() + input.deadlineInDays * 86_400_000).toISOString(),
      provinceCode: input.provinceCode,
      districtCode: input.districtCode,
      venue: input.venue,
      onlineUrl: input.onlineUrl,
      mode: input.mode,
      topicIds: input.topics.map(topicId),
      communityId: input.community ? communityId(input.community) : null,
      emoji: input.emoji,
    };
  });
}

export const EVENT_SLUGS = EVENTS.map((e) => e.slug);
