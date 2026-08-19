/**
 * Arayuze verilen birlestirilmis (hydrated) gorunum tipleri.
 *
 * Sunucu bilesenleri ham tablo satirlari yerine bu tipleri alir; boylece kart
 * bilesenleri ek sorgu yapmak zorunda kalmaz ve veri kaynagi degisse bile
 * (demo store / Supabase) arayuz aynen calisir.
 */

import type { IconName } from '@/components/ui/Icon';
import type {
  AdRequest,
  AppEvent,
  Comment,
  Community,
  CommunityApplication,
  Dimension,
  Media,
  NewspaperIssue,
  NewspaperItem,
  Notification,
  Post,
  Profile,
  Project,
  ProjectUpdate,
  RankingReason,
  Reminder,
  Resource,
  Topic,
  UUID,
  WhyStory,
} from './domain';

/** Kartlarda gosterilen 5N1K baglam chipi. Renk tek basina anlam tasimaz: ikon + metin de vardir. */
export interface ContextChip {
  dimension: Dimension;
  label: string;
  href: string | null;
  /** Uygulama ikon setinden bir ad (emoji degil). */
  icon: IconName;
}

export interface ProfileSummary {
  id: UUID;
  username: string;
  displayName: string;
  avatarEmoji: string;
  avatarTone: string;
  kind: Profile['kind'];
  verified: boolean;
  demo: true;
  role: Profile['role'];
}

export interface CommunitySummary {
  id: UUID;
  slug: string;
  name: string;
  emoji: string;
  kind: Community['kind'];
}

export interface ProjectSummary {
  id: UUID;
  slug: string;
  title: string;
  emoji: string;
  status: Project['status'];
  summary: string;
}

export interface EventSummary {
  id: UUID;
  slug: string;
  title: string;
  emoji: string;
  startsAt: string;
  endsAt: string;
  mode: AppEvent['mode'];
  provinceName: string | null;
  districtName: string | null;
  venue: string | null;
}

export interface WhyStorySummary {
  id: UUID;
  title: string;
  authorName: string;
  hasVideo: boolean;
}

export interface ResourceSummary {
  id: UUID;
  title: string;
  level: Resource['level'];
  type: Resource['type'];
  estimatedMinutes: number;
  verified: boolean;
}

export interface PostView {
  post: Post;
  author: ProfileSummary;
  community: CommunitySummary | null;
  topics: Topic[];
  media: Media[];
  project: ProjectSummary | null;
  event: EventSummary | null;
  whyStory: WhyStorySummary | null;
  resource: ResourceSummary | null;
  chips: ContextChip[];
  provinceName: string | null;
  districtName: string | null;
  viewerLiked: boolean;
  viewerSaved: boolean;
  /** Yalnizca onerilen kartlarda dolu olur (PROJECT_SPEC 12.3). */
  reason: RankingReason | null;
}

export interface CommentView {
  comment: Comment;
  author: ProfileSummary;
}

export interface CommunityView {
  community: Community;
  rootTopic: Topic;
  manager: ProfileSummary | null;
  parentRoot: CommunitySummary | null;
  provinceName: string | null;
  districtName: string | null;
  viewerIsMember: boolean;
  viewerRole: 'member' | 'manager' | 'moderator' | null;
}

export interface ProjectView {
  project: Project;
  owner: ProfileSummary;
  topics: Topic[];
  members: Array<{ profile: ProfileSummary; roleLabel: string }>;
  updates: ProjectUpdate[];
  communities: CommunitySummary[];
  events: EventSummary[];
  whyStories: WhyStorySummary[];
  pitch: Media | null;
  gallery: Media[];
  provinceName: string | null;
  districtName: string | null;
}

export interface EventView {
  event: AppEvent;
  organizerName: string;
  organizerHref: string;
  community: CommunitySummary | null;
  topics: Topic[];
  provinceName: string | null;
  districtName: string | null;
  viewerReminder: Reminder | null;
}

export interface WhyStoryView {
  story: WhyStory;
  author: ProfileSummary;
  topics: Topic[];
  media: Media | null;
  linkedProject: ProjectSummary | null;
  linkedCommunity: CommunitySummary | null;
  linkedProfile: ProfileSummary | null;
  provinceName: string | null;
}

export interface ResourceView {
  resource: Resource;
  author: ProfileSummary;
  community: CommunitySummary;
  topics: Topic[];
}

export interface NewspaperItemView {
  item: NewspaperItem;
  href: string | null;
}

export interface NewspaperIssueView {
  issue: NewspaperIssue;
  items: NewspaperItemView[];
}

export interface ApplicationView {
  application: CommunityApplication;
  applicant: ProfileSummary;
  rootTopic: Topic;
  provinceName: string | null;
  districtName: string | null;
  /** Moderatore gosterilen benzer isimli aktif topluluklar (PROJECT_SPEC 7.3). */
  similarCommunities: CommunitySummary[];
}

export interface AdRequestView {
  request: AdRequest;
  organization: ProfileSummary;
}

export interface NotificationView {
  notification: Notification;
}

/** Haritada bir il icin toplanan sonuc sayilari. */
export interface ProvinceSummary {
  code: string;
  name: string;
  communities: number;
  events: number;
  projects: number;
  posts: number;
  organizations: number;
  people: number;
  total: number;
}

export interface DiscoveryResults {
  communities: CommunityView[];
  events: EventView[];
  projects: ProjectSummary[];
  posts: PostView[];
  profiles: ProfileSummary[];
  organizations: ProfileSummary[];
}
