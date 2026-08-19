import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { joinCommunity, leaveCommunity } from '@/actions/social';
import { EventCard } from '@/components/discovery/EventCard';
import { ResourceCard } from '@/components/discovery/ResourceCard';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Badge, Card, EmptyState, SectionHeader, Icon } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate } from '@/lib/time';

const TABS = [
  { key: 'akis', label: 'Akış' },
  { key: 'kaynaklar', label: 'Kaynaklar' },
  { key: 'etkinlikler', label: 'Etkinlikler' },
  { key: 'projeler', label: 'Projeler' },
  { key: 'uyeler', label: 'Üyeler' },
  { key: 'hakkinda', label: 'Hakkında' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const community = getStore().getCommunityBySlug(slug);
  return { title: community ? community.name : 'Topluluk' };
}

/** Topluluk sayfasi ve sekmeleri (PROJECT_SPEC 7.3). */
export default async function CommunityPage({
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

  const view = store.getCommunityView(slug, viewer?.id ?? null);
  if (!view) notFound();

  const { community } = view;
  const tab = (TABS.find((entry) => entry.key === tabParam)?.key ?? 'akis') as TabKey;
  const base = `/communities/${slug}`;

  const posts = store.getFeed({ viewerId: viewer?.id ?? null, communityId: community.id, limit: 20 });
  const resources = store.getCommunityResources(community.id);
  const events = store.listEvents({ viewerId: viewer?.id ?? null }).filter((entry) => entry.community?.id === community.id);
  const projects = store.getCommunityProjects(community.id);
  const members = store.getCommunityMembers(community.id);

  const counts: Record<TabKey, number | null> = {
    akis: posts.length,
    kaynaklar: resources.length,
    etkinlikler: events.length,
    projeler: projects.length,
    uyeler: members.length,
    hakkinda: null,
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <CoverBadge seed={community.slug} glyph={community.emoji} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
              <Badge tone={community.kind === 'root' ? 'accent' : 'neutral'}>
                {community.kind === 'root' ? 'Kök topluluk' : 'Dal topluluk'}
              </Badge>
              {community.kind === 'branch' ? <Badge tone="success">Moderatör onaylı</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-fg-subtle">
              {community.memberCount.toLocaleString('tr-TR')} üye · {view.rootTopic.name}
              {view.provinceName ? ` · ${view.provinceName}` : ''}
              {view.districtName ? ` / ${view.districtName}` : ''}
              {' · '}
              {community.scope === 'local' ? 'Yerel' : community.scope === 'online' ? 'Çevrim içi' : 'Ulusal'}
            </p>
          </div>

          {view.viewerIsMember ? (
            <form action={leaveCommunity}>
              <input type="hidden" name="communityId" value={community.id} />
              <input type="hidden" name="revalidate" value={base} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
              >
                <Icon name="check" size={15} /> Üyesin
              </button>
            </form>
          ) : (
            <form action={joinCommunity}>
              <input type="hidden" name="communityId" value={community.id} />
              <input type="hidden" name="revalidate" value={base} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
              >
                Katıl
              </button>
            </form>
          )}
        </div>

        <p className="mt-3 text-fg-muted">{community.description}</p>

        {view.parentRoot ? (
          <p className="mt-2 text-sm text-fg-subtle">
            Bağlı olduğu kök alan:{' '}
            <Link href={`/communities/${view.parentRoot.slug}`} className="underline">
              {view.parentRoot.name}
            </Link>
          </p>
        ) : null}
      </Card>

      <nav aria-label="Topluluk bölümleri">
        <ul className="scroll-x hide-scrollbar flex gap-1.5 border-b border-line pb-2">
          {TABS.map((entry) => (
            <li key={entry.key}>
              <Link
                href={entry.key === 'akis' ? base : `${base}?tab=${entry.key}`}
                aria-current={tab === entry.key ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm ${
                  tab === entry.key ? 'bg-accent-soft font-semibold text-accent' : 'text-fg-muted hover:bg-bg-sunken'
                }`}
              >
                {entry.label}
                {counts[entry.key] !== null ? (
                  <span className="text-xs text-fg-subtle">{counts[entry.key]}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === 'akis' ? (
        posts.length === 0 ? (
          <EmptyState
            icon="message"
            title="Henüz gönderi yok"
            description="İlk sohbeti sen başlat. Soru sormak da bir başlangıçtır."
            action={
              <Link href="/feed" className="text-sm font-semibold text-accent underline">
                Ana akıştan paylaş
              </Link>
            }
          />
        ) : (
          <ol className="space-y-3">
            {posts.map((post) => (
              <li key={post.post.id}>
                <PostCard view={post} revalidate={base} />
              </li>
            ))}
          </ol>
        )
      ) : null}

      {tab === 'kaynaklar' ? (
        resources.length === 0 ? (
          <EmptyState
            icon="route"
            title="Bu toplulukta henüz kaynak yok"
            description="Nasıl kaynakları, topluluğun kendi deneyiminden çıkan kısa rehberlerdir."
            action={
              <Link href="/explore/how" className="text-sm font-semibold text-accent underline">
                Diğer kaynaklara bak
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {resources.map((entry) => (
              <li key={entry.resource.id}>
                <ResourceCard view={entry} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'etkinlikler' ? (
        events.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Planlanmış etkinlik yok"
            description="Topluluk etkinlikleri burada listelenir ve hatırlatma kurabilirsin."
          />
        ) : (
          <ul className="space-y-3">
            {events.map((entry) => (
              <li key={entry.event.id}>
                <EventCard view={entry} revalidate={`${base}?tab=etkinlikler`} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'projeler' ? (
        projects.length === 0 ? (
          <EmptyState
            icon="beaker"
            title="Bu topluluğa bağlı proje yok"
            description="Projeni oluştururken bu topluluğu seçersen burada görünür."
            action={
              <Link href="/create/project" className="text-sm font-semibold text-accent underline">
                Proje oluştur
              </Link>
            }
          />
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

      {tab === 'uyeler' ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <li key={member.profile.id}>
              <Link
                href={`/profile/${member.profile.username}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 hover:border-accent"
              >
                <Avatar profile={member.profile} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{member.profile.displayName}</span>
                  <span className="block truncate text-sm text-fg-subtle">@{member.profile.username}</span>
                </span>
                {member.role !== 'member' ? (
                  <Badge tone="accent">{member.role === 'manager' ? 'Yönetici' : 'Moderatör'}</Badge>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === 'hakkinda' ? (
        <div className="space-y-3">
          <Card className="p-4">
            <SectionHeader title="Topluluk kuralları" />
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
              {community.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Bilgiler" />
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-fg-subtle">Kök alan</dt>
                <dd className="font-medium">{view.rootTopic.name}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Hedef kitle</dt>
                <dd className="font-medium">{community.audience}</dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Kapsam</dt>
                <dd className="font-medium">
                  {community.scope === 'local' ? 'Yerel' : community.scope === 'online' ? 'Çevrim içi' : 'Ulusal'}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Kuruluş</dt>
                <dd className="font-medium">{formatDate(community.createdAt)}</dd>
              </div>
              {view.manager ? (
                <div>
                  <dt className="text-fg-subtle">Yönetici</dt>
                  <dd className="font-medium">
                    <Link href={`/profile/${view.manager.username}`} className="underline">
                      {view.manager.displayName}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
