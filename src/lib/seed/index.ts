import type {
  AdRequest,
  AnalyticsEvent,
  AppEvent,
  Comment,
  Community,
  CommunityApplication,
  CommunityMember,
  Media,
  ModerationAction,
  NewspaperIssue,
  NewspaperItem,
  Notification,
  Post,
  Profile,
  Project,
  ProjectMember,
  ProjectUpdate,
  Reminder,
  Report,
  Resource,
  Topic,
  UUID,
  WhyStory,
} from '@/types/domain';

import { buildApplications, buildCommunities, buildMemberships } from './communities';
import { buildEvents } from './events';
import { uid } from './ids';
import { buildMedia } from './media';
import { buildAdRequests, buildNewspaper } from './newspaper';
import { buildPosts, postId } from './posts';
import { buildProfiles, profileId } from './profiles';
import { buildProjectMembers, buildProjectUpdates, buildProjects } from './projects';
import { buildRegional } from './regional';
import { buildResources } from './resources';
import { TOPICS } from './topics';
import { buildWhyStories } from './why';

/**
 * Tum sentetik demo veri kumesi.
 *
 * Zaman damgalari her zaman `now` parametresine gore uretilir; boylece demo
 * haftalar sonra acildiginda da "gelecek 30 gun" filtreleri dolu gelir
 * (PROJECT_SPEC 15.4 "Demo dayanikliligi").
 */
export interface Dataset {
  generatedAt: string;
  topics: Topic[];
  profiles: Profile[];
  follows: Array<{ followerId: UUID; followingId: UUID }>;
  communities: Community[];
  communityMembers: CommunityMember[];
  communityApplications: CommunityApplication[];
  posts: Post[];
  comments: Comment[];
  media: Media[];
  projects: Project[];
  projectMembers: ProjectMember[];
  projectUpdates: ProjectUpdate[];
  events: AppEvent[];
  reminders: Reminder[];
  whyStories: WhyStory[];
  resources: Resource[];
  newspaperIssues: NewspaperIssue[];
  newspaperItems: NewspaperItem[];
  adRequests: AdRequest[];
  notifications: Notification[];
  reports: Report[];
  moderationActions: ModerationAction[];
  analyticsEvents: AnalyticsEvent[];
  /** Kullanicinin begendigi / kaydettigi gonderiler (profil -> gonderi kimlikleri). */
  likes: Array<{ profileId: UUID; postId: UUID }>;
  saves: Array<{ profileId: UUID; postId: UUID }>;
}

/** Takip grafigi. Demo kullanicisinin akisi zengin gorunsun diye yeterince baglanti var. */
const FOLLOW_EDGES: Array<[string, string]> = [
  ['elif.demo', 'kaan.roket'],
  ['elif.demo', 'baran.demo'],
  ['elif.demo', 'burak.uav'],
  ['elif.demo', 'tolga.mizah'],
  ['elif.demo', 'egeteknopark.demo'],
  ['elif.demo', 'nazli.tasarim'],
  ['baran.demo', 'onur.enerji'],
  ['baran.demo', 'nazli.tasarim'],
  ['baran.demo', 'mert.kod'],
  ['baran.demo', 'yesilcati.demo'],
  ['irem.lise', 'zeynep.bio'],
  ['irem.lise', 'biyolab.demo'],
  ['irem.lise', 'tolga.mizah'],
  ['kaan.roket', 'burak.uav'],
  ['kaan.roket', 'anadoluuzay.demo'],
  ['kaan.roket', 'elif.demo'],
  ['selin.oyun', 'nazli.tasarim'],
  ['selin.oyun', 'kodkultur.demo'],
  ['mert.kod', 'burak.uav'],
  ['mert.kod', 'ayse.veri'],
  ['zeynep.bio', 'ayse.veri'],
  ['ece.uzay', 'anadoluuzay.demo'],
  ['ece.uzay', 'burak.uav'],
  ['emre.guvenlik', 'ayse.veri'],
  ['nazli.tasarim', 'selin.oyun'],
  ['onur.enerji', 'baran.demo'],
  ['onur.enerji', 'yesilcati.demo'],
  ['tolga.mizah', 'mert.kod'],
  ['burak.uav', 'mert.kod'],
  ['ayse.veri', 'emre.guvenlik'],
  ['moderator.demo', 'kodkultur.demo'],
];

