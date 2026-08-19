/**
 * nSosyal 5N alan modeli.
 *
 * Bu tipler PROJECT_SPEC bolum 10'daki Supabase semasinin birebir karsiligidir.
 * Supabase adaptoru ile demo adaptoru ayni tipleri dondurur; boylece veri
 * kaynagini degistirmek UI katmanini etkilemez.
 */

// --- Ortak --------------------------------------------------------------

export type UUID = string;
/** ISO-8601 timestamptz. Veritabaninda timestamptz, UI'da Europe/Istanbul gosterilir. */
export type Timestamp = string;

/** 5N baglam boyutlari. "Kim" sosyal kimlik katmanidir. */
export type Dimension = 'ne' | 'nerede' | 'nezaman' | 'nasil' | 'neden' | 'kim';

export type EntityType =
  | 'post'
  | 'project'
  | 'event'
  | 'community'
  | 'profile'
  | 'resource'
  | 'why_story'
  | 'newspaper_item';

export type Role = 'user' | 'community_manager' | 'organization' | 'moderator' | 'admin';

/** Kullanicinin akistan ne beklediği. Sıralama ağırlıklarını değiştirir. */
export type IntentMode = 'sosyallesme' | 'kesfet' | 'ogren' | 'uret';

/**
 * Konum gorunurlugu. Varsayilan `hidden` (PROJECT_SPEC 11.1).
 * Bireysel kullanicinin kesin koordinati hicbir durumda tutulmaz.
 */
export type LocationVisibility = 'hidden' | 'province' | 'district' | 'online_only';

export type Scope = 'local' | 'national' | 'online';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

// --- Cografya -----------------------------------------------------------

export interface Province {
  /** Plaka kodu, "34" gibi iki haneli string. */
  code: string;
  name: string;
  /** Harita ilk odaklama merkezi [lng, lat]. */
  center: [number, number];
}

export interface District {
  code: string;
  provinceCode: string;
  name: string;
}

// --- Kim ----------------------------------------------------------------

export interface Profile {
  id: UUID;
  username: string;
  displayName: string;
  bio: string;
  avatarEmoji: string;
  avatarTone: string;
  kind: 'person' | 'organization';
  role: Role;
  verified: boolean;
  provinceCode: string | null;
  districtCode: string | null;
  locationVisibility: LocationVisibility;
  topicIds: UUID[];
  intentMode: IntentMode;
  createdAt: Timestamp;
  /** Sentetik demo hesabi isareti - jurinin gercek kisi sanmamasi icin. */
  demo: true;
  followerCount: number;
}

export interface Topic {
  id: UUID;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  parentId: UUID | null;
}

// --- Topluluk -----------------------------------------------------------

export interface Community {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  /** Kok topluluklar platform moderatorlerince acilir; dal topluluklar onayla. */
  kind: 'root' | 'branch';
  rootTopicId: UUID;
  scope: Scope;
  provinceCode: string | null;
  districtCode: string | null;
  audience: string;
  rules: string[];
  status: 'active' | 'archived';
  createdBy: UUID;
  createdAt: Timestamp;
  memberCount: number;
  emoji: string;
}

export interface CommunityMember {
  communityId: UUID;
  profileId: UUID;
  role: 'member' | 'manager' | 'moderator';
  joinedAt: Timestamp;
}

export interface CommunityApplication {
  id: UUID;
  name: string;
  rootTopicId: UUID;
  rationale: string;
  scope: Scope;
  provinceCode: string | null;
  districtCode: string | null;
  audience: string;
  rules: string;
  applicantId: UUID;
  status: ModerationStatus;
  reviewerId: UUID | null;
  reviewerNote: string | null;
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
}

// --- Icerik -------------------------------------------------------------

export type PostType =
  | 'text'
  | 'image'
  | 'video'
  | 'question'
  | 'project_update'
  | 'event_announcement'
  | 'why_link'
  | 'resource_suggestion';

export interface Media {
  id: UUID;
  postId: UUID | null;
  mediaType: 'image' | 'video';
  /** Supabase Storage yolu; demo modda /public altindaki dosya. */
  storagePath: string;
  caption: string;
  /** Erisilebilirlik: gorsel icin alternatif metin, video icin transkript ozeti. */
  altText: string;
  durationSec: number | null;
  posterPath: string | null;
}

export interface Post {
  id: UUID;
  authorId: UUID;
  type: PostType;
  body: string;
  visibility: 'public' | 'community';
  communityId: UUID | null;
  topicIds: UUID[];
  provinceCode: string | null;
  districtCode: string | null;
  projectId: UUID | null;
  eventId: UUID | null;
  whyStoryId: UUID | null;
  resourceId: UUID | null;
  mediaIds: UUID[];
  createdAt: Timestamp;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  /** Kisa video akisinda gosterilebilir mi (dikey format). */
  isShortVideo: boolean;
  videoKind: 'gundelik' | 'pitch' | 'demo' | 'ilerleme' | 'nasil' | 'neden' | 'soru' | null;
}

export interface Comment {
  id: UUID;
  postId: UUID;
  authorId: UUID;
  body: string;
  createdAt: Timestamp;
}

// --- Uretim -------------------------------------------------------------

