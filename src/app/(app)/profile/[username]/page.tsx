import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toggleFollow } from '@/actions/social';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Badge, Card, DemoBadge, EmptyState, Icon, VerifiedMark } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';
import { profileLinkIcon } from '@/lib/profile/links';
import { formatDate, formatRelative } from '@/lib/time';
import type { Profile } from '@/types/domain';
import type { CommentView, PostView, ProfileSummary, ProjectSummary, WhyStoryView } from '@/types/view';

const TABS = [
  { key: 'gonderiler', label: 'Gönderiler' },
  { key: 'medya', label: 'Medya' },
  { key: 'yanitlar', label: 'Yanıtlar' },
  { key: 'projeler', label: 'Projeler' },
  { key: 'hakkinda', label: 'Hakkında' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = getStore().getProfileByUsername(username);
  return { title: profile ? profile.displayName : 'Profil' };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
  const viewer = await getViewer();
  const store = getStore();
  const profile = store.getProfileByUsername(username);
  if (!profile) notFound();

  const tab = (TABS.find((entry) => entry.key === tabParam)?.key ?? 'gonderiler') as TabKey;
  const base = `/profile/${username}`;
  const isSelf = viewer?.id === profile.id;
  const following = Boolean(viewer && store.isFollowing(viewer.id, profile.id));
  const requestPending = Boolean(viewer && store.hasFollowRequest(viewer.id, profile.id));
  const canViewContent = store.canViewProfile(profile.id, viewer?.id ?? null);
  const allPosts = canViewContent
    ? store.getFeed({ viewerId: viewer?.id ?? null, authorId: profile.id, limit: 60 })
    : [];
  const mediaPosts = allPosts.filter((view) => view.media.length > 0);
  const replies = canViewContent ? store.listCommentsByAuthor(profile.id) : [];
  const projects = canViewContent
    ? store.listProjects().filter((project) => store.getProjectBySlug(project.slug)?.ownerId === profile.id)
    : [];
  const whyStories = canViewContent
    ? store.listWhyStories().filter((entry) => entry.story.authorId === profile.id)
    : [];
  const communities = canViewContent
    ? store
        .getMemberCommunityIds(profile.id)
        .map((id) => store.getCommunity(id))
        .filter((community): community is NonNullable<typeof community> => Boolean(community))
    : [];
  const suggestions = viewer ? store.listProfileSuggestions(viewer.id, 5) : [];
  const place = profile.locationVisibility === 'hidden' || profile.locationVisibility === 'online_only'
    ? null
    : locationLabel(profile.provinceCode, profile.districtCode);
  const showBirthDate = Boolean(
    profile.birthDate &&
      (isSelf || profile.birthDateVisibility === 'public' || (profile.birthDateVisibility === 'followers' && following)),
  );

  return (
    <div className="space-y-4">
      <section className="profile-hero overflow-hidden rounded-[1.25rem] border border-line bg-bg-raised" aria-labelledby="profile-name">
        <div className="relative aspect-[3/1] min-h-32 overflow-hidden bg-[linear-gradient(125deg,#112945,#24639b_50%,#4c65f6)]">
          {profile.bannerUrl ? <Image src={profile.bannerUrl} alt="" fill priority unoptimized className="object-cover" /> : <span aria-hidden="true" className="absolute inset-0 profile-banner-pattern" />}
        </div>

        <div className="px-4 pb-5 sm:px-5">
          <div className="flex min-h-14 items-start justify-between gap-3">
            <span className="-mt-12 rounded-full bg-bg-raised p-1.5 ring-1 ring-[var(--border)] sm:-mt-14">
              <Avatar profile={profile} size={104} />
            </span>
            <div className="flex flex-wrap justify-end gap-2 pt-3">
              {isSelf ? (
                <Link href={`${base}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-semibold hover:bg-bg-hover"><Icon name="camera" size={16} />Profili düzenle</Link>
              ) : viewer ? (
                <FollowButton profile={profile} revalidate={base} following={following} requestPending={requestPending} />
              ) : null}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 id="profile-name" className="text-2xl font-black tracking-tight sm:text-[1.75rem]">{profile.displayName}</h1>
            {profile.verified ? <VerifiedMark kind={profile.kind} /> : null}
            <DemoBadge />
            {profile.isPrivate ? <Badge tone="neutral" icon="lock">Gizli hesap</Badge> : null}
            {profile.role === 'moderator' ? <Badge tone="accent">Moderatör</Badge> : null}
            {profile.role === 'admin' ? <Badge tone="accent">Yönetici</Badge> : null}
            {profile.kind === 'organization' ? <Badge tone="neutral">Kurum</Badge> : null}
          </div>
          <p className="text-sm text-fg-subtle">@{profile.username}</p>
          {profile.bio ? <p className="mt-3 max-w-2xl whitespace-pre-line text-[0.96rem] leading-relaxed text-fg-muted">{profile.bio}</p> : null}

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-fg-subtle" aria-label="Profil ayrıntıları">
            {place ? <li className="inline-flex items-center gap-1.5"><Icon name="mapPin" size={16} />{place}</li> : null}
            <li className="inline-flex items-center gap-1.5"><Icon name="calendar" size={16} />{formatDate(profile.createdAt)} tarihinde katıldı</li>
            {showBirthDate ? <li className="inline-flex items-center gap-1.5"><Icon name="sparkles" size={16} />Doğum günü {formatDate(profile.birthDate!)}</li> : null}
          </ul>

          {profile.links.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Profil bağlantıları">
              {profile.links.map((link) => (
                <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-bg-sunken px-2.5 text-xs font-semibold text-accent ring-1 ring-[var(--border)] hover:underline"><Icon name={profileLinkIcon(link.platform)} size={15} />{link.label}</a></li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <Link href={`${base}/following`} className="hover:underline"><strong className="text-fg">{store.getFollowing(profile.id).length.toLocaleString('tr-TR')}</strong> <span className="text-fg-subtle">Takip edilen</span></Link>
            <Link href={`${base}/followers`} className="hover:underline"><strong className="text-fg">{profile.followerCount.toLocaleString('tr-TR')}</strong> <span className="text-fg-subtle">Takipçi</span></Link>
            <span><strong className="text-fg">{allPosts.length.toLocaleString('tr-TR')}</strong> <span className="text-fg-subtle">Gönderi</span></span>
          </div>
        </div>
      </section>

      {suggestions.length > 0 && viewer ? <SuggestionRail profiles={suggestions} revalidate={base} viewerId={viewer.id} store={store} /> : null}

      <nav aria-label="Profil bölümleri" className="border-b border-line">
        <ul className="scroll-x hide-scrollbar flex" tabIndex={0}>
          {TABS.map((entry) => (
            <li key={entry.key} className="min-w-fit flex-1">
              <Link href={entry.key === 'gonderiler' ? base : `${base}?tab=${entry.key}`} aria-current={tab === entry.key ? 'page' : undefined} className={`flex min-h-12 items-center justify-center border-b-2 px-2 text-xs font-semibold sm:px-3 sm:text-sm ${tab === entry.key ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:bg-bg-hover hover:text-fg'}`}>{entry.label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {!canViewContent ? (
        <EmptyState icon="lock" title="Bu hesap gizli" description="Gönderileri görmek için takip isteği gönderip onay beklemelisin." />
      ) : (
        <ProfileTabContent tab={tab} base={base} posts={allPosts} mediaPosts={mediaPosts} replies={replies} projects={projects} whyStories={whyStories} communities={communities} profile={profile} />
      )}
    </div>
  );
}

function FollowButton({ profile, revalidate, following, requestPending }: { profile: Pick<ProfileSummary, 'id'>; revalidate: string; following: boolean; requestPending: boolean }) {
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="revalidate" value={revalidate} />
      <button type="submit" className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${following || requestPending ? 'border border-line-strong bg-bg-raised hover:bg-bg-hover' : 'bg-accent text-accent-fg hover:brightness-110'}`}>{following ? 'Takiptesin' : requestPending ? 'İstek gönderildi' : 'Takip et'}</button>
    </form>
  );
}

function SuggestionRail({ profiles, revalidate, viewerId, store }: { profiles: ProfileSummary[]; revalidate: string; viewerId: string; store: ReturnType<typeof getStore> }) {
  return (
    <section className="rounded-[1.25rem] border border-line bg-bg-raised p-4" aria-labelledby="suggestions-heading">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id="suggestions-heading" className="font-bold">Tanışabileceğin kişiler</h2><Link href="/explore" className="text-sm font-semibold text-accent hover:underline">Tümünü gör</Link></div>
      <ul className="scroll-x hide-scrollbar flex snap-x gap-3 pb-1" tabIndex={0}>
        {profiles.map((profile) => (
          <li key={profile.id} className="w-48 shrink-0 snap-start rounded-2xl border border-line bg-bg-sunken p-3 text-center">
            <Link href={`/profile/${profile.username}`} className="inline-flex" aria-label={`${profile.displayName} profili`}><Avatar profile={profile} size={58} /></Link>
            <Link href={`/profile/${profile.username}`} className="mt-2 block truncate text-sm font-bold hover:underline">{profile.displayName}</Link>
            <p className="truncate text-xs text-fg-subtle">@{profile.username}</p>
            <div className="mt-3 flex justify-center"><FollowButton profile={profile} revalidate={revalidate} following={store.isFollowing(viewerId, profile.id)} requestPending={store.hasFollowRequest(viewerId, profile.id)} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileTabContent({ tab, base, posts, mediaPosts, replies, projects, whyStories, communities, profile }: {
  tab: TabKey;
  base: string;
  posts: PostView[];
  mediaPosts: PostView[];
  replies: CommentView[];
  projects: ProjectSummary[];
  whyStories: WhyStoryView[];
  communities: NonNullable<ReturnType<ReturnType<typeof getStore>['getCommunity']>>[];
  profile: Profile;
}) {
  if (tab === 'gonderiler' || tab === 'medya') {
    const visible = tab === 'medya' ? mediaPosts : posts;
    return visible.length === 0 ? <EmptyState icon={tab === 'medya' ? 'image' : 'message'} title={tab === 'medya' ? 'Henüz medya yok' : 'Henüz gönderi yok'} description="Paylaşımlar burada listelenir." /> : <ol>{visible.map((view) => <li key={view.post.id}><PostCard view={view} revalidate={base} /></li>)}</ol>;
  }
  if (tab === 'yanitlar') {
    return replies.length === 0 ? <EmptyState icon="message" title="Henüz yanıt yok" description="Gönderilere verilen yanıtlar burada görünür." /> : <ol className="space-y-2">{replies.map((entry) => <li key={entry.comment.id}><Link href={`/posts/${entry.comment.postId}`} className="card block p-4 hover:border-accent"><p className="text-sm leading-relaxed">{entry.comment.body}</p><p className="mt-2 text-xs text-fg-subtle">{formatRelative(entry.comment.createdAt)} · Gönderiyi gör</p></Link></li>)}</ol>;
  }
  if (tab === 'projeler') {
    return projects.length === 0 ? <EmptyState icon="beaker" title="Henüz proje yok" description="Oluşturulan projeler burada listelenir." /> : <ul className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <li key={project.id}><Card className="h-full p-4"><Link href={`/projects/${project.slug}`} className="font-semibold hover:underline">{project.title}</Link><p className="mt-1 text-sm text-fg-muted">{project.summary}</p></Card></li>)}</ul>;
  }
  const store = getStore();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-4"><h2 className="font-bold">İlgi alanları</h2><ul className="mt-3 flex flex-wrap gap-2">{profile.topicIds.map((topicId) => { const topic = store.getTopic(topicId); return topic ? <li key={topic.id}><Link href={`/explore?topic=${topic.slug}`} className="inline-flex min-h-8 items-center rounded-full bg-accent-soft px-3 text-xs font-semibold text-accent">{topic.name}</Link></li> : null; })}</ul></Card>
      <Card className="p-4"><h2 className="font-bold">Topluluklar</h2>{communities.length ? <ul className="mt-2 space-y-2">{communities.slice(0, 6).map((community) => <li key={community.id}><Link href={`/communities/${community.slug}`} className="text-sm hover:underline">{community.name}</Link></li>)}</ul> : <p className="mt-2 text-sm text-fg-muted">Henüz topluluk yok.</p>}</Card>
      <Card className="p-4 sm:col-span-2"><h2 className="font-bold">Neden hikâyeleri</h2>{whyStories.length ? <ul className="mt-2 grid gap-2 sm:grid-cols-2">{whyStories.map((entry) => <li key={entry.story.id}><Link href={`/explore/why/${entry.story.id}`} className="block rounded-xl bg-bg-sunken p-3 text-sm font-semibold hover:text-accent">{entry.story.title}</Link></li>)}</ul> : <p className="mt-2 text-sm text-fg-muted">Henüz Neden hikâyesi yok.</p>}</Card>
    </div>
  );
}
