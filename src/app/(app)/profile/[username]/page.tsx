import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { toggleFollow } from '@/actions/social';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Badge, Card, DemoBadge, EmptyState, Stat, VerifiedMark } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';
import { formatDate } from '@/lib/time';

const TABS = [
  { key: 'gonderiler', label: 'Gönderiler' },
  { key: 'projeler', label: 'Projeler' },
  { key: 'neden', label: 'Neden' },
  { key: 'topluluklar', label: 'Topluluklar' },
  { key: 'kaydedilenler', label: 'Kaydedilenler' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = getStore().getProfileByUsername(username);
  return { title: profile ? profile.displayName : 'Profil' };
}

/**
 * Profil (PROJECT_SPEC 6.1 ekran 20 / 8.1 "Düşük baskı").
 * CV formatinda degil; ilgi, uretim ve topluluk odakli.
 */
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

  const posts = store.getFeed({ viewerId: viewer?.id ?? null, authorId: profile.id, limit: 30 });
  const projects = store.listProjects().filter((project) => {
    const record = store.getProjectBySlug(project.slug);
    return record?.ownerId === profile.id;
  });
  const whyStories = store.listWhyStories().filter((entry) => entry.story.authorId === profile.id);
  const communities = store
    .getMemberCommunityIds(profile.id)
    .map((id) => store.getCommunity(id))
    .filter((community): community is NonNullable<typeof community> => Boolean(community));
  const saved = isSelf ? store.listSavedPosts(profile.id) : [];

  const place = locationLabel(profile.provinceCode, profile.districtCode);
  const following = viewer ? store.isFollowing(viewer.id, profile.id) : false;

  const visibleTabs = TABS.filter((entry) => entry.key !== 'kaydedilenler' || isSelf);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <Avatar profile={profile} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
              {profile.verified ? <VerifiedMark kind={profile.kind} /> : null}
              <DemoBadge />
              {profile.role === 'moderator' ? <Badge tone="accent">Moderatör</Badge> : null}
              {profile.role === 'admin' ? <Badge tone="accent">Yönetici</Badge> : null}
              {profile.kind === 'organization' ? <Badge tone="neutral">Kurum</Badge> : null}
            </div>
            <p className="text-sm text-fg-subtle">@{profile.username}</p>
            <p className="mt-2 text-fg-muted">{profile.bio}</p>
            <p className="mt-2 text-sm text-fg-subtle">
              {place ? `📍 ${place} · ` : ''}
              Katılım {formatDate(profile.createdAt)}
            </p>
          </div>

          {viewer && !isSelf ? (
            <form action={toggleFollow}>
              <input type="hidden" name="profileId" value={profile.id} />
              <input type="hidden" name="revalidate" value={base} />
              <button
                type="submit"
                className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${
                  following
                    ? 'border border-line bg-bg-raised hover:bg-bg-sunken'
                    : 'bg-accent text-accent-fg'
                }`}
              >
                {following ? '✓ Takiptesin' : 'Takip et'}
              </button>
            </form>
          ) : null}

          {isSelf ? (
            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
            >
              Profili düzenle
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Takipçi" value={profile.followerCount.toLocaleString('tr-TR')} />
          <Stat label="Gönderi" value={posts.length} />
          <Stat label="Proje" value={projects.length} />
          <Stat label="Topluluk" value={communities.length} />
        </div>

        {profile.topicIds.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {profile.topicIds.map((topicId) => {
              const topic = store.getTopic(topicId);
              if (!topic) return null;
              return (
                <li key={topic.id}>
                  <Link
                    href={`/explore?topic=${topic.slug}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted hover:border-line-strong"
                  >
                    {topic.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <nav aria-label="Profil bölümleri">
        <ul className="scroll-x hide-scrollbar flex gap-1.5 border-b border-line pb-2">
          {visibleTabs.map((entry) => (
            <li key={entry.key}>
              <Link
                href={entry.key === 'gonderiler' ? base : `${base}?tab=${entry.key}`}
                aria-current={tab === entry.key ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm ${
                  tab === entry.key ? 'bg-accent-soft font-semibold text-accent' : 'text-fg-muted hover:bg-bg-sunken'
                }`}
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'gonderiler' ? (
        posts.length === 0 ? (
          <EmptyState icon="message" title="Henüz gönderi yok" description="Paylaşımlar burada listelenir." />
        ) : (
          <ol className="space-y-3">
            {posts.map((view) => (
              <li key={view.post.id}>
                <PostCard view={view} revalidate={base} />
              </li>
            ))}
          </ol>
        )
      ) : null}

      {tab === 'projeler' ? (
        projects.length === 0 ? (
          <EmptyState icon="beaker" title="Henüz proje yok" description="Oluşturulan projeler burada listelenir." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Card className="h-full p-4">
                  <Link href={`/projects/${project.slug}`} className="font-semibold hover:underline">
                    {project.title}
                  </Link>
                  <p className="mt-1 text-sm text-fg-muted">{project.summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'neden' ? (
        whyStories.length === 0 ? (
          <EmptyState
            icon="spark"
            title="Henüz Neden hikâyesi yok"
            description="Bir alana ya da projeye nasıl yöneldiğini anlatan hikâyeler burada görünür."
          />
        ) : (
          <ul className="space-y-2">
            {whyStories.map((entry) => (
              <li key={entry.story.id}>
                <Link href={`/explore/why/${entry.story.id}`} className="card block p-4 hover:border-accent">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-dim-neden)]">
                    Neden
                  </span>
                  <span className="mt-1 block font-semibold">{entry.story.title}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-fg-muted">{entry.story.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'topluluklar' ? (
        communities.length === 0 ? (
          <EmptyState icon="users" title="Üye olunan topluluk yok" description="Katılınan topluluklar burada görünür." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {communities.map((community) => (
              <li key={community.id}>
                <Link href={`/communities/${community.slug}`} className="card block p-3 hover:border-accent">
                  <span className="font-medium">{community.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'kaydedilenler' && isSelf ? (
        saved.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="Kaydedilen gönderi yok"
            description="Akıştaki kartlarda Kaydet düğmesini kullanabilirsin."
          />
        ) : (
          <ol className="space-y-3">
            {saved.map((view) => (
              <li key={view.post.id}>
                <PostCard view={view} revalidate={`${base}?tab=kaydedilenler`} />
              </li>
            ))}
          </ol>
        )
      ) : null}
    </div>
  );
}
