import type { Topic } from '@/types/domain';
import { uid } from './ids';

/**
 * "Ne" boyutunun kok taksonomisi.
 * Kok topluluklar bu konularin uzerine kurulur (PROJECT_SPEC 7.3).
 */
export const TOPIC_SLUGS = [
  'yapay-zeka',
  'havacilik-uzay',
  'biyoteknoloji',
  'robotik',
  'siber-guvenlik',
  'oyun-gelistirme',
  'surdurulebilirlik',
  'tasarim-urun',
] as const;

export type TopicSlug = (typeof TOPIC_SLUGS)[number];

export const topicId = (slug: TopicSlug) => uid('topic', slug);

export const TOPICS: Topic[] = [
  {
    id: topicId('yapay-zeka'),
    slug: 'yapay-zeka',
    name: 'Yapay Zekâ',
    emoji: '🧠',
    description: 'Makine öğrenmesi, veri, dil modelleri ve uygulamalı yapay zekâ.',
    parentId: null,
  },
  {
    id: topicId('havacilik-uzay'),
    slug: 'havacilik-uzay',
    name: 'Havacılık ve Uzay',
    emoji: '🚀',
    description: 'İHA, model roket, uydu, aviyonik ve uzay teknolojileri.',
    parentId: null,
  },
  {
    id: topicId('biyoteknoloji'),
    slug: 'biyoteknoloji',
    name: 'Biyoteknoloji',
    emoji: '🧬',
    description: 'Moleküler biyoloji, biyomedikal cihazlar, laboratuvar yöntemleri.',
    parentId: null,
  },
  {
    id: topicId('robotik'),
    slug: 'robotik',
    name: 'Robotik',
    emoji: '🤖',
    description: 'Gömülü sistemler, mekatronik, otonom araçlar ve robot yarışmaları.',
    parentId: null,
  },
  {
    id: topicId('siber-guvenlik'),
    slug: 'siber-guvenlik',
    name: 'Siber Güvenlik',
    emoji: '🛡️',
    description: 'Ağ güvenliği, CTF, güvenli yazılım geliştirme ve mahremiyet.',
    parentId: null,
  },
  {
    id: topicId('oyun-gelistirme'),
    slug: 'oyun-gelistirme',
    name: 'Oyun Geliştirme',
    emoji: '🎮',
    description: 'Oyun motorları, oyun tasarımı, teknik sanat ve game jam kültürü.',
    parentId: null,
  },
  {
    id: topicId('surdurulebilirlik'),
    slug: 'surdurulebilirlik',
    name: 'Sürdürülebilirlik',
    emoji: '🌱',
    description: 'Yenilenebilir enerji, iklim teknolojileri, döngüsel tasarım.',
    parentId: null,
  },
  {
    id: topicId('tasarim-urun'),
    slug: 'tasarim-urun',
    name: 'Tasarım ve Ürün',
    emoji: '🎨',
    description: 'Ürün tasarımı, kullanıcı deneyimi, erişilebilirlik ve prototipleme.',
    parentId: null,
  },
];

export const TOPIC_BY_SLUG = new Map(TOPICS.map((topic) => [topic.slug, topic]));
