import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EventCard } from '@/components/discovery/EventCard';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Badge, Card, EmptyState, SectionHeader, Stat, Icon } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate } from '@/lib/time';

const TABS = [
  { key: 'genel', label: 'Genel' },
  { key: 'neden', label: 'Neden' },
  { key: 'nasil', label: 'Nasıl' },
  { key: 'ilerleme', label: 'İlerleme' },
  { key: 'medya', label: 'Medya' },
  { key: 'ekip', label: 'Ekip' },
  { key: 'topluluklar', label: 'Topluluklar' },
  { key: 'etkinlikler', label: 'Etkinlikler' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS: Record<string, { label: string; tone: 'neutral' | 'accent' | 'success' }> = {
  fikir: { label: 'Fikir aşaması', tone: 'neutral' },
  prototip: { label: 'Prototip', tone: 'accent' },
  test: { label: 'Test', tone: 'accent' },
  yayinda: { label: 'Yayında', tone: 'success' },
  arsiv: { label: 'Arşiv', tone: 'neutral' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getStore().getProjectBySlug(slug);
  return { title: project ? project.title : 'Proje' };
}

/**
 * Yasayan proje sayfasi (PROJECT_SPEC 7.8 / 17.11).
 * Statik portfolyo degil: Neden, Nasil ve tarih sirali ilerleme gunlugu var.
 */
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const view = store.getProjectView(slug);
  if (!view) notFound();

  const { project } = view;
  const tab = (TABS.find((entry) => entry.key === tabParam)?.key ?? 'genel') as TabKey;
  const base = `/projects/${slug}`;
  const status = STATUS[project.status];
  const posts = store.getFeed({ viewerId: viewer?.id ?? null, projectId: project.id, limit: 10 });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <CoverBadge seed={project.slug} glyph={project.emoji} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-fg-muted">{project.summary}</p>
            <p className="mt-2 text-sm text-fg-subtle">
              <Link href={`/profile/${view.owner.username}`} className="hover:underline">
                {view.owner.displayName}
              </Link>
              {' · '}
              Başlangıç: {formatDate(project.startedAt)}
              {view.provinceName ? ` · ${view.provinceName}` : ''}
              {view.districtName ? ` / ${view.districtName}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Ekip" value={view.members.length} />
          <Stat label="Güncelleme" value={view.updates.length} />
          <Stat label="Kilometre taşı" value={view.updates.filter((u) => u.isMilestone).length} />
          <Stat label="Topluluk" value={view.communities.length} />
        </div>
      </Card>

      <nav aria-label="Proje bölümleri">
        <ul className="scroll-x hide-scrollbar flex gap-1.5 border-b border-line pb-2">
          {TABS.map((entry) => (
            <li key={entry.key}>
              <Link
                href={entry.key === 'genel' ? base : `${base}?tab=${entry.key}`}
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

      {tab === 'genel' ? (
        <div className="space-y-4">
          {view.pitch ? (
            <section aria-labelledby="pitch-heading">
              <SectionHeader title={<span id="pitch-heading">Pitch videosu</span>} />
              <VideoPlayer media={view.pitch} />
            </section>
          ) : null}

          <Card className="p-4">
            <h2 className="font-semibold">Neden başladı?</h2>
            <p className="mt-2 whitespace-pre-line text-fg-muted">{project.whyText}</p>
            <Link href={`${base}?tab=neden`} className="mt-2 inline-block text-sm font-semibold text-accent underline">
              Tam hikâyeyi oku
            </Link>
          </Card>

          {project.needs ? (
            <Card className="p-4">
              <h2 className="font-semibold">İhtiyaçlar</h2>
              <p className="mt-2 text-fg-muted">{project.needs}</p>
            </Card>
          ) : null}

          {posts.length > 0 ? (
            <section aria-labelledby="project-posts">
              <SectionHeader title={<span id="project-posts">Bu projeyle ilgili paylaşımlar</span>} />
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li key={post.post.id}>
                    <PostCard view={post} revalidate={base} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'neden' ? (
        <div className="space-y-3">
          <Card className="p-4">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-dim-neden)]">Neden</span>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{project.whyText}</p>
          </Card>

          {view.whyStories.length > 0 ? (
            <section aria-labelledby="why-stories">
              <SectionHeader title={<span id="why-stories">Bağlı Neden hikâyeleri</span>} />
              <ul className="space-y-2">
                {view.whyStories.map((story) => (
                  <li key={story.id}>
                    <Link
                      href={`/explore/why/${story.id}`}
                      className="card flex items-center gap-3 p-3 hover:border-accent"
                    >
                      <span aria-hidden="true">💭</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{story.title}</span>
                        <span className="block text-sm text-fg-subtle">
                          {story.authorName}
                          {story.hasVideo ? ' · video anlatım' : ''}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={16} className="text-fg-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'nasil' ? (
        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-dim-nasil)]">Nasıl</span>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{project.howText}</p>
        </Card>
      ) : null}

      {tab === 'ilerleme' ? (
        view.updates.length === 0 ? (
          <EmptyState icon="spark" title="Henüz güncelleme yok" description="İlerleme günlüğü burada listelenir." />
        ) : (
          <ol className="space-y-3">
            {view.updates.map((update) => (
              <li key={update.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={update.createdAt} className="text-sm font-medium">
                      {formatDate(update.createdAt)}
                    </time>
                    {update.isMilestone ? <Badge tone="accent">Kilometre taşı</Badge> : null}
                  </div>
                  <p className="mt-2 text-fg-muted">{update.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        )
      ) : null}

      {tab === 'medya' ? (
        view.gallery.length === 0 && !view.pitch ? (
          <EmptyState icon="video" title="Medya yok" description="Pitch videosu ve ekran görüntüleri burada görünür." />
        ) : (
          <div className="space-y-3">
            {view.pitch ? <VideoPlayer media={view.pitch} /> : null}
            <ul className="grid gap-3 sm:grid-cols-2">
              {view.gallery.map((media) => (
                <li key={media.id}>
                  {media.mediaType === 'video' ? (
                    <VideoPlayer media={media} />
                  ) : (
                    <figure className="overflow-hidden rounded-xl border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={media.storagePath} alt={media.altText} className="w-full" />
                      <figcaption className="bg-bg-raised px-3 py-2 text-sm text-fg-muted">
                        {media.caption}
                      </figcaption>
                    </figure>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {tab === 'ekip' ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.members.map((member) => (
            <li key={member.profile.id}>
              <Link
                href={`/profile/${member.profile.username}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 hover:border-accent"
              >
                <Avatar profile={member.profile} size={40} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{member.profile.displayName}</span>
                  <span className="block truncate text-sm text-fg-subtle">{member.roleLabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'topluluklar' ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {view.communities.map((community) => (
            <li key={community.id}>
              <Link href={`/communities/${community.slug}`} className="card block p-4 hover:border-accent">
                <span className="font-medium">{community.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'etkinlikler' ? (
        view.events.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Bağlı etkinlik yok"
            description="Projenin bağlı olduğu toplulukların etkinlikleri burada listelenir."
          />
        ) : (
          <ul className="space-y-3">
            {view.events.map((event) => {
              const eventView = store.getEventView(event.slug, viewer?.id ?? null);
              return eventView ? (
                <li key={event.id}>
                  <EventCard view={eventView} revalidate={`${base}?tab=etkinlikler`} />
                </li>
              ) : null;
            })}
          </ul>
        )
      ) : null}
    </div>
  );
}