export interface Project {
  id: UUID;
  slug: string;
  ownerId: UUID;
  title: string;
  summary: string;
  status: 'fikir' | 'prototip' | 'test' | 'yayinda' | 'arsiv';
  topicIds: UUID[];
  provinceCode: string | null;
  districtCode: string | null;
  /** Neden bu proje baslatildi - Neden panosuna baglanir. */
  whyText: string;
  /** Nasil gelistiriliyor: yontem, arac, kaynak. */
  howText: string;
  needs: string;
  communityIds: UUID[];
  startedAt: Timestamp;
  targetEndAt: Timestamp | null;
  emoji: string;
  pitchMediaId: UUID | null;
}

export interface ProjectMember {
  projectId: UUID;
  profileId: UUID;
  roleLabel: string;
}

export interface ProjectUpdate {
  id: UUID;
  projectId: UUID;
  authorId: UUID;
  body: string;
  createdAt: Timestamp;
  milestoneDate: Timestamp | null;
  isMilestone: boolean;
}

// --- Ne zaman -----------------------------------------------------------

export interface AppEvent {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  organizerType: 'profile' | 'community' | 'organization';
  organizerId: UUID;
  startsAt: Timestamp;
  endsAt: Timestamp;
  /** Basvuru son tarihi. "gelecek" filtresinde starts_at ile karistirilmaz. */
  deadlineAt: Timestamp | null;
  provinceCode: string | null;
  districtCode: string | null;
  venue: string | null;
  onlineUrl: string | null;
  mode: 'physical' | 'online' | 'hybrid';
  topicIds: UUID[];
  communityId: UUID | null;
  emoji: string;
}

export interface Reminder {
  id: UUID;
  profileId: UUID;
  eventId: UUID;
  remindAt: Timestamp;
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: Timestamp;
}

// --- Neden --------------------------------------------------------------

export interface WhyStory {
  id: UUID;
  authorId: UUID;
  title: string;
  body: string;
  mediaId: UUID | null;
  linkedEntityType: 'project' | 'profile' | 'community' | null;
  linkedEntityId: UUID | null;
  topicIds: UUID[];
  provinceCode: string | null;
  visibility: 'public' | 'community' | 'profile_only';
  featured: boolean;
  createdAt: Timestamp;
}

// --- Nasil --------------------------------------------------------------

export interface Resource {
  id: UUID;
  title: string;
  summary: string;
  type: 'rehber' | 'baglanti' | 'video' | 'kontrol_listesi' | 'soru_cevap';
  level: 'baslangic' | 'orta' | 'ileri';
  estimatedMinutes: number;
  url: string | null;
  body: string | null;
  communityId: UUID;
  authorId: UUID;
  topicIds: UUID[];
  verificationStatus: 'community' | 'moderator_verified';
  createdAt: Timestamp;
}

// --- nGazete ------------------------------------------------------------

export interface NewspaperIssue {
  id: UUID;
  issueDate: string; // YYYY-MM-DD
  title: string;
  standfirst: string;
  coverEmoji: string;
  theme: string | null;
  publishAt: Timestamp;
  status: 'draft' | 'published';
}

export interface NewspaperItem {
  id: UUID;
  issueId: UUID;
  itemType: 'lead' | 'editorial' | 'local' | 'project_showcase' | 'event_ad' | 'org_ad';
  title: string;
  body: string;
  linkedEntityType: EntityType | null;
  linkedEntityId: UUID | null;
  /** true ise kart zorunlu olarak "Sponsorlu" etiketi tasir. */
  sponsored: boolean;
  sponsorName: string | null;
  position: number;
}

export interface AdRequest {
  id: UUID;
  organizationId: UUID;
  contactEmail: string;
  placementType: 'event_ad' | 'org_ad' | 'project_showcase';
  requestedIssueDate: string | null;
  theme: string | null;
  title: string;
  body: string;
  creativeUrl: string | null;
  linkUrl: string | null;
  status: ModerationStatus;
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
  publishedItemId: UUID | null;
}

// --- Sistem -------------------------------------------------------------

export interface Notification {
  id: UUID;
  profileId: UUID;
  type:
    | 'event_reminder'
    | 'community_application'
    | 'community_joined'
    | 'comment'
    | 'moderation'
    | 'newspaper'
    | 'ad_request';
  title: string;
  body: string;
  entityType: EntityType | 'event' | 'community_application' | 'ad_request' | null;
  entityId: UUID | null;
  href: string | null;
  createdAt: Timestamp;
  readAt: Timestamp | null;
}

export interface Report {
  id: UUID;
  reporterId: UUID;
  entityType: EntityType;
  entityId: UUID;
  reason: string;
  detail: string;
  status: 'open' | 'reviewing' | 'actioned' | 'dismissed';
  createdAt: Timestamp;
}

export interface ModerationAction {
  id: UUID;
  moderatorId: UUID;
  action: string;
  entityType: string;
  entityId: UUID;
  note: string;
  createdAt: Timestamp;
}

export interface AnalyticsEvent {
  id: UUID;
  profileId: UUID | null;
  name: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt: Timestamp;
}

// --- Turetilmis gorunum tipleri ----------------------------------------

/** Siralama motorunun bir gonderi icin urettigi aciklanabilir skor. */
export interface RankedPost {
  post: Post;
  score: number;
  /** Skora katkida bulunan bilesenler - "Neden gosteriliyor?" bunu kullanir. */
  signals: RankingSignals;
  reason: RankingReason | null;
}

export interface RankingSignals {
  topicMatch: number;
  followedSource: number;
  communityMatch: number;
  intentMatch: number;
  recency: number;
  locationMatch: number;
  explorationBonus: number;
}

export interface RankingReason {
  key: keyof RankingSignals;
  label: string;
}
