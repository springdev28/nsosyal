import type {
  AdRequest,
  AnalyticsEvent,
  AppEvent,
  Community,
  CommunityApplication,
  IntentMode,
  Media,
  ModerationStatus,
  NewspaperItem,
  Notification,
  Post,
  Profile,
  Project,
  PublicationBlock,
  PublicationDraft,
  PublicationRect,
  PublicationSlot,
  Reminder,
  Report,
  Resource,
  Topic,
  UUID,
  WhyStory,
} from '@/types/domain';
import type {
  AdRequestView,
  ApplicationView,
  CommentView,
  CommunitySummary,
  CommunityView,
  ContextChip,
  DistrictSummary,
  DiscoveryResults,
  EventSummary,
  EventView,
  NewspaperIssueView,
  PostView,
  ProfileSummary,
  ProjectSummary,
  ProjectView,
  ProvinceSummary,
  ResourceSummary,
  ResourceView,
  WhyStorySummary,
  WhyStoryView,
} from '@/types/view';

import { districtName, provinceName, DISTRICTS, PROVINCES } from '@/lib/geo';
import { placementByCode } from '@/lib/newspaper/inventory';
import { rankPosts, type RankingViewer } from '@/lib/ranking/rank';
import { buildDataset, type Dataset } from '@/lib/seed';
import { uid } from '@/lib/seed/ids';
import {
  addDays,
  eventOverlaps,
  isWithin,
  startOfIstanbulDay,
  toIstanbulDateKey,
  type DateRange,
} from '@/lib/time';

/**
 * Demo veri deposu.
 *
 * Yarisma prototipinin varsayilan veri kaynagi. Tum veri sunucu belleginde
 * tutulur ve her sunucu baslangicinda sentetik seed'den yeniden uretilir.
 * Bunun iki nedeni var:
 *
 * 1) Canli demo dis servise bagimli olmamali (PROJECT_SPEC 15.4).
 * 2) Jurinin depoyu klonlayip tek komutla calistirabilmesi gerekiyor.
 *
 * Sayfalar ve server action'lar veriye yalnizca bu sinifin metotlari uzerinden
 * erisir; hicbiri seed modullerini dogrudan okumaz. Supabase'e gecerken ayni
 * metot imzalarini koruyan bir uygulama yazmak yeterli olacak sekilde tutuldu
 * (bkz. docs/architecture.md).
 */

export interface FeedOptions {
  viewerId: UUID | null;
  /**
   * undefined = cagiran taraf belirtmedi, profilin varsayilani kullanilir.
   * null      = kullanici acikca mod secmedi; yalnizca kalici platform
   *             amaclari isler (PROJECT_SPEC 7.10).
   */
  intentMode?: IntentMode | null;
  communityId?: UUID | null;
  limit?: number;
  /** Yalnizca kisa video gonderileri. */
  shortVideoOnly?: boolean;
  /** "Yeni sesler": az takipcili hesaplarin icerigi (PROJECT_SPEC 12.2). */
  newVoicesOnly?: boolean;
  authorId?: UUID | null;
  projectId?: UUID | null;
}

export interface DiscoveryFilters {
  provinceCode?: string | null;
  districtCode?: string | null;
  topicId?: UUID | null;
  range?: DateRange | null;
  mode?: AppEvent['mode'] | 'all';
  query?: string;
}

export interface PublicationWindow {
  issueDate: string;
  closesAt: string;
  publishesAt: string;
  open: boolean;
  slots: PublicationSlot[];
}

export type PublicationMutationResult =
  | { ok: true; draft: PublicationDraft; slot?: PublicationSlot; price?: number }
  | { ok: false; code: 'invalid' | 'closed' | 'conflict' | 'stale' | 'outside'; message: string };

const NEW_VOICE_THRESHOLD = 120;

const PUBLICATION_COLUMNS = 30;
const PUBLICATION_ROWS = 40;
const PUBLICATION_UNIT_PRICE = 10;
const PUBLICATION_SUBSCRIBER_DISCOUNT = 0.05;

function cleanPublicationRect(rect: PublicationRect): PublicationRect | null {
  const clean = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
  if (
    clean.x < 0 ||
    clean.y < 0 ||
    clean.width < 1 ||
    clean.height < 1 ||
    clean.x + clean.width > PUBLICATION_COLUMNS ||
    clean.y + clean.height > PUBLICATION_ROWS
  ) {
    return null;
  }
  return clean;
}

function publicationRectsOverlap(left: PublicationRect, right: PublicationRect): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function publicationRectContains(parent: PublicationRect, child: PublicationRect): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

function cleanPublicationColor(value: string | undefined, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
}

