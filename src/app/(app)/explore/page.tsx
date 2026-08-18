import type { Metadata } from 'next';
import Link from 'next/link';

import { DiscoveryFilterBar, parseFilters } from '@/components/discovery/DiscoveryFilters';
import { EventCard } from '@/components/discovery/EventCard';
import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { resolvePreset } from '@/lib/time';

export const metadata: Metadata = { title: 'Keşfet' };

const DIMENSIONS = [
  {
    href: '/explore/map',
    dimension: 'Nerede',
    icon: '📍',
    color: 'var(--color-dim-nerede)',
    title: 'Haritadan keşfet',
    description: 'Türkiye haritasında il, pilot ilde ilçe seç; oradaki topluluk, kurum, etkinlik ve projeleri gör.',
  },
  {
    href: '/explore/time',
    dimension: 'Ne zaman',
    icon: '🗓️',
    color: 'var(--color-dim-nezaman)',
    title: 'Zaman makinesi',
    description: 'Geçmişte ne olmuş, gelecekte ne var? Etkinlikler, son başvuru tarihleri ve proje kilometre taşları.',
  },
  {
    href: '/explore/why',
    dimension: 'Neden',
    icon: '💭',
    color: 'var(--color-dim-neden)',
    title: 'Neden panosu',
    description: 'İnsanları bir alana, projeye veya başarıya götüren deneyimler. Motivasyon sözü değil, gerçek hikâye.',
  },
  {
    href: '/explore/how',
    dimension: 'Nasıl',
    icon: '🧭',
    color: 'var(--color-dim-nasil)',
    title: 'Nasıl kaynakları',
    description: 'Toplulukların kendi deneyimlerinden ürettiği kısa rehberler, kontrol listeleri ve derlemeler.',
  },
];

/** Kesfet ana sayfasi (PROJECT_SPEC 6.1 ekran 06). */
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

  const searching = Boolean(filters.query || filters.topic || filters.time !== 'all' || filters.mode !== 'all');

  const results = searching
    ? store.discover({
        topicId: topic?.id ?? null,
        range,
        mode: filters.mode,
        query: filters.query,
        viewerId: viewer?.id ?? null,
      })
    : null;

  const upcoming = store
    .listEvents({ range: resolvePreset('next-30', new Date()), viewerId: viewer?.id ?? null })
    .slice(0, 3);

  const featuredWhy = store.listWhyStories({ featuredOnly: true }).slice(0, 3);
  const rootCommunities = store.listCommunities({ kind: 'root' });

  return (
    <div className="space-y-5">
      <SectionHeader
        as="h1"
        title="Keşfet"
        description="Aynı içerik beş farklı bağlamdan bulunabilir: Ne, Nerede, Ne zaman, Nasıl, Neden."
      />

      <DiscoveryFilterBar base="/explore" state={filters} topics={topics} />

      {results ? (
        <section aria-labelledby="explore-results">
          <SectionHeader
            title={<span id="explore-results">Sonuçlar</span>}
            description={`${results.communities.length} topluluk · ${results.events.length} etkinlik · ${results.projects.length} proje · ${results.posts.length} paylaşım`}
          />

          {results.communities.length + results.events.length + results.projects.length + results.posts.length ===
          0 ? (
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
              {results.events.length > 0 ? (
                <ul className="space-y-3">
                  {results.events.slice(0, 4).map((view) => (
                    <li key={view.event.id}>
                      <EventCard view={view} revalidate="/explore" />
                    </li>
                  ))}
                </ul>
              ) : null}

              {results.communities.length > 0 ? (
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
              ) : null}

              {results.projects.length > 0 ? (
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
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      <section aria-labelledby="dimensions-heading">
        <h2 id="dimensions-heading" className="sr-only">
          5N keşif boyutları
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                className="card block h-full p-4 transition-colors hover:border-accent"
                style={{ borderLeftWidth: 4, borderLeftColor: entry.color }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: entry.color }}
                >
                  {entry.dimension}
                </span>
                <span className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <span aria-hidden="true">{entry.icon}</span>
                  {entry.title}
                </span>
                <span className="mt-1 block text-sm text-fg-muted">{entry.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="root-communities-heading">
        <SectionHeader
          title={<span id="root-communities-heading">Kök topluluklar</span>}
          description="Platform moderatörlerince açılan ana alanlar. Niş ve yerel topluluklar bunların dalları olarak yaşar."
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
          description="Bir kişiyi bu işe götüren şey neydi?"
          action={
            <Link href="/explore/why" className="text-sm font-semibold text-accent underline">
              Neden panosu
            </Link>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {featuredWhy.map((view) => (
            <li key={view.story.id}>
              <Link href={`/explore/why/${view.story.id}`} className="card block h-full p-4 hover:border-accent">
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
    </div>
  );
}