/** Gonderi altindaki ornek yorumlar - "yorum" akisinin bos gorunmemesi icin. */
const COMMENTS: Array<{ post: string; author: string; body: string; hoursAgo: number }> = [
  {
    post: 'ilk-gonderi-cekingen',
    author: 'zeynep.bio',
    body: 'Hoş geldin! İlk yıl için en faydalısı temel laboratuvar becerileri ve pipet kullanımı. Gerisi zamanla geliyor.',
    hoursAgo: 4,
  },
  {
    post: 'ilk-gonderi-cekingen',
    author: 'irem.lise',
    body: 'Çok teşekkür ederim, kaynak listesine de bakacağım.',
    hoursAgo: 3,
  },
  {
    post: 'soru-anten-yerlesimi',
    author: 'mert.kod',
    body: 'Dikey konumda menzil genelde daha iyi olur ama gövde metalse yansıma yüzünden sonuç değişebiliyor. Kutu malzemesi ne?',
    hoursAgo: 9,
  },
  {
    post: 'soru-anten-yerlesimi',
    author: 'onur.enerji',
    body: 'ABS kutu kullanıyorum. Metal olan sadece kapak vidaları. Bir de plastik kutuyla deneyeyim.',
    hoursAgo: 8,
  },
  {
    post: 'ruzgar-cati-kurulum',
    author: 'onur.enerji',
    body: 'Öğleden sonraki düşüşler termal kaynaklı olabilir. Sıcaklık verisiyle üst üste bindirdiniz mi?',
    hoursAgo: 26,
  },
  {
    post: 'ruzgar-cati-kurulum',
    author: 'baran.demo',
    body: 'Bindirmedik, iyi fikir. Sıcaklık sensörünü bu hafta ekliyorum.',
    hoursAgo: 25,
  },
  {
    post: 'soru-ekran-okuyucu-form',
    author: 'selin.oyun',
    body: 'aria-describedby ile hata metnini alana bağlayabilirsin, aria-invalid da eklemeyi unutma.',
    hoursAgo: 14,
  },
  {
    post: 'roket-ilk-atesleme-video',
    author: 'elif.demo',
    body: 'Muhafaza tasarımını paylaşır mısınız? Bizim standımızda titreşim sorunu var.',
    hoursAgo: 24,
  },
  {
    post: 'neden-basarisiz-deney',
    author: 'irem.lise',
    body: 'Bunu okuyunca kendi başarısız deneylerimi yazmaya karar verdim.',
    hoursAgo: 22,
  },
  {
    post: 'yeni-ses-tanisma',
    author: 'zeynep.bio',
    body: 'Ödemiş’ten değilim ama lise topluluğunda seni bekliyoruz, orada birkaç kişi daha var.',
    hoursAgo: 20,
  },
  {
    post: 'kahve-derleyici',
    author: 'mert.kod',
    body: 'Bunu yaşamayan mühendis yok. Ben bir keresinde iki gün başka bir makinede debug ettim.',
    hoursAgo: 2,
  },
  {
    post: 'soru-simulasyon-fark',
    author: 'ayse.veri',
    body: 'Alan farkını ölçmeden veri artırmak körlemesine oluyor. Önce hangi sınıfta düştüğüne bakmanı öneririm.',
    hoursAgo: 40,
  },
];