function publicationLinkAllowed(value: string, subscriber: boolean): boolean {
  if (/^\/(?!\/)[a-z0-9/_?&=.#%-]*$/i.test(value)) return true;
  return subscriber && /^https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/_?&=.#%+-]*)?$/i.test(value);
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .trim();
}

export class DemoStore {
  private data: Dataset;

  constructor(now: Date = new Date()) {
    this.data = buildDataset(now);
  }

  /** Testlerde ve "demoyu sifirla" akisinda kullanilir. */
  reset(now: Date = new Date()): void {
    this.data = buildDataset(now);
  }

  get generatedAt(): string {
    return this.data.generatedAt;
  }

  // --- Temel aramalar ----------------------------------------------------

  getTopics(): Topic[] {
    return this.data.topics;
  }

  getTopic(id: UUID): Topic | null {
    return this.data.topics.find((topic) => topic.id === id) ?? null;
  }

  getTopicBySlug(slug: string): Topic | null {
    return this.data.topics.find((topic) => topic.slug === slug) ?? null;
  }

  getProfile(id: UUID): Profile | null {
    return this.data.profiles.find((profile) => profile.id === id) ?? null;
  }

  getProfileByUsername(username: string): Profile | null {
    return this.data.profiles.find((profile) => profile.username === username) ?? null;
  }

  listProfiles(): Profile[] {
    return this.data.profiles;
  }

  private profileSummary(id: UUID): ProfileSummary {
    const profile = this.getProfile(id);
    if (!profile) {
      // Seed butunlugu bozulmadikca olusmaz; demo sirasinda cokmek yerine
      // fark edilebilir bir yer tutucu gostermeyi tercih ediyoruz.
      return {
        id,
        username: 'bilinmeyen',
        displayName: 'Bilinmeyen hesap',
        avatarEmoji: '❔',
        avatarTone: '#6b7d96',
        avatarUrl: null,
        kind: 'person',
        verified: false,
        demo: true,
        role: 'user',
      };
    }
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarEmoji: profile.avatarEmoji,
      avatarTone: profile.avatarTone,
      avatarUrl: profile.avatarUrl,
      kind: profile.kind,
      verified: profile.verified,
      demo: true,
      role: profile.role,
    };
  }

  getCommunity(id: UUID): Community | null {
    return this.data.communities.find((community) => community.id === id) ?? null;
  }

  getCommunityBySlug(slug: string): Community | null {
    return this.data.communities.find((community) => community.slug === slug) ?? null;
  }

  private communitySummary(id: UUID | null): CommunitySummary | null {
    if (!id) return null;
    const community = this.getCommunity(id);
    if (!community) return null;
    return {
      id: community.id,
      slug: community.slug,
      name: community.name,
      emoji: community.emoji,
      kind: community.kind,
    };
  }

  getProject(id: UUID): Project | null {
    return this.data.projects.find((project) => project.id === id) ?? null;
  }

  getProjectBySlug(slug: string): Project | null {
    return this.data.projects.find((project) => project.slug === slug) ?? null;
  }

  private projectSummary(id: UUID | null): ProjectSummary | null {
    if (!id) return null;
    const project = this.getProject(id);
    if (!project) return null;
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      emoji: project.emoji,
      status: project.status,
      summary: project.summary,
    };
  }

  getEvent(id: UUID): AppEvent | null {
    return this.data.events.find((event) => event.id === id) ?? null;
  }

  getEventBySlug(slug: string): AppEvent | null {
    return this.data.events.find((event) => event.slug === slug) ?? null;
  }

  private eventSummary(id: UUID | null): EventSummary | null {
    if (!id) return null;
    const event = this.getEvent(id);
    if (!event) return null;
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      emoji: event.emoji,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      mode: event.mode,
      provinceName: provinceName(event.provinceCode),
      districtName: districtName(event.districtCode),
      venue: event.venue,
    };
  }

  getMedia(id: UUID): Media | null {
    return this.data.media.find((media) => media.id === id) ?? null;
  }

  getWhyStory(id: UUID): WhyStory | null {
    return this.data.whyStories.find((story) => story.id === id) ?? null;
  }

  private whyStorySummary(id: UUID | null): WhyStorySummary | null {
    if (!id) return null;
    const story = this.getWhyStory(id);
    if (!story) return null;
    return {
      id: story.id,
      title: story.title,
      authorName: this.profileSummary(story.authorId).displayName,
      hasVideo: Boolean(story.mediaId),
    };
  }

  getResource(id: UUID): Resource | null {
    return this.data.resources.find((resource) => resource.id === id) ?? null;
  }

  private resourceSummary(id: UUID | null): ResourceSummary | null {
    if (!id) return null;
    const resource = this.getResource(id);
    if (!resource) return null;
    return {
      id: resource.id,
      title: resource.title,
      level: resource.level,
      type: resource.type,
      estimatedMinutes: resource.estimatedMinutes,
      verified: resource.verificationStatus === 'moderator_verified',
    };
  }

  // --- Izleyici baglami ---------------------------------------------------

  getFollowing(profileId: UUID): UUID[] {
    return this.data.follows.filter((edge) => edge.followerId === profileId).map((edge) => edge.followingId);
  }

  listFollowingProfiles(profileId: UUID): ProfileSummary[] {
    return this.getFollowing(profileId).map((id) => this.profileSummary(id));
  }

  getFollowers(profileId: UUID): UUID[] {
    return this.data.follows.filter((edge) => edge.followingId === profileId).map((edge) => edge.followerId);
  }

  listFollowerProfiles(profileId: UUID): ProfileSummary[] {
    return this.getFollowers(profileId).map((id) => this.profileSummary(id));
  }

  listProfileSuggestions(profileId: UUID, limit = 6): ProfileSummary[] {
    const profile = this.getProfile(profileId);
    if (!profile) return [];
    const following = new Set(this.getFollowing(profileId));
    return this.data.profiles
      .filter((candidate) => candidate.id !== profileId && !following.has(candidate.id))
      .map((candidate) => ({
        candidate,
        overlap: candidate.topicIds.filter((topicId) => profile.topicIds.includes(topicId)).length,
      }))
      .sort((left, right) => right.overlap - left.overlap || right.candidate.followerCount - left.candidate.followerCount)
      .slice(0, limit)
      .map(({ candidate }) => this.profileSummary(candidate.id));
  }

  isFollowing(followerId: UUID, followingId: UUID): boolean {
    return this.data.follows.some(
      (edge) => edge.followerId === followerId && edge.followingId === followingId,
    );
  }

  hasFollowRequest(requesterId: UUID, targetId: UUID): boolean {
    return this.data.followRequests.some(
      (request) => request.requesterId === requesterId && request.targetId === targetId,
    );
  }

  listFollowRequestProfiles(targetId: UUID): ProfileSummary[] {
    return this.data.followRequests
      .filter((request) => request.targetId === targetId)
      .map((request) => this.profileSummary(request.requesterId));
  }

  canViewProfile(profileId: UUID, viewerId: UUID | null): boolean {
    const profile = this.getProfile(profileId);
    if (!profile || !profile.isPrivate) return true;
    return viewerId === profileId || Boolean(viewerId && this.isFollowing(viewerId, profileId));
  }

  getMemberCommunityIds(profileId: UUID): UUID[] {
    return this.data.communityMembers
      .filter((member) => member.profileId === profileId)
      .map((member) => member.communityId);
  }

  getCommunityRole(communityId: UUID, profileId: UUID | null): 'member' | 'manager' | 'moderator' | null {
    if (!profileId) return null;
    return (
      this.data.communityMembers.find(
        (member) => member.communityId === communityId && member.profileId === profileId,
      )?.role ?? null
    );
  }

  private rankingViewer(profileId: UUID | null, intentMode?: IntentMode | null): RankingViewer {
    const profile = profileId ? this.getProfile(profileId) : null;
    return {
      id: profile?.id ?? 'anonymous',
      topicIds: profile?.topicIds ?? [],
      followingIds: profile ? this.getFollowing(profile.id) : [],
      communityIds: profile ? this.getMemberCommunityIds(profile.id) : [],
      provinceCode: profile?.provinceCode ?? null,
      districtCode: profile?.districtCode ?? null,
      goalKeys: profile?.goalKeys ?? [],
      // undefined = "cagiran taraf mod belirtmedi, profilin varsayilanini kullan".
      // null = "kullanici acikca mod secmedi". Ikisi ayni sey degil.
      intentMode: intentMode === undefined ? (profile?.intentMode ?? null) : intentMode,
    };
  }

  // --- Akis ---------------------------------------------------------------

  private followerCounts(): Record<UUID, number> {
    const counts: Record<UUID, number> = {};
    for (const profile of this.data.profiles) counts[profile.id] = profile.followerCount;
    return counts;
  }

  private topicNames(): Record<UUID, string> {
    return Object.fromEntries(this.data.topics.map((topic) => [topic.id, topic.name]));
  }

  private provinceNames(): Record<string, string> {
    return Object.fromEntries(PROVINCES.map((province) => [province.code, province.name]));
  }

  getFeed(options: FeedOptions): PostView[] {
    const { viewerId, intentMode, communityId, limit = 40 } = options;

    let candidates = this.data.posts;
    if (communityId) candidates = candidates.filter((post) => post.communityId === communityId);
    if (options.shortVideoOnly) candidates = candidates.filter((post) => post.isShortVideo);
    if (options.authorId) candidates = candidates.filter((post) => post.authorId === options.authorId);
    if (options.projectId) candidates = candidates.filter((post) => post.projectId === options.projectId);
    if (options.newVoicesOnly) {
      candidates = candidates.filter((post) => {
        const author = this.getProfile(post.authorId);
        return (author?.followerCount ?? 0) < NEW_VOICE_THRESHOLD;
      });
    }

    const viewer = this.rankingViewer(viewerId, intentMode);
    const ranked = rankPosts(candidates, {
      viewer,
      now: new Date(),
      followerCounts: this.followerCounts(),
      topicNames: this.topicNames(),
      provinceNames: this.provinceNames(),
    });

    return ranked.slice(0, limit).map((entry) => this.toPostView(entry.post, viewerId, entry.reason));
  }

  getPost(id: UUID): Post | null {
    return this.data.posts.find((post) => post.id === id) ?? null;
  }

  getPostView(id: UUID, viewerId: UUID | null): PostView | null {
    const post = this.getPost(id);
    return post ? this.toPostView(post, viewerId, null) : null;
  }

  getComments(postId: UUID): CommentView[] {
    return this.data.comments
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((comment) => ({ comment, author: this.profileSummary(comment.authorId) }));
  }

  listCommentsByAuthor(profileId: UUID): CommentView[] {
    return this.data.comments
      .filter((comment) => comment.authorId === profileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((comment) => ({ comment, author: this.profileSummary(comment.authorId) }));
  }

  /**
   * Bir gonderiyi kart icin hazirlar ve 5N1K baglam chiplerini uretir.
   * Chipler yalnizca gercekten var olan baglamlar icin eklenir; kartin ustu
   * gereksiz etiketle doldurulmaz (PROJECT_SPEC 7.1).
   */
  private toPostView(post: Post, viewerId: UUID | null, reason: PostView['reason']): PostView {
    const topics = post.topicIds.map((id) => this.getTopic(id)).filter((topic): topic is Topic => Boolean(topic));
    const media = post.mediaIds.map((id) => this.getMedia(id)).filter((item): item is Media => Boolean(item));
    const community = this.communitySummary(post.communityId);
    const project = this.projectSummary(post.projectId);
    const event = this.eventSummary(post.eventId);
    const whyStory = this.whyStorySummary(post.whyStoryId);
    const resource = this.resourceSummary(post.resourceId);

    // Chip ikonlari uygulama ikon setinden gelir (emoji degil).
    const chips: ContextChip[] = [];
    const topic = topics[0];
    if (topic) {
      chips.push({ dimension: 'ne', label: topic.name, href: `/explore?topic=${topic.slug}`, icon: 'tag' });
    }
    const place = districtName(post.districtCode) ?? provinceName(post.provinceCode);
    if (place) {
      chips.push({
        dimension: 'nerede',
        label: place,
        href: `/explore/map?province=${post.provinceCode}${post.districtCode ? `&district=${post.districtCode}` : ''}`,
        icon: 'mapPin',
      });
    }
    if (event) {
      chips.push({ dimension: 'nezaman', label: 'Etkinlik', href: `/events/${event.slug}`, icon: 'calendar' });
    }
    if (resource) {
      chips.push({ dimension: 'nasil', label: 'Kaynak', href: `/explore/how?resource=${resource.id}`, icon: 'route' });
    }
    if (whyStory) {
      chips.push({ dimension: 'neden', label: 'Neden hikâyesi', href: `/explore/why/${whyStory.id}`, icon: 'spark' });
    }

    return {
      post,
      author: this.profileSummary(post.authorId),
      community,
      topics,
      media,
      project,
      event,
      whyStory,
      resource,
      chips,
      provinceName: provinceName(post.provinceCode),
      districtName: districtName(post.districtCode),
      viewerLiked: viewerId
        ? this.data.likes.some((like) => like.profileId === viewerId && like.postId === post.id)
        : false,
      viewerSaved: viewerId
        ? this.data.saves.some((save) => save.profileId === viewerId && save.postId === post.id)
        : false,
      reason,
    };
  }

  // --- Topluluklar --------------------------------------------------------

  listCommunities(filters: { kind?: Community['kind']; provinceCode?: string | null; topicId?: UUID | null } = {}): Community[] {
    return this.data.communities.filter((community) => {
      if (community.status !== 'active') return false;
      if (filters.kind && community.kind !== filters.kind) return false;
      if (filters.provinceCode && community.provinceCode !== filters.provinceCode) return false;
      if (filters.topicId && community.rootTopicId !== filters.topicId) return false;
      return true;
    });
  }

  getCommunityView(slug: string, viewerId: UUID | null): CommunityView | null {
    const community = this.getCommunityBySlug(slug);
    if (!community) return null;

    const rootTopic = this.getTopic(community.rootTopicId);
    if (!rootTopic) return null;

    const parentRoot =
      community.kind === 'branch'
        ? (this.data.communities.find((c) => c.kind === 'root' && c.rootTopicId === community.rootTopicId) ?? null)
        : null;

    const managerEntry = this.data.communityMembers.find(
      (member) => member.communityId === community.id && member.role === 'manager',
    );

    return {
      community,
      rootTopic,
      manager: managerEntry ? this.profileSummary(managerEntry.profileId) : null,
      parentRoot: parentRoot ? this.communitySummary(parentRoot.id) : null,
      provinceName: provinceName(community.provinceCode),
      districtName: districtName(community.districtCode),
      viewerIsMember: viewerId ? this.getCommunityRole(community.id, viewerId) !== null : false,
      viewerRole: this.getCommunityRole(community.id, viewerId),
    };
  }

  getCommunityMembers(communityId: UUID): Array<{ profile: ProfileSummary; role: string }> {
    return this.data.communityMembers
      .filter((member) => member.communityId === communityId)
      .map((member) => ({ profile: this.profileSummary(member.profileId), role: member.role }));
  }

  getCommunityResources(
    communityId: UUID,
    filters: { level?: Resource['level'] | 'all'; type?: Resource['type'] | 'all' } = {},
  ): ResourceView[] {
    return this.data.resources
      .filter((resource) => resource.communityId === communityId)
      .filter((resource) => !filters.level || filters.level === 'all' || resource.level === filters.level)
      .filter((resource) => !filters.type || filters.type === 'all' || resource.type === filters.type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((resource) => this.toResourceView(resource));
  }

  private toResourceView(resource: Resource): ResourceView {
    return {
      resource,
      author: this.profileSummary(resource.authorId),
      community: this.communitySummary(resource.communityId) ?? {
        id: resource.communityId,
        slug: 'bilinmeyen',
        name: 'Bilinmeyen topluluk',
        emoji: '❔',
        kind: 'branch',
      },
      topics: resource.topicIds.map((id) => this.getTopic(id)).filter((t): t is Topic => Boolean(t)),
    };
  }

  listResources(
    filters: { level?: Resource['level'] | 'all'; type?: Resource['type'] | 'all'; topicId?: UUID | null; query?: string } = {},
  ): ResourceView[] {
    const query = filters.query ? normalize(filters.query) : null;
    return this.data.resources
      .filter((resource) => !filters.level || filters.level === 'all' || resource.level === filters.level)
      .filter((resource) => !filters.type || filters.type === 'all' || resource.type === filters.type)
      .filter((resource) => !filters.topicId || resource.topicIds.includes(filters.topicId))
      .filter((resource) => !query || normalize(`${resource.title} ${resource.summary}`).includes(query))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((resource) => this.toResourceView(resource));
  }

  getCommunityEvents(communityId: UUID): EventSummary[] {
    return this.data.events
      .filter((event) => event.communityId === communityId)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .map((event) => this.eventSummary(event.id))
      .filter((summary): summary is EventSummary => Boolean(summary));
  }

  getCommunityProjects(communityId: UUID): ProjectSummary[] {
    return this.data.projects
      .filter((project) => project.communityIds.includes(communityId))
      .map((project) => this.projectSummary(project.id))
      .filter((summary): summary is ProjectSummary => Boolean(summary));
  }

  // --- Projeler -----------------------------------------------------------

  listProjects(filters: { topicId?: UUID | null; provinceCode?: string | null; query?: string } = {}): ProjectSummary[] {
    const query = filters.query ? normalize(filters.query) : null;
    return this.data.projects
      .filter((project) => !filters.topicId || project.topicIds.includes(filters.topicId))
      .filter((project) => !filters.provinceCode || project.provinceCode === filters.provinceCode)
      .filter((project) => !query || normalize(`${project.title} ${project.summary}`).includes(query))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map((project) => this.projectSummary(project.id))
      .filter((summary): summary is ProjectSummary => Boolean(summary));
  }

  getProjectView(slug: string): ProjectView | null {
    const project = this.getProjectBySlug(slug);
    if (!project) return null;

    const members = this.data.projectMembers
      .filter((member) => member.projectId === project.id)
      .map((member) => ({ profile: this.profileSummary(member.profileId), roleLabel: member.roleLabel }));

    const updates = this.data.projectUpdates
      .filter((update) => update.projectId === project.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const communities = project.communityIds
      .map((id) => this.communitySummary(id))
      .filter((summary): summary is CommunitySummary => Boolean(summary));

    // Projeye bagli etkinlikler: projenin topluluklarindaki gelecek etkinlikler.
    const events = this.data.events
      .filter((event) => event.communityId && project.communityIds.includes(event.communityId))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .map((event) => this.eventSummary(event.id))
      .filter((summary): summary is EventSummary => Boolean(summary));

    const whyStories = this.data.whyStories
      .filter((story) => story.linkedEntityType === 'project' && story.linkedEntityId === project.id)
      .map((story) => this.whyStorySummary(story.id))
      .filter((summary): summary is WhyStorySummary => Boolean(summary));

    // Galeri: bu projeye bagli gonderilerin gorselleri ve videolari.
    const gallery = this.data.posts
      .filter((post) => post.projectId === project.id)
      .flatMap((post) => post.mediaIds)
      .map((id) => this.getMedia(id))
      .filter((media): media is Media => Boolean(media));

    return {
      project,
      owner: this.profileSummary(project.ownerId),
      topics: project.topicIds.map((id) => this.getTopic(id)).filter((t): t is Topic => Boolean(t)),
      members,
      updates,
      communities,
      events,
      whyStories,
      pitch: project.pitchMediaId ? this.getMedia(project.pitchMediaId) : null,
      gallery,
      provinceName: provinceName(project.provinceCode),
      districtName: districtName(project.districtCode),
    };
  }

  // --- Etkinlikler ve hatirlatmalar --------------------------------------

  listEvents(filters: DiscoveryFilters & { viewerId?: UUID | null } = {}): EventView[] {
    const query = filters.query ? normalize(filters.query) : null;

    return this.data.events
      .filter((event) => !filters.provinceCode || event.provinceCode === filters.provinceCode)
      .filter((event) => !filters.districtCode || event.districtCode === filters.districtCode)
      .filter((event) => !filters.topicId || event.topicIds.includes(filters.topicId))
      .filter((event) => !filters.mode || filters.mode === 'all' || event.mode === filters.mode)
      .filter((event) => eventOverlaps(filters.range ?? null, event.startsAt, event.endsAt))
      .filter((event) => !query || normalize(`${event.title} ${event.description}`).includes(query))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .map((event) => this.toEventView(event, filters.viewerId ?? null));
  }

  getEventView(slug: string, viewerId: UUID | null): EventView | null {
    const event = this.getEventBySlug(slug);
    return event ? this.toEventView(event, viewerId) : null;
  }

  private toEventView(event: AppEvent, viewerId: UUID | null): EventView {
    const community = event.communityId ? this.communitySummary(event.communityId) : null;

    let organizerName = 'Bilinmeyen';
    let organizerHref = '#';
    if (event.organizerType === 'community') {
      const organizerCommunity = this.getCommunity(event.organizerId);
      organizerName = organizerCommunity?.name ?? organizerName;
      organizerHref = organizerCommunity ? `/communities/${organizerCommunity.slug}` : '#';
    } else {
      const profile = this.getProfile(event.organizerId);
      organizerName = profile?.displayName ?? organizerName;
      organizerHref = profile ? `/profile/${profile.username}` : '#';
    }

    return {
      event,
      organizerName,
      organizerHref,
      community,
      topics: event.topicIds.map((id) => this.getTopic(id)).filter((t): t is Topic => Boolean(t)),
      provinceName: provinceName(event.provinceCode),
      districtName: districtName(event.districtCode),
      viewerReminder: viewerId
        ? (this.data.reminders.find(
            (reminder) =>
              reminder.profileId === viewerId && reminder.eventId === event.id && reminder.status === 'scheduled',
          ) ?? null)
        : null,
    };
  }

  getReminders(profileId: UUID): Array<{ reminder: Reminder; event: EventSummary }> {
    return this.data.reminders
      .filter((reminder) => reminder.profileId === profileId && reminder.status === 'scheduled')
      .map((reminder) => ({ reminder, event: this.eventSummary(reminder.eventId) }))
      .filter((entry): entry is { reminder: Reminder; event: EventSummary } => Boolean(entry.event))
      .sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
  }

  // --- Neden panosu -------------------------------------------------------

  listWhyStories(
    filters: {
      topicId?: UUID | null;
      featuredOnly?: boolean;
      viewerId?: UUID | null;
      followingOnly?: boolean;
      myCommunitiesOnly?: boolean;
      query?: string;
    } = {},
  ): WhyStoryView[] {
    const following = filters.viewerId ? this.getFollowing(filters.viewerId) : [];
    const communityIds = filters.viewerId ? this.getMemberCommunityIds(filters.viewerId) : [];
    const query = filters.query ? normalize(filters.query) : null;

    return this.data.whyStories
      .filter((story) => story.visibility === 'public')
      .filter((story) => !filters.topicId || story.topicIds.includes(filters.topicId))
      .filter((story) => !filters.featuredOnly || story.featured)
      .filter((story) => !filters.followingOnly || following.includes(story.authorId))
      .filter((story) => {
        if (!filters.myCommunitiesOnly) return true;
        if (story.linkedEntityType === 'community' && story.linkedEntityId) {
          return communityIds.includes(story.linkedEntityId);
        }
        if (story.linkedEntityType === 'project' && story.linkedEntityId) {
          const project = this.getProject(story.linkedEntityId);
          return Boolean(project?.communityIds.some((id) => communityIds.includes(id)));
        }
        return false;
      })
      .filter((story) => !query || normalize(`${story.title} ${story.body}`).includes(query))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((story) => this.toWhyStoryView(story));
  }

  getWhyStoryView(id: UUID): WhyStoryView | null {
    const story = this.getWhyStory(id);
    return story ? this.toWhyStoryView(story) : null;
  }

  private toWhyStoryView(story: WhyStory): WhyStoryView {
    return {
      story,
      author: this.profileSummary(story.authorId),
      topics: story.topicIds.map((id) => this.getTopic(id)).filter((t): t is Topic => Boolean(t)),
      media: story.mediaId ? this.getMedia(story.mediaId) : null,
      linkedProject:
        story.linkedEntityType === 'project' ? this.projectSummary(story.linkedEntityId) : null,
      linkedCommunity:
        story.linkedEntityType === 'community' ? this.communitySummary(story.linkedEntityId) : null,
      linkedProfile:
        story.linkedEntityType === 'profile' && story.linkedEntityId
          ? this.profileSummary(story.linkedEntityId)
          : null,
      provinceName: provinceName(story.provinceCode),
    };
  }

  // --- Harita ozetleri ----------------------------------------------------

  /** Her il icin sonuc sayilari - haritanin ve erisilebilir liste gorunumunun kaynagi. */
  getProvinceSummaries(filters: DiscoveryFilters = {}): ProvinceSummary[] {
    return PROVINCES.map((province) => {
      const results = this.discover({ ...filters, provinceCode: province.code, districtCode: null });
      const total =
        results.communities.length +
        results.events.length +
        results.projects.length +
        results.posts.length +
        results.organizations.length +
        results.profiles.length;

      return {
        code: province.code,
        name: province.name,
        communities: results.communities.length,
        events: results.events.length,
        projects: results.projects.length,
        posts: results.posts.length,
        organizations: results.organizations.length,
        people: results.profiles.length,
        total,
      };
    });
  }

  /** Seçili il için ilçe choropleth'inin ve erişilebilir listenin kaynağı. */
  getDistrictSummaries(provinceCode: string, filters: DiscoveryFilters = {}): DistrictSummary[] {
    return DISTRICTS.filter((district) => district.provinceCode === provinceCode).map((district) => {
      const results = this.discover({ ...filters, provinceCode, districtCode: district.code });
      const total =
        results.communities.length +
        results.events.length +
        results.projects.length +
        results.posts.length +
        results.organizations.length +
        results.profiles.length;

      return {
        code: district.code,
        provinceCode,
        name: district.name,
        communities: results.communities.length,
        events: results.events.length,
        projects: results.projects.length,
        posts: results.posts.length,
        organizations: results.organizations.length,
        people: results.profiles.length,
        total,
      };
    });
  }

  /**
   * Konum + zaman + konu filtreleriyle butun varlik turlerinde arama.
   *
   * Mahremiyet kurali: kisiler yalnizca konum gorunurlugune izin verdikleri
   * olcude listelenir ve hicbir zaman kesin koordinatla gosterilmez
   * (PROJECT_SPEC 11.1).
   */
  discover(filters: DiscoveryFilters & { viewerId?: UUID | null } = {}): DiscoveryResults {
    const query = filters.query ? normalize(filters.query) : null;
    const matchesQuery = (text: string) => !query || normalize(text).includes(query);

    const communities = this.data.communities
      .filter((community) => community.status === 'active')
      .filter((community) => !filters.provinceCode || community.provinceCode === filters.provinceCode)
      .filter((community) => !filters.districtCode || community.districtCode === filters.districtCode)
      .filter((community) => !filters.topicId || community.rootTopicId === filters.topicId)
      .filter((community) => {
        if (!filters.mode || filters.mode === 'all') return true;
        if (filters.mode === 'online') return community.scope === 'online';
        return community.scope !== 'online';
      })
      .filter((community) => matchesQuery(`${community.name} ${community.description}`))
      .map((community) => this.getCommunityView(community.slug, filters.viewerId ?? null))
      .filter((view): view is CommunityView => Boolean(view));

    const events = this.listEvents({ ...filters, viewerId: filters.viewerId ?? null });

    const projects = this.data.projects
      .filter((project) => !filters.provinceCode || project.provinceCode === filters.provinceCode)
      .filter((project) => !filters.districtCode || project.districtCode === filters.districtCode)
      .filter((project) => !filters.topicId || project.topicIds.includes(filters.topicId))
      .filter((project) => isWithin(filters.range ?? null, project.startedAt) || !filters.range)
      .filter((project) => matchesQuery(`${project.title} ${project.summary}`))
      .map((project) => this.projectSummary(project.id))
      .filter((summary): summary is ProjectSummary => Boolean(summary));

    const posts = this.data.posts
      .filter((post) => !filters.provinceCode || post.provinceCode === filters.provinceCode)
      .filter((post) => !filters.districtCode || post.districtCode === filters.districtCode)
      .filter((post) => !filters.topicId || post.topicIds.includes(filters.topicId))
      .filter((post) => isWithin(filters.range ?? null, post.createdAt))
      .filter((post) => matchesQuery(post.body))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((post) => this.toPostView(post, filters.viewerId ?? null, null));

    const visibleProfiles = this.data.profiles
      .filter((profile) => profile.locationVisibility === 'province' || profile.locationVisibility === 'district')
      .filter((profile) => !filters.provinceCode || profile.provinceCode === filters.provinceCode)
      .filter((profile) => {
        if (!filters.districtCode) return true;
        // Yalnizca ilce gorunurlugu acik olanlar ilce filtresinde cikar.
        return profile.locationVisibility === 'district' && profile.districtCode === filters.districtCode;
      })
      .filter((profile) => !filters.topicId || profile.topicIds.includes(filters.topicId))
      .filter((profile) => matchesQuery(`${profile.displayName} ${profile.bio}`));

    return {
      communities,
      events,
      projects,
      posts,
      profiles: visibleProfiles.filter((p) => p.kind === 'person').map((p) => this.profileSummary(p.id)),
      organizations: visibleProfiles.filter((p) => p.kind === 'organization').map((p) => this.profileSummary(p.id)),
    };
  }

  // --- nGazete ------------------------------------------------------------

  listIssues(): NewspaperIssueView[] {
    return this.data.newspaperIssues
      .filter((issue) => issue.status === 'published')
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .map((issue) => this.toIssueView(issue.id));
  }

  getLatestIssue(): NewspaperIssueView | null {
    return this.listIssues()[0] ?? null;
  }

  getIssueByDate(issueDate: string): NewspaperIssueView | null {
    const issue = this.data.newspaperIssues.find((entry) => entry.issueDate === issueDate);
    return issue ? this.toIssueView(issue.id) : null;
  }

  private toIssueView(issueId: UUID): NewspaperIssueView {
    const issue = this.data.newspaperIssues.find((entry) => entry.id === issueId)!;
    const items = this.data.newspaperItems
      .filter((item) => item.issueId === issueId)
      .sort((a, b) => a.publicationOrder - b.publicationOrder)
      .map((item) => ({
        item,
        // Ic baglanti oncelikli; yoksa kartin kendi hedef adresi kullanilir.
        href:
          this.newspaperItemHref(item.linkedEntityType, item.linkedEntityId) ?? item.targetUrl,
      }));
    return { issue, items };
  }

  private newspaperItemHref(type: string | null, id: UUID | null): string | null {
    if (!type || !id) return null;
    switch (type) {
      case 'event': {
        const event = this.getEvent(id);
        return event ? `/events/${event.slug}` : null;
      }
      case 'project': {
        const project = this.getProject(id);
        return project ? `/projects/${project.slug}` : null;
      }
      case 'community': {
        const community = this.getCommunity(id);
        return community ? `/communities/${community.slug}` : null;
      }
      case 'why_story':
        return `/explore/why/${id}`;
      case 'profile': {
        const profile = this.getProfile(id);
        return profile ? `/profile/${profile.username}` : null;
      }
      default:
        return null;
    }
  }

  /** Bugun yayimlanmis bir sayi var mi? Ilk oturumda otomatik acilma bunu kullanir. */
  hasIssueForToday(now: Date = new Date()): boolean {
    const key = toIstanbulDateKey(now);
    return this.data.newspaperIssues.some((issue) => issue.issueDate === key && issue.status === 'published');
  }

  // --- Yayin Atolyesi ----------------------------------------------------

  listPublicationWindows(now: Date = new Date()): PublicationWindow[] {
    const today = startOfIstanbulDay(now);
    let firstIssue = addDays(today, 1);
    // Bir sonraki sayinin taslagi onceki gun Istanbul saatiyle 20.00'de kapanir.
    if (now.getTime() >= firstIssue.getTime() - 4 * 3_600_000) {
      firstIssue = addDays(firstIssue, 1);
    }

    return Array.from({ length: 7 }, (_, index) => {
      const issueStart = addDays(firstIssue, index);
      const issueDate = toIstanbulDateKey(issueStart);
      const closesAt = new Date(issueStart.getTime() - 4 * 3_600_000);
      return {
        issueDate,
        closesAt: closesAt.toISOString(),
        publishesAt: new Date(issueStart.getTime() + 6 * 3_600_000).toISOString(),
        open: now.getTime() < closesAt.getTime(),
        slots: this.data.publicationSlots
          .filter((slot) => slot.issueDate === issueDate)
          .sort((a, b) => a.page - b.page || a.rect.y - b.rect.y || a.rect.x - b.rect.x),
      };
    });
  }

  listPublicationDrafts(ownerId: UUID): PublicationDraft[] {
    return this.data.publicationDrafts
      .filter((draft) => draft.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getPublicationDraft(draftId: UUID, ownerId: UUID): PublicationDraft | null {
    return this.data.publicationDrafts.find((draft) => draft.id === draftId && draft.ownerId === ownerId) ?? null;
  }

  startPublicationDraft(
    ownerId: UUID,
    input: { issueDate: string; page: number; rect: PublicationRect; anonymous?: boolean },
    now: Date = new Date(),
  ): PublicationMutationResult {
    const rect = cleanPublicationRect(input.rect);
    if (!rect || input.page < 1 || input.page > 5) {
      return { ok: false, code: 'invalid', message: 'Alan 30×40 sayfanın içinde ve 1–5. sayfalardan birinde olmalı.' };
    }
    if (!this.listPublicationWindows(now).some((window) => window.issueDate === input.issueDate && window.open)) {
      return { ok: false, code: 'closed', message: 'Bu sayının taslak süresi kapandı. Açık sayılardan birini seç.' };
    }

    const existing = this.data.publicationDrafts.find(
      (draft) =>
        draft.ownerId === ownerId &&
        draft.issueDate === input.issueDate &&
        draft.page === input.page &&
        draft.status !== 'paid',
    );
    if (existing) return { ok: true, draft: existing };

    const stamp = now.toISOString();
    const profile = this.getProfile(ownerId);
    const draft: PublicationDraft = {
      id: this.nextId('publication-draft'),
      ownerId,
      issueDate: input.issueDate,
      page: input.page,
      rect,
      blocks: [],
      archivedBlocks: [],
      status: 'editing',
      moderationStatus: 'not_submitted',
      subscriber: profile?.publicationSubscriber === true,
      anonymous: input.anonymous ?? profile?.publicationAnonymousByDefault ?? false,
      revision: 1,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.data.publicationDrafts.unshift(draft);
    return { ok: true, draft };
  }

  resizePublicationDraft(
    ownerId: UUID,
    draftId: UUID,
    rectInput: PublicationRect,
    revision: number,
    now: Date = new Date(),
  ): PublicationMutationResult {
    const draft = this.getPublicationDraft(draftId, ownerId);
    const rect = cleanPublicationRect(rectInput);
    if (!draft || !rect) return { ok: false, code: 'invalid', message: 'Taslak veya alan geçerli değil.' };
    if (draft.revision !== revision) {
      return { ok: false, code: 'stale', message: 'Taslak başka bir işlemde değişti. Yenileyip tekrar dene.' };
    }
    if (!this.listPublicationWindows(now).some((window) => window.issueDate === draft.issueDate && window.open)) {
      return { ok: false, code: 'closed', message: 'Bu sayının taslak süresi kapandı.' };
    }

    draft.archivedBlocks.push(...draft.blocks.map((block) => ({ ...block, archived: true })));
    draft.blocks = [];
    draft.rect = rect;
    draft.status = 'editing';
    draft.moderationStatus = 'not_submitted';
    draft.revision += 1;
    draft.updatedAt = now.toISOString();
    this.data.publicationSlots = this.data.publicationSlots.filter(
      (slot) => slot.draftId !== draft.id || slot.status === 'paid',
    );
    return { ok: true, draft };
  }

  savePublicationDraft(
    ownerId: UUID,
    draftId: UUID,
    input: { blocks: PublicationBlock[]; anonymous: boolean; revision: number; submit?: boolean },
    now: Date = new Date(),
  ): PublicationMutationResult {
    const draft = this.getPublicationDraft(draftId, ownerId);
    if (!draft) return { ok: false, code: 'invalid', message: 'Taslak bulunamadı.' };
    if (draft.revision !== input.revision) {
      return { ok: false, code: 'stale', message: 'Taslak sunucuda değişti. Yenileyip tekrar dene.' };
    }
    if (!this.listPublicationWindows(now).some((window) => window.issueDate === draft.issueDate && window.open)) {
      return { ok: false, code: 'closed', message: 'Bu sayının taslak süresi kapandı.' };
    }

    const profile = this.getProfile(ownerId);
    const subscriber = profile?.publicationSubscriber === true;
    const blocks = input.blocks.map((block) => ({
      ...block,
      content: block.content.slice(0, 4_000),
      altText: block.altText.slice(0, 300),
      borderRadius: Math.max(0, Math.min(48, Math.round(block.borderRadius))),
      opacity: Math.max(0.2, Math.min(1, block.opacity ?? 1)),
      borderWidth: Math.max(0, Math.min(8, Math.round(block.borderWidth ?? 0))),
      borderColor: (block.borderColor ?? '#3D9BFF').slice(0, 24),
      textAlign: block.textAlign ?? 'left',
      imageFilter: block.imageFilter ?? 'none',
      rotation: Math.max(-180, Math.min(180, Math.round(block.rotation ?? 0))),
      padding: Math.max(0, Math.min(48, Math.round(block.padding ?? 8))),
      backgroundColor: (block.backgroundColor ?? '#FFFFFF').slice(0, 24),
      shadow: block.shadow ?? 'none',
      fontFamily: block.fontFamily ?? 'sans',
      fontSize: Math.max(8, Math.min(96, Math.round(block.fontSize ?? 16))),
      fontWeight: block.fontWeight ?? 400,
      fontStyle: block.fontStyle ?? 'normal',
      textDecoration: block.textDecoration ?? 'none',
      letterSpacing: Math.max(-1, Math.min(12, block.letterSpacing ?? 0)),
      lineHeight: Math.max(0.8, Math.min(2.5, block.lineHeight ?? 1.35)),
      paragraphIndent: Math.max(0, Math.min(64, Math.round(block.paragraphIndent ?? 0))),
      verticalAlign: block.verticalAlign ?? 'top',
      textTransform: block.textTransform ?? 'none',
      flipX: Boolean(block.flipX),
      flipY: Boolean(block.flipY),
      brightness: Math.max(0.5, Math.min(1.5, block.brightness ?? 1)),
      contrast: Math.max(0.5, Math.min(1.5, block.contrast ?? 1)),
      saturation: Math.max(0, Math.min(2, block.saturation ?? 1)),
      resourceId: typeof block.resourceId === 'string' ? block.resourceId.slice(0, 80) : undefined,
      animation: ['none', 'float', 'pulse', 'drift', 'wave', 'shine'].includes(block.animation ?? '')
        ? block.animation
        : 'none',
      role: block.role,
      linkUrl: typeof block.linkUrl === 'string' ? block.linkUrl.trim().slice(0, 500) : undefined,
      buttonVariant: ['pill', 'rounded', 'square', 'outline', 'gradient'].includes(block.buttonVariant ?? '')
        ? block.buttonVariant
        : 'rounded',
      gradientFrom: cleanPublicationColor(block.gradientFrom, '#35C9E8'),
      gradientTo: cleanPublicationColor(block.gradientTo, '#3156F5'),
      archived: false,
    }));
    if (blocks.some((block) => !cleanPublicationRect(block) || !publicationRectContains(draft.rect, block))) {
      return {
        ok: false,
        code: 'outside',
        message: 'Kırmızı işaretli tasarım bloklarını seçili alanın içine taşımalısın.',
      };
    }

    const creatives = blocks.filter((block) => block.role === 'creative');
    const buttons = blocks.filter((block) => block.role === 'cta');
    if (creatives.length > 1 || blocks.some((block) => !['creative', 'cta'].includes(block.role ?? ''))) {
      return { ok: false, code: 'invalid', message: 'Bir ilanda tek tasarım dosyası ve CTA butonları bulunabilir.' };
    }
    if (creatives.some((block) => block.type !== 'image' || !/^\/uploads\/publication\/[a-z0-9._-]+$/i.test(block.content))) {
      return { ok: false, code: 'invalid', message: 'Tasarım dosyasını Yayın Atölyesi yükleme alanından eklemelisin.' };
    }
    if (creatives.some((block) => block.altText.trim().length < 3)) {
      return { ok: false, code: 'invalid', message: 'Yüklenen tasarım için kısa bir görsel açıklaması gir.' };
    }
    const buttonLimit = subscriber ? 3 : 1;
    if (buttons.length > buttonLimit) {
      return { ok: false, code: 'invalid', message: `Bu hesap en fazla ${buttonLimit} CTA butonu kullanabilir.` };
    }
    if (buttons.some((block) => block.type !== 'shape' || block.content.trim().length < 2 || !publicationLinkAllowed(block.linkUrl ?? '', subscriber))) {
      return {
        ok: false,
        code: 'invalid',
        message: subscriber
          ? 'Buton metni ve geçerli bir nSosyal ya da https bağlantısı gir.'
          : 'Standart hesap butonları yalnızca /profile, /post, /project veya /explore gibi nSosyal bağlantılarına gidebilir.',
      };
    }
    if (!subscriber && buttons.some((block) => block.buttonVariant === 'gradient' || block.animation !== 'none')) {
      return { ok: false, code: 'invalid', message: 'Özel gradyan ve hareketli butonlar Yayınevi aboneliğine dahildir.' };
    }
    if (input.submit && creatives.length !== 1) {
      return { ok: false, code: 'invalid', message: 'Önizleme ve ödeme için önce tasarım dosyanı yüklemelisin.' };
    }

    draft.blocks = blocks;
    draft.anonymous = input.anonymous;
    draft.subscriber = subscriber;
    draft.status = input.submit ? 'submitted' : 'editing';
    draft.moderationStatus = 'not_submitted';
    draft.revision += 1;
    draft.updatedAt = now.toISOString();
    return { ok: true, draft };
  }

  reservePublicationArea(
    ownerId: UUID,
    draftId: UUID,
    revision: number,
    now: Date = new Date(),
  ): PublicationMutationResult {
    const draft = this.getPublicationDraft(draftId, ownerId);
    if (!draft) return { ok: false, code: 'invalid', message: 'Taslak bulunamadı.' };
    if (draft.revision !== revision) {
      return { ok: false, code: 'stale', message: 'Taslak değişti. Rezervasyondan önce yenile.' };
    }
    if (!this.listPublicationWindows(now).some((window) => window.issueDate === draft.issueDate && window.open)) {
      return { ok: false, code: 'closed', message: 'Bu sayının rezervasyon süresi kapandı.' };
    }

    const conflict = this.data.publicationSlots.find(
      (slot) =>
        slot.draftId !== draft.id &&
        slot.issueDate === draft.issueDate &&
        slot.page === draft.page &&
        publicationRectsOverlap(slot.rect, draft.rect),
    );
    if (conflict) {
      return {
        ok: false,
        code: 'conflict',
        message: 'Bu alan başka bir kullanıcı tarafından rezerve edilmiş veya satın alınmış.',
      };
    }

    this.data.publicationSlots = this.data.publicationSlots.filter((slot) => slot.draftId !== draft.id);
    const slot: PublicationSlot = {
      id: this.nextId('publication-slot'),
      ownerId,
      draftId: draft.id,
      issueDate: draft.issueDate,
      page: draft.page,
      rect: draft.rect,
      status: 'reserved',
      anonymous: draft.anonymous,
      createdAt: now.toISOString(),
      expiresAt: this.listPublicationWindows(now).find((window) => window.issueDate === draft.issueDate)?.closesAt ?? null,
    };
    this.data.publicationSlots.push(slot);
    return { ok: true, draft, slot };
  }

  purchasePublicationArea(
    ownerId: UUID,
    draftId: UUID,
    revision: number,
    now: Date = new Date(),
  ): PublicationMutationResult {
    const draft = this.getPublicationDraft(draftId, ownerId);
    if (!draft) return { ok: false, code: 'invalid', message: 'Taslak bulunamadı.' };
    if (draft.revision !== revision) {
      return { ok: false, code: 'stale', message: 'Ödeme öncesi taslak değişti. Sayfayı yenileyip tekrar dene.' };
    }
    if (draft.blocks.some((block) => !publicationRectContains(draft.rect, block))) {
      return { ok: false, code: 'outside', message: 'Alan dışındaki bloklar düzeltilmeden ödeme başlatılamaz.' };
    }
    if (draft.blocks.filter((block) => block.role === 'creative').length !== 1) {
      return { ok: false, code: 'invalid', message: 'Ödeme için önce tek bir tasarım dosyası yükleyip kaydetmelisin.' };
    }
    if (!this.listPublicationWindows(now).some((window) => window.issueDate === draft.issueDate && window.open)) {
      return { ok: false, code: 'closed', message: 'Bu sayının ödeme süresi kapandı.' };
    }

    // Kesin hak yalnizca paid kayittir; rezervasyon odemeyi engellemez.
    const paidConflict = this.data.publicationSlots.find(
      (slot) =>
        slot.status === 'paid' &&
        slot.draftId !== draft.id &&
        slot.issueDate === draft.issueDate &&
        slot.page === draft.page &&
        publicationRectsOverlap(slot.rect, draft.rect),
    );
    if (paidConflict) {
      return {
        ok: false,
        code: 'conflict',
        message: 'Alan ödeme başlamadan hemen önce satın alındı. Para çekilmedi; tasarımın arşivde korunuyor.',
      };
    }

    this.data.publicationSlots = this.data.publicationSlots.filter(
      (slot) =>
        slot.draftId === draft.id ||
        slot.status === 'paid' ||
        slot.issueDate !== draft.issueDate ||
        slot.page !== draft.page ||
        !publicationRectsOverlap(slot.rect, draft.rect),
    );
    this.data.publicationSlots = this.data.publicationSlots.filter((slot) => slot.draftId !== draft.id);
    const slot: PublicationSlot = {
      id: this.nextId('publication-slot'),
      ownerId,
      draftId: draft.id,
      issueDate: draft.issueDate,
      page: draft.page,
      rect: draft.rect,
      status: 'paid',
      anonymous: draft.anonymous,
      createdAt: now.toISOString(),
      expiresAt: null,
    };
    this.data.publicationSlots.push(slot);
    draft.status = 'paid';
    draft.moderationStatus = 'pending';
    draft.subscriber = this.getProfile(ownerId)?.publicationSubscriber === true;
    draft.revision += 1;
    draft.updatedAt = now.toISOString();
    const basePrice = draft.rect.width * draft.rect.height * PUBLICATION_UNIT_PRICE;
    const price = draft.subscriber ? Math.round(basePrice * (1 - PUBLICATION_SUBSCRIBER_DISCOUNT)) : basePrice;
    for (const moderator of this.data.profiles.filter((profile) => profile.role === 'moderator' || profile.role === 'admin')) {
      this.pushNotification({
        profileId: moderator.id,
        type: 'publication',
        title: 'Yeni gazete ilanı incelemede',
        body: `${draft.issueDate} tarihli ${draft.page}. sayfa ilanı görsel ve bağlantı kontrolü bekliyor.`,
        entityType: 'publication_draft',
        entityId: draft.id,
        href: '/admin/newspaper',
      });
    }
    return { ok: true, draft, slot, price };
  }

  listPublicationDraftsForModeration(): PublicationDraft[] {
    return this.data.publicationDrafts
      .filter((draft) => draft.moderationStatus === 'pending')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  reviewPublicationDraft(
    draftId: UUID,
    moderatorId: UUID,
    decision: 'approved' | 'rejected' | 'changes_requested',
    note = '',
  ): PublicationDraft | null {
    const draft = this.data.publicationDrafts.find((entry) => entry.id === draftId && entry.status === 'paid');
    if (!draft) return null;
    draft.moderationStatus = decision;
    draft.updatedAt = new Date().toISOString();
    this.data.moderationActions.push({
      id: this.nextId('moderation-action'),
      moderatorId,
      action: `publication_draft:${decision}`,
      entityType: 'publication_draft',
      entityId: draft.id,
      note: note.slice(0, 500) || (decision === 'approved' ? 'Görsel ve bağlantılar onaylandı.' : 'Yayın öncesi düzeltme gerekli.'),
      createdAt: new Date().toISOString(),
    });
    this.pushNotification({
      profileId: draft.ownerId,
      type: 'publication',
      title: decision === 'approved' ? 'Gazete ilanın onaylandı' : 'Gazete ilanın için işlem gerekiyor',
      body: decision === 'approved' ? 'İlanın seçtiğin sayıda yayımlanmaya hazır.' : note || 'Moderasyon ekibi tasarım veya bağlantıda düzeltme istedi.',
      entityType: 'publication_draft',
      entityId: draft.id,
      href: '/publish',
    });
    return draft;
  }

  listAdRequests(status?: ModerationStatus): AdRequestView[] {
    return this.data.adRequests
      .filter((request) => !status || request.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((request) => ({ request, organization: this.profileSummary(request.organizationId) }));
  }

  // --- Moderasyon ---------------------------------------------------------

  listApplications(status?: ModerationStatus): ApplicationView[] {
    return this.data.communityApplications
      .filter((application) => !status || application.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((application) => this.toApplicationView(application));
  }

  getApplication(id: UUID): ApplicationView | null {
    const application = this.data.communityApplications.find((entry) => entry.id === id);
    return application ? this.toApplicationView(application) : null;
  }

  private toApplicationView(application: CommunityApplication): ApplicationView {
    const normalizedName = normalize(application.name);
    const nameTokens = normalizedName.split(/\s+/).filter((token) => token.length > 3);

    // Benzer topluluk tespiti: ayni kok konu + ortak anlamli kelime.
    const similar = this.data.communities
      .filter((community) => community.status === 'active')
      .filter((community) => {
        if (community.rootTopicId !== application.rootTopicId) return false;
        const target = normalize(community.name);
        return nameTokens.some((token) => target.includes(token));
      })
      .map((community) => this.communitySummary(community.id))
      .filter((summary): summary is CommunitySummary => Boolean(summary));

    return {
      application,
      applicant: this.profileSummary(application.applicantId),
      rootTopic: this.getTopic(application.rootTopicId)!,
      provinceName: provinceName(application.provinceCode),
      districtName: districtName(application.districtCode),
      similarCommunities: similar,
    };
  }

  listReports(): Report[] {
    return this.data.reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  listModerationActions() {
    return this.data.moderationActions
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((action) => ({ action, moderator: this.profileSummary(action.moderatorId) }));
  }

  // --- Bildirimler --------------------------------------------------------

  listNotifications(profileId: UUID): Notification[] {
    return this.data.notifications
      .filter((notification) => notification.profileId === profileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  unreadNotificationCount(profileId: UUID): number {
    return this.data.notifications.filter(
      (notification) => notification.profileId === profileId && notification.readAt === null,
    ).length;
  }

  // --- Analitik -----------------------------------------------------------

  listAnalyticsEvents(): AnalyticsEvent[] {
    return this.data.analyticsEvents.slice().reverse();
  }

  // --- Yazma islemleri ----------------------------------------------------

  private nextId(namespace: string): UUID {
    return uid(namespace, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  }

  track(name: string, payload: AnalyticsEvent['payload'] = {}, profileId: UUID | null = null): void {
    this.data.analyticsEvents.push({
      id: this.nextId('analytics'),
      profileId,
      name,
      payload,
      createdAt: new Date().toISOString(),
    });
    // Demo ortaminda bellegi sinirli tut.
    if (this.data.analyticsEvents.length > 500) this.data.analyticsEvents.shift();
  }

  updateProfile(profileId: UUID, patch: Partial<Profile>): Profile | null {
    const index = this.data.profiles.findIndex((profile) => profile.id === profileId);
    if (index === -1) return null;
    const updated = { ...this.data.profiles[index], ...patch, id: profileId, demo: true as const };
    this.data.profiles[index] = updated;
    return updated;
  }

  toggleLike(profileId: UUID, postId: UUID): boolean {
    const index = this.data.likes.findIndex((like) => like.profileId === profileId && like.postId === postId);
    const post = this.getPost(postId);
    if (index >= 0) {
      this.data.likes.splice(index, 1);
      if (post) post.likeCount = Math.max(0, post.likeCount - 1);
      return false;
    }
    this.data.likes.push({ profileId, postId });
    if (post) post.likeCount += 1;
    return true;
  }

  toggleSave(profileId: UUID, postId: UUID): boolean {
    const index = this.data.saves.findIndex((save) => save.profileId === profileId && save.postId === postId);
    if (index >= 0) {
      this.data.saves.splice(index, 1);
      return false;
    }
    this.data.saves.push({ profileId, postId });
    return true;
  }

  listSavedPosts(profileId: UUID): PostView[] {
    return this.data.saves
      .filter((save) => save.profileId === profileId)
      .map((save) => this.getPost(save.postId))
      .filter((post): post is Post => Boolean(post))
      .map((post) => this.toPostView(post, profileId, null));
  }

  toggleFollow(followerId: UUID, followingId: UUID): boolean {
    if (followerId === followingId) return false;
    const index = this.data.follows.findIndex(
      (edge) => edge.followerId === followerId && edge.followingId === followingId,
    );
    const target = this.getProfile(followingId);
    if (index >= 0) {
      this.data.follows.splice(index, 1);
      if (target) target.followerCount = Math.max(0, target.followerCount - 1);
      return false;
    }
    if (target?.isPrivate) {
      const requestIndex = this.data.followRequests.findIndex(
        (request) => request.requesterId === followerId && request.targetId === followingId,
      );
      if (requestIndex >= 0) {
        this.data.followRequests.splice(requestIndex, 1);
        return false;
      }
      this.data.followRequests.push({ requesterId: followerId, targetId: followingId, createdAt: new Date().toISOString() });
      return false;
    }
    this.data.follows.push({ followerId, followingId });
    if (target) target.followerCount += 1;
    return true;
  }

  resolveFollowRequest(targetId: UUID, requesterId: UUID, approve: boolean): boolean {
    const index = this.data.followRequests.findIndex(
      (request) => request.requesterId === requesterId && request.targetId === targetId,
    );
    if (index < 0) return false;
    this.data.followRequests.splice(index, 1);
    if (!approve || this.isFollowing(requesterId, targetId)) return true;
    this.data.follows.push({ followerId: requesterId, followingId: targetId });
    const target = this.getProfile(targetId);
    if (target) target.followerCount += 1;
    return true;
  }

  createPost(input: {
    authorId: UUID;
    type: Post['type'];
    body: string;
    visibility?: Post['visibility'];
    communityId?: UUID | null;
    topicIds?: UUID[];
    provinceCode?: string | null;
    districtCode?: string | null;
    projectId?: UUID | null;
    eventId?: UUID | null;
    mediaIds?: UUID[];
    isShortVideo?: boolean;
    videoKind?: Post['videoKind'];
  }): Post {
    const post: Post = {
      id: this.nextId('post'),
      authorId: input.authorId,
      type: input.type,
      body: input.body,
      visibility: input.visibility ?? 'public',
      communityId: input.communityId ?? null,
      topicIds: input.topicIds ?? [],
      provinceCode: input.provinceCode ?? null,
      districtCode: input.districtCode ?? null,
      projectId: input.projectId ?? null,
      eventId: input.eventId ?? null,
      whyStoryId: null,
      resourceId: null,
      mediaIds: input.mediaIds ?? [],
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      repostCount: 0,
      isShortVideo: Boolean(input.isShortVideo),
      videoKind: input.videoKind ?? null,
    };
    this.data.posts.unshift(post);
    return post;
  }

  createComment(postId: UUID, authorId: UUID, body: string) {
    const comment = {
      id: this.nextId('comment'),
      postId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    this.data.comments.push(comment);
    const post = this.getPost(postId);
    if (post) post.commentCount += 1;
    return comment;
  }

  addMedia(media: Omit<Media, 'id'>): Media {
    const record: Media = { ...media, id: this.nextId('media') };
    this.data.media.push(record);
    return record;
  }

  joinCommunity(communityId: UUID, profileId: UUID): boolean {
    if (this.getCommunityRole(communityId, profileId)) return false;
    this.data.communityMembers.push({
      communityId,
      profileId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    const community = this.getCommunity(communityId);
    if (community) community.memberCount += 1;
    this.pushNotification({
      profileId,
      type: 'community_joined',
      title: `${community?.name ?? 'Topluluğa'} katıldın`,
      body: 'Bu topluluğun içerikleri artık ana akışında daha sık görünecek.',
      entityType: 'community',
      entityId: communityId,
      href: community ? `/communities/${community.slug}` : null,
    });
    return true;
  }

  leaveCommunity(communityId: UUID, profileId: UUID): boolean {
    const index = this.data.communityMembers.findIndex(
      (member) => member.communityId === communityId && member.profileId === profileId,
    );
    if (index === -1) return false;
    this.data.communityMembers.splice(index, 1);
    const community = this.getCommunity(communityId);
    if (community) community.memberCount = Math.max(0, community.memberCount - 1);
    return true;
  }

  submitApplication(input: Omit<CommunityApplication, 'id' | 'status' | 'reviewerId' | 'reviewerNote' | 'createdAt' | 'reviewedAt'>): CommunityApplication {
    const application: CommunityApplication = {
      ...input,
      id: this.nextId('application'),
      status: 'pending',
      reviewerId: null,
      reviewerNote: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };
    this.data.communityApplications.unshift(application);

    this.pushNotification({
      profileId: input.applicantId,
      type: 'community_application',
      title: 'Topluluk başvurun alındı',
      body: 'Başvurun moderasyon kuyruğunda. Sonucu burada göreceksin.',
      entityType: 'community_application',
      entityId: application.id,
      href: '/communities/apply',
    });

    // Moderatorleri bilgilendir.
    for (const moderator of this.data.profiles.filter((p) => p.role === 'moderator' || p.role === 'admin')) {
      this.pushNotification({
        profileId: moderator.id,
        type: 'community_application',
        title: 'Yeni topluluk başvurusu',
        body: `${input.name} başvurusu incelemeni bekliyor.`,
        entityType: 'community_application',
        entityId: application.id,
        href: '/admin/moderation',
      });
    }

    return application;
  }

  /**
   * Moderator karari. Onay verildiginde topluluk gercekten olusur ve basvuran
   * community_manager olur (PROJECT_SPEC 17.8). Her karar audit log'a yazilir.
   */
  reviewApplication(
    applicationId: UUID,
    moderatorId: UUID,
    decision: Exclude<ModerationStatus, 'pending'>,
    note: string,
  ): { application: CommunityApplication; community: Community | null } | null {
    const application = this.data.communityApplications.find((entry) => entry.id === applicationId);
    if (!application) return null;

    application.status = decision;
    application.reviewerId = moderatorId;
    application.reviewerNote = note;
    application.reviewedAt = new Date().toISOString();

    let community: Community | null = null;
    if (decision === 'approved') {
      const slug = normalize(application.name).replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      community = {
        id: this.nextId('community'),
        slug,
        name: application.name,
        description: application.rationale,
        kind: 'branch',
        rootTopicId: application.rootTopicId,
        scope: application.scope,
        provinceCode: application.provinceCode,
        districtCode: application.districtCode,
        audience: application.audience,
        rules: application.rules.split('\n').map((rule) => rule.trim()).filter(Boolean),
        status: 'active',
        createdBy: application.applicantId,
        createdAt: new Date().toISOString(),
        memberCount: 1,
        emoji: '✨',
      };
      this.data.communities.push(community);
      this.data.communityMembers.push({
        communityId: community.id,
        profileId: application.applicantId,
        role: 'manager',
        joinedAt: new Date().toISOString(),
      });
    }

    this.data.moderationActions.push({
      id: this.nextId('moderation-action'),
      moderatorId,
      action: `community_application:${decision}`,
      entityType: 'community_application',
      entityId: applicationId,
      note,
      createdAt: new Date().toISOString(),
    });

    const decisionLabel =
      decision === 'approved' ? 'onaylandı' : decision === 'rejected' ? 'reddedildi' : 'düzenleme bekliyor';
    this.pushNotification({
      profileId: application.applicantId,
      type: 'moderation',
      title: `Topluluk başvurun ${decisionLabel}`,
      body: note || 'Moderatör bir not bırakmadı.',
      entityType: 'community_application',
      entityId: applicationId,
      href: community ? `/communities/${community.slug}` : '/communities/apply',
    });

    return { application, community };
  }

  createReminder(profileId: UUID, eventId: UUID): Reminder | null {
    const event = this.getEvent(eventId);
    if (!event) return null;

    const existing = this.data.reminders.find(
      (reminder) => reminder.profileId === profileId && reminder.eventId === eventId && reminder.status === 'scheduled',
    );
    if (existing) return existing;

    // Etkinlikten 1 gun once hatirlat; etkinlik 24 saatten yakinsa 1 saat once.
    const startsAt = new Date(event.startsAt).getTime();
    const dayBefore = startsAt - 86_400_000;
    const remindAt = dayBefore > Date.now() ? dayBefore : startsAt - 3_600_000;

    const reminder: Reminder = {
      id: this.nextId('reminder'),
      profileId,
      eventId,
      remindAt: new Date(remindAt).toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    this.data.reminders.push(reminder);

    this.pushNotification({
      profileId,
      type: 'event_reminder',
      title: `Hatırlatma kuruldu: ${event.title}`,
      body: `${event.title} için hatırlatma oluşturuldu. Etkinlikten önce burada göreceksin.`,
      entityType: 'event',
      entityId: eventId,
      href: `/events/${event.slug}`,
    });

    return reminder;
  }

  cancelReminder(profileId: UUID, eventId: UUID): boolean {
    const reminder = this.data.reminders.find(
      (entry) => entry.profileId === profileId && entry.eventId === eventId && entry.status === 'scheduled',
    );
    if (!reminder) return false;
    reminder.status = 'cancelled';
    return true;
  }

  createProject(input: {
    ownerId: UUID;
    title: string;
    summary: string;
    status: Project['status'];
    topicIds: UUID[];
    provinceCode: string | null;
    districtCode: string | null;
    whyText: string;
    howText: string;
    needs: string;
    communityIds: UUID[];
  }): Project {
    const slug = `${normalize(input.title).replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const project: Project = {
      id: this.nextId('project'),
      slug,
      ownerId: input.ownerId,
      title: input.title,
      summary: input.summary,
      status: input.status,
      topicIds: input.topicIds,
      provinceCode: input.provinceCode,
      districtCode: input.districtCode,
      whyText: input.whyText,
      howText: input.howText,
      needs: input.needs,
      communityIds: input.communityIds,
      startedAt: new Date().toISOString(),
      targetEndAt: null,
      emoji: '🧪',
      pitchMediaId: null,
    };
    this.data.projects.unshift(project);
    this.data.projectMembers.push({
      projectId: project.id,
      profileId: input.ownerId,
      roleLabel: 'Kurucu',
    });
    return project;
  }

  attachPitch(projectId: UUID, mediaId: UUID): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;
    project.pitchMediaId = mediaId;
    return true;
  }

  addProjectUpdate(projectId: UUID, authorId: UUID, body: string, isMilestone: boolean) {
    const now = new Date().toISOString();
    const update = {
      id: this.nextId('project-update'),
      projectId,
      authorId,
      body,
      createdAt: now,
      milestoneDate: isMilestone ? now : null,
      isMilestone,
    };
    this.data.projectUpdates.push(update);
    return update;
  }

  createWhyStory(input: {
    authorId: UUID;
    title: string;
    body: string;
    linkedEntityType: WhyStory['linkedEntityType'];
    linkedEntityId: UUID | null;
    topicIds: UUID[];
    provinceCode: string | null;
    visibility: WhyStory['visibility'];
    mediaId?: UUID | null;
  }): WhyStory {
    const story: WhyStory = {
      id: this.nextId('why'),
      authorId: input.authorId,
      title: input.title,
      body: input.body,
      mediaId: input.mediaId ?? null,
      linkedEntityType: input.linkedEntityType,
      linkedEntityId: input.linkedEntityId,
      topicIds: input.topicIds,
      provinceCode: input.provinceCode,
      visibility: input.visibility,
      featured: false,
      createdAt: new Date().toISOString(),
    };
    this.data.whyStories.unshift(story);
    return story;
  }

  submitAdRequest(input: Omit<AdRequest, 'id' | 'status' | 'createdAt' | 'reviewedAt' | 'publishedItemId'>): AdRequest {
    const request: AdRequest = {
      ...input,
      id: this.nextId('ad-request'),
      status: 'pending',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      publishedItemId: null,
    };
    this.data.adRequests.unshift(request);

    for (const admin of this.data.profiles.filter((profile) => profile.role === 'admin')) {
      this.pushNotification({
        profileId: admin.id,
        type: 'ad_request',
        title: 'Yeni ilan başvurusu',
        body: `${request.title} başvurusu incelemede.`,
        entityType: 'ad_request',
        entityId: request.id,
        href: '/admin/newspaper',
      });
    }

    this.pushNotification({
      profileId: input.organizationId,
      type: 'ad_request',
      title: 'İlan başvurun alındı',
      body: 'Başvurun incelemede. Onaylanırsa seçtiğin sayıların gazete kompozisyonunda yayımlanacak.',
      entityType: 'ad_request',
      entityId: request.id,
      href: '/newspaper/advertise',
    });

    return request;
  }

  /**
   * Admin ilan basvurusunu karara baglar. Onaylanan ilan yalnizca gazete
   * sayisina eklenir; akis siralamasina hicbir etkisi yoktur.
   */
  reviewAdRequest(
    requestId: UUID,
    adminId: UUID,
    decision: Exclude<ModerationStatus, 'pending'>,
    issueDate?: string,
  ): AdRequest | null {
    const request = this.data.adRequests.find((entry) => entry.id === requestId);
    if (!request) return null;

    request.status = decision;
    request.reviewedAt = new Date().toISOString();

    if (decision === 'approved') {
      const targetDate = issueDate ?? request.requestedIssueStart ?? toIstanbulDateKey(new Date());
      const issue = this.data.newspaperIssues.find((entry) => entry.issueDate === targetDate);
      if (issue) {
        const publicationOrder = this.data.newspaperItems.filter(
          (item) => item.issueId === issue.id,
        ).length;
        // Onaylanan kreatif, gazetenin grid'inde satin alinan ALANA yerlesir:
        // span ve olcu envanter kaydindan, fiyat basvurudaki snapshot'tan gelir
        // (PROJECT_SPEC 7.9). Yeniden hesaplamiyoruz; teklif ne ise o kalir.
        const placement = placementByCode(request.requestedPlacement);
        const item: NewspaperItem = {
          id: this.nextId('newspaper-item'),
          issueId: issue.id,
          itemType: request.placementType,
          section: request.placementType === 'event_ad' ? 'etkinlik' : 'topluluk',
          title: request.title,
          standfirst: null,
          body: request.body,
          imageSeed: request.creativeUrl ? request.id : null,
          imageGlyph: request.creativeUrl ? '📣' : null,
          imageAlt: request.creativeAlt,
          sourceOrAuthor: null,
          targetUrl: request.linkUrl,
          linkedEntityType: null,
          linkedEntityId: null,
          layoutVariant: 'placement',
          gridColumnSpan: placement?.gridColumnSpan ?? 1,
          gridRowSpan: placement?.gridRowSpan ?? 1,
          priority: 50,
          publicationOrder,
          sponsored: true,
          sponsorName: this.getProfile(request.organizationId)?.displayName ?? 'Sponsor',
          placementCode: request.requestedPlacement,
          widthPx: request.widthPx,
          heightPx: request.heightPx,
          priceSnapshot: request.pricingSnapshot,
          campaignId: request.id,
        };
        this.data.newspaperItems.push(item);
        request.publishedItemId = item.id;
      }
    }

    this.data.moderationActions.push({
      id: this.nextId('moderation-action'),
      moderatorId: adminId,
      action: `ad_request:${decision}`,
      entityType: 'ad_request',
      entityId: requestId,
      note: decision === 'approved' ? 'Ücretli yerleşim gazete sayısına eklendi.' : 'Yayımlanmadı.',
      createdAt: new Date().toISOString(),
    });

    this.pushNotification({
      profileId: request.organizationId,
      type: 'ad_request',
      title: `İlan başvurun ${decision === 'approved' ? 'onaylandı' : 'reddedildi'}`,
      body:
        decision === 'approved'
          ? 'İlanın gazete kompozisyonunda yayımlandı.'
          : 'İlanın yayımlanmadı. Kurallara uygun bir içerikle tekrar başvurabilirsin.',
      entityType: 'ad_request',
      entityId: requestId,
      href: '/newspaper',
    });

    return request;
  }

  createReport(input: { reporterId: UUID; entityType: Report['entityType']; entityId: UUID; reason: string; detail: string }): Report {
    const report: Report = {
      ...input,
      id: this.nextId('report'),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.data.reports.unshift(report);
    return report;
  }

  resolveReport(reportId: UUID, moderatorId: UUID, status: Report['status'], note: string): Report | null {
    const report = this.data.reports.find((entry) => entry.id === reportId);
    if (!report) return null;
    report.status = status;
    this.data.moderationActions.push({
      id: this.nextId('moderation-action'),
      moderatorId,
      action: `report:${status}`,
      entityType: report.entityType,
      entityId: report.entityId,
      note,
      createdAt: new Date().toISOString(),
    });
    return report;
  }

  pushNotification(input: Omit<Notification, 'id' | 'createdAt' | 'readAt'>): Notification {
    const notification: Notification = {
      ...input,
      id: this.nextId('notification'),
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    this.data.notifications.unshift(notification);
    return notification;
  }

  markNotificationsRead(profileId: UUID): void {
    const now = new Date().toISOString();
    for (const notification of this.data.notifications) {
      if (notification.profileId === profileId && notification.readAt === null) {
        notification.readAt = now;
      }
    }
  }
}

/**
 * Sunucu sureci boyunca tek bir depo ornegi.
 *
 * Next.js gelistirme modunda modul yeniden degerlendirilebildigi icin
 * globalThis uzerinde saklaniyor; aksi hâlde her sicak yeniden yuklemede
 * kullanicinin demo sirasinda yaptigi degisiklikler kaybolurdu.
 */
const globalRef = globalThis as unknown as { __nsosyalStore?: DemoStore };

export function getStore(): DemoStore {
  if (!globalRef.__nsosyalStore) {
    globalRef.__nsosyalStore = new DemoStore();
  }
  return globalRef.__nsosyalStore;
}
