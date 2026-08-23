/**
 * This route turns URL filters into DemoStore search results. It renders the
 * shared view models with the same cards used by feed and profile routes.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import { DiscoveryFilterBar, parseFilters } from '@/components/discovery/DiscoveryFilters';
import { EventCard } from '@/components/discovery/EventCard';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Card, DemoBadge, EmptyState, SectionHeader, VerifiedMark } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { resolvePreset } from '@/lib/time';
import type { ProfileSummary } from '@/types/view';

export const metadata: Metadata = { title: 'Keşfet' };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const viewer = await getViewer();
  const store = getStore();

  const topics = store.getTopics();
  const topic = filters.topic ? store.getTopicBySlug(filters.topic) : null;
  const range = resolvePreset(filters.time, new Date());

  const searching = Boolean(
    filters.query ||
      filters.province ||
      filters.district ||
      filters.topic ||
      filters.time !== 'all' ||
      filters.mode !== 'all',
  );

  const results = searching
    ? store.discover({
        provinceCode: filters.province,
        districtCode: filters.district,
        topicId: topic?.id ?? null,
        range,
        mode: filters.mode,
        query: filters.query,
        viewerId: viewer?.id ?? null,
      })
    : null;

  const upcoming = results
    ? []
    : store
        .listEvents({ range: resolvePreset('next-30', new Date()), viewerId: viewer?.id ?? null })
        .slice(0, 3);
  const featuredWhy = results ? [] : store.listWhyStories({ featuredOnly: true }).slice(0, 3);
  const rootCommunities = results ? [] : store.listCommunities({ kind: 'root' });
  const resultCount = results
    ? results.communities.length +
      results.events.length +
      results.projects.length +
      results.posts.length +
      results.profiles.length +
      results.organizations.length
    : 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        as="h1"
        title="Keşfet"
        description="Kişi, paylaşım, topluluk, proje, etkinlik ve kurum ara."
      />

      <DiscoveryFilterBar base="/explore" state={filters} topics={topics} />

      {results ? (
        <section aria-labelledby="explore-results">
          <SectionHeader
            title={<span id="explore-results">Sonuçlar</span>}
            description={`${resultCount} sonuç`}
          />

          {resultCount === 0 ? (
            <EmptyState
              icon="search"
              title="Bu filtrelerde sonuç bulunamadı"
              description="Aramayı sadeleştir, tarihi genişlet veya konuyu kaldır."
              action={
                <Link href="/explore" className="text-sm font-semibold text-accent underline">
                  Filtreleri temizle
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {results.profiles.length > 0 ? (
                <ResultGroup id="people-results" title={`Kişiler (${results.profiles.length})`}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {results.profiles.map((profile) => (
                      <li key={profile.id}>
                        <ProfileResultCard profile={profile} />
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              ) : null}

              {results.organizations.length > 0 ? (
                <ResultGroup id="organization-results" title={`Kurumlar (${results.organizations.length})`}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {results.organizations.map((profile) => (
                      <li key={profile.id}>
                        <ProfileResultCard profile={profile} />
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              ) : null}

              {results.events.length > 0 ? (
                <ResultGroup id="event-results" title={`Etkinlikler (${results.events.length})`}>
                  <ul className="space-y-3">
                    {results.events.slice(0, 4).map((view) => (
                      <li key={view.event.id}>
                        <EventCard view={view} revalidate="/explore" />
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              ) : null}

              {results.communities.length > 0 ? (
                <ResultGroup id="community-results" title={`Topluluklar (${results.communities.length})`}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {results.communities.slice(0, 6).map((view) => (
                      <li key={view.community.id}>
                        <Card className="h-full p-4">
                          <Link href={`/communities/${view.community.slug}`} className="font-semibold hover:underline">
                            {view.community.name}
                          </Link>
                          <p className="mt-1 text-sm text-fg-muted">{view.community.description}</p>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              ) : null}

              {results.projects.length > 0 ? (
                <ResultGroup id="project-results" title={`Projeler (${results.projects.length})`}>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {results.projects.slice(0, 6).map((project) => (
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
                </ResultGroup>
              ) : null}

              {results.posts.length > 0 ? (
                <ResultGroup id="post-results" title={`Paylaşımlar (${results.posts.length})`}>
                  <ul>
                    {results.posts.map((view) => (
                      <li key={view.post.id}>
                        <PostCard view={view} revalidate="/explore" />
                      </li>
                    ))}
                  </ul>
                </ResultGroup>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {results ? null : (
        <>
          <section aria-labelledby="root-communities-heading">
            <SectionHeader
              title={<span id="root-communities-heading">Kök topluluklar</span>}
              description="Platform moderatörlerince açılan ana alanlar."
              action={
                <Link href="/communities" className="text-sm font-semibold text-accent underline">
                  Tümü
                </Link>
              }
            />
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {rootCommunities.map((community) => (
                <li key={community.id}>
                  <Link
                    href={`/communities/${community.slug}`}
                    className="card flex h-full flex-col gap-1 p-3 transition-colors hover:border-accent"
                  >
                    <CoverBadge seed={community.slug} glyph={community.emoji} size={44} />
                    <span className="font-medium">{community.name}</span>
                    <span className="text-xs text-fg-subtle">
                      {community.memberCount.toLocaleString('tr-TR')} üye
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="upcoming-heading">
            <SectionHeader
              title={<span id="upcoming-heading">Yaklaşan etkinlikler</span>}
              action={
                <Link href="/explore/time" className="text-sm font-semibold text-accent underline">
                  Zaman makinesi
                </Link>
              }
            />
            <ul className="space-y-3">
              {upcoming.map((view) => (
                <li key={view.event.id}>
                  <EventCard view={view} revalidate="/explore" />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="why-heading">
            <SectionHeader
              title={<span id="why-heading">Öne çıkan Neden hikâyeleri</span>}
              action={
                <Link href="/explore/why" className="text-sm font-semibold text-accent underline">
                  Tümü
                </Link>
              }
            />
            <ul className="grid gap-3 sm:grid-cols-3">
              {featuredWhy.map((view) => (
                <li key={view.story.id}>
                  <Link
                    href={`/explore/why/${view.story.id}`}
                    className="card block h-full p-4 hover:border-accent"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-dim-neden)]">
                      Neden
                    </span>
                    <span className="mt-1 block font-semibold">{view.story.title}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{view.author.displayName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function ResultGroup({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h3 id={id} className="text-sm font-bold text-fg-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProfileResultCard({ profile }: { profile: ProfileSummary }) {
  return (
    <Link
      href={`/profile/${profile.username}`}
      className="card flex h-full min-w-0 items-center gap-3 p-4 transition-colors hover:border-accent"
    >
      <Avatar profile={profile} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-semibold">
          <span className="truncate">{profile.displayName}</span>
          {profile.verified ? <VerifiedMark kind={profile.kind} /> : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-fg-muted">
          <span className="truncate">@{profile.username}</span>
          <DemoBadge />
        </span>
      </span>
    </Link>
  );
}