export function buildDataset(now: Date): Dataset {
  const profiles = buildProfiles(now);

  /*
   * Elle yazilmis icerik + Turkiye geneli sentetik dagilim.
   *
   * Elle yazilmis kayitlar yalnizca Izmir, Istanbul ve Ankara'yi dolduruyordu;
   * Nerede haritasi 81 ilin 78'ini ayni renkte ciziyor, yani bir "yogunluk
   * haritasi" hicbir yogunluk gostermiyordu. `buildRegional` kalan illere
   * agirliklarina gore topluluk, etkinlik, proje ve paylasim ekler. Elle
   * yazilmis anlatiyi DEGISTIRMEZ, ustune biner.
   */
  const regional = buildRegional(now);

  const communities = [...buildCommunities(now), ...regional.communities];
  const posts = [...buildPosts(now), ...regional.posts];
  const projects = [...buildProjects(now), ...regional.projects];
  const events = [...buildEvents(now), ...regional.events];
  const whyStories = buildWhyStories(now);
  const resources = buildResources(now);
  const { issues, items } = buildNewspaper(now);

  const follows = FOLLOW_EDGES.map(([follower, following]) => ({
    followerId: profileId(follower),
    followingId: profileId(following),
  }));

  const comments: Comment[] = COMMENTS.map((input, index) => ({
    id: uid('comment', `${input.post}-${index}`),
    postId: postId(input.post),
    authorId: profileId(input.author),
    body: input.body,
    createdAt: new Date(now.getTime() - input.hoursAgo * 3_600_000).toISOString(),
  }));

  // Demo kullanicisinin gecmisi: birkac begeni ve kayit.
  const likes = [
    { profileId: profileId('elif.demo'), postId: postId('roket-ilk-atesleme-video') },
    { profileId: profileId('elif.demo'), postId: postId('neden-ruzgar-paylasim') },
    { profileId: profileId('baran.demo'), postId: postId('kaynak-klavye-test') },
  ];
  const saves = [
    { profileId: profileId('elif.demo'), postId: postId('kaynak-lehim-video') },
    { profileId: profileId('baran.demo'), postId: postId('kaynak-ges-kontrol') },
  ];

  return {
    generatedAt: now.toISOString(),
    topics: TOPICS,
    profiles,
    follows,
    communities,
    communityMembers: buildMemberships(now),
    communityApplications: buildApplications(now),
    posts,
    comments,
    media: buildMedia(),
    projects,
    projectMembers: buildProjectMembers(),
    projectUpdates: buildProjectUpdates(now),
    events,
    reminders: [],
    whyStories,
    resources,
    newspaperIssues: issues,
    newspaperItems: items,
    adRequests: buildAdRequests(now),
    notifications: buildInitialNotifications(now),
    reports: buildInitialReports(now),
    moderationActions: [],
    analyticsEvents: [],
    likes,
    saves,
  };
}

/** Moderator ekraninin bos gorunmemesi icin bir acik rapor. */
function buildInitialReports(now: Date): Report[] {
  return [
    {
      id: uid('report', 'kripto-basvuru'),
      reporterId: profileId('nazli.tasarim'),
      entityType: 'community',
      entityId: uid('application', 'kripto-kazanc'),
      reason: 'Yanıltıcı finansal vaat',
      detail: 'Topluluk başvurusu "kesin kazanç garantili" ifadesi içeriyor. Kurallara aykırı görünüyor.',
      status: 'open',
      createdAt: new Date(now.getTime() - 20 * 3_600_000).toISOString(),
    },
  ];
}

function buildInitialNotifications(now: Date): Notification[] {
  const at = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

  return [
    {
      id: uid('notification', 'welcome-elif'),
      profileId: profileId('elif.demo'),
      type: 'community_joined',
      title: 'İzmir Havacılık Meraklıları’na katıldın',
      body: 'Topluluk akışı ve kaynakları artık ana akışında görünecek.',
      entityType: 'community',
      entityId: null,
      href: '/communities/izmir-havacilik',
      createdAt: at(50),
      readAt: at(49),
    },
    {
      id: uid('notification', 'moderator-queue'),
      profileId: profileId('moderator.demo'),
      type: 'community_application',
      title: '3 topluluk başvurusu incelemeni bekliyor',
      body: 'Biri mevcut bir toplulukla benzer isimli, biri kurallara aykırı görünüyor.',
      entityType: 'community_application',
      entityId: null,
      href: '/admin/moderation',
      createdAt: at(20),
      readAt: null,
    },
    {
      id: uid('notification', 'ad-request-pending'),
      profileId: profileId('admin.demo'),
      type: 'ad_request',
      title: 'Yeni ilan başvurusu: Yeşil Çatı Kooperatifi',
      body: 'Yarınki sayı için etkinlik ilanı başvurusu incelemede.',
      entityType: 'ad_request',
      entityId: null,
      href: '/admin/newspaper',
      createdAt: at(22),
      readAt: null,
    },
  ];
}
