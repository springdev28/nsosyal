import type { Metadata } from 'next';
import Link from 'next/link';

import { DiscoveryFilterBar, buildFilterHref, parseFilters } from '@/components/discovery/DiscoveryFilters';
import { EventCard } from '@/components/discovery/EventCard';
import { PostCard } from '@/components/feed/PostCard';
import { Card, EmptyState, InfoNote, SectionHeader } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, formatRelative, isWithin, resolvePreset } from '@/lib/time';

export const metadata: Metadata = { title: 'Ne zaman · Keşfet' };

/**
 * "Ne zaman" kesif ekrani (PROJECT_SPEC 7.5 / 17.7).
 *
 * Kritik kural: her varlik kendi zaman alanini kullanir ve bunlar birbirine
 * karistirilmaz. Gonderiler `created_at`, etkinlikler `starts_at`/`ends_at`,
 * son basvurular `deadline_at`, proje kilometre taslari `milestone_date`.
 * "Gelecek 30 gun" gelecekte paylasilacak gonderi TAHMIN ETMEZ; gelecekte
 * gerceklesecek etkinlikleri ve son tarihleri gosterir.
 */
export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = parseFilters(params);
  // Zaman ekraninin anlamli varsayilani "gelecek 30 gun".
  const filters = { ...raw, time: params.time ? raw.time : ('next-30' as const) };

  const viewer = await getViewer();
  const store = getStore();
  const now = new Date();

  const topics = store.getTopics();
  const topic = filters.topic ? store.getTopicBySlug(filters.topic) : null;
  const range = resolvePreset(filters.time, now);

  const events = store.listEvents({
    provinceCode: filters.province,
    districtCode: filters.district,
    topicId: topic?.id ?? null,
    range,
    mode: filters.mode,
    query: filters.query,
    viewerId: viewer?.id ?? null,
  });

  // Son basvuru tarihleri ayri bir eksendir: etkinlik tarihiyle karistirilmaz.
  const deadlines = store
    .listEvents({ topicId: topic?.id ?? null, query: filters.query, mode: filters.mode })
    .filter((view) => view.event.deadlineAt && isWithin(range, view.event.deadlineAt))
    .sort(
      (a, b) => new Date(a.event.deadlineAt!).getTime() - new Date(b.event.deadlineAt!).getTime(),
    );

  // Proje kilometre taslari yalnizca gecmis araliklarda anlamlidir.
  const milestones = store
    .listProjects({ topicId: topic?.id ?? null, query: filters.query })
    .flatMap((project) => {
      const view = store.getProjectView(project.slug);
      if (!view) return [];
      return view.updates
        .filter((update) => update.isMilestone && update.milestoneDate && isWithin(range, update.milestoneDate))
        .map((update) => ({ project, update }));
    })
    .sort((a, b) => new Date(b.update.createdAt).getTime() - new Date(a.update.createdAt).getTime());

  // Gonderiler yalnizca gecmis/su an araliginda anlamlidir.
  const posts = store
    .discover({
      provinceCode: filters.province,
      districtCode: filters.district,
      topicId: topic?.id ?? null,
      range,
      query: filters.query,
      viewerId: viewer?.id ?? null,
    })
    .posts.slice(0, 6);

  const isFutureRange = filters.time === 'next-7' || filters.time === 'next-30';
  const base = '/explore/time';

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Ne zaman"
        description="Geçmişte ne olmuş, gelecekte ne var? Her varlık kendi tarih alanına göre listelenir."
      />

      <DiscoveryFilterBar base={base} state={filters} topics={topics} />

      <InfoNote icon="clock">
        Saatler İstanbul saat dilimindedir.
      </InfoNote>

      <section aria-labelledby="time-events">
        <SectionHeader
          title={<span id="time-events">Etkinlikler ({events.length})</span>}
          description="starts_at / ends_at alanına göre"
        />
        {events.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Bu aralıkta etkinlik yok"
            description="Tarih aralığını genişletebilir veya çevrim içi etkinlikleri dahil edebilirsin."
            action={
              <Link
                href={buildFilterHref(base, filters, { time: 'all', mode: 'all' })}
                className="text-sm font-semibold text-accent underline"
              >
                Tüm zamanları göster
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {events.map((view) => (
              <li key={view.event.id}>
                <EventCard view={view} revalidate={base} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {deadlines.length > 0 ? (
        <section aria-labelledby="time-deadlines">
          <SectionHeader
            title={<span id="time-deadlines">Son başvuru tarihleri ({deadlines.length})</span>}
            description="deadline_at alanına göre · etkinlik tarihinden ayrı tutulur"
          />
          <ul className="space-y-2">
            {deadlines.map((view) => (
              <li key={view.event.id}>
                <Card className="flex flex-wrap items-center gap-3 p-3">
                  <span aria-hidden="true" className="text-xl">
                    ⏳
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/events/${view.event.slug}`} className="font-medium hover:underline">
                      {view.event.title}
                    </Link>
                    <span className="block text-sm text-fg-muted">
                      Son başvuru:{' '}
                      <time dateTime={view.event.deadlineAt!}>{formatDate(view.event.deadlineAt!)}</time> (
                      {formatRelative(view.event.deadlineAt!)})
                    </span>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {milestones.length > 0 ? (
        <section aria-labelledby="time-milestones">
          <SectionHeader
            title={<span id="time-milestones">Proje kilometre taşları ({milestones.length})</span>}
            description="milestone_date alanına göre"
          />
          <ol className="space-y-2">
            {milestones.slice(0, 8).map(({ project, update }) => (
              <li key={update.id}>
                <Card className="flex flex-wrap items-start gap-3 p-3">
                  <CoverBadge seed={project.slug} glyph={project.emoji} size={40} />
                  <span className="min-w-0 flex-1">
                    <Link href={`/projects/${project.slug}`} className="font-medium hover:underline">
                      {project.title}
                    </Link>
                    <span className="block text-sm text-fg-muted">{update.body}</span>
                    <span className="block text-xs text-fg-subtle">
                      <time dateTime={update.createdAt}>{formatDate(update.createdAt)}</time>
                    </span>
                  </span>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {!isFutureRange && posts.length > 0 ? (
        <section aria-labelledby="time-posts">
          <SectionHeader
            title={<span id="time-posts">O dönemin paylaşımları ({posts.length})</span>}
            description="created_at alanına göre"
          />
          <ul className="space-y-3">
            {posts.map((view) => (
              <li key={view.post.id}>
                <PostCard view={view} revalidate={base} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isFutureRange ? (
        <p className="text-sm text-fg-subtle">
          Gelecek aralığında paylaşım listelenmez. Geçmiş paylaşımları görmek için “Son 30 gün” veya “Tüm
          zamanlar” seçebilirsin.
        </p>
      ) : null}
    </div>
  );
}
