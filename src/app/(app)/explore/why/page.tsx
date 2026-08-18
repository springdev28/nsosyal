import type { Metadata } from 'next';
import Link from 'next/link';

import { Avatar, Badge, Card, ChipRow, EmptyState, FilterChip, InfoNote, SectionHeader, Icon } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Neden panosu · Keşfet' };

const VIEWS = [
  { key: 'hepsi', label: 'Tümü' },
  { key: 'one-cikan', label: 'Öne çıkanlar' },
  { key: 'takip', label: 'Takip ettiklerim' },
  { key: 'topluluk', label: 'Topluluklarım' },
] as const;

/**
 * Neden panosu (PROJECT_SPEC 7.6 / 17.9).
 *
 * DIKKAT: Bu bir motivasyon sozu duvari degildir. Sorulan soru:
 * "Seni bu ise, projeye, alana veya basariya ne goturdu?"
 * Bos durum metni bu kavrami dogru anlatmak zorundadir.
 */
export default async function WhyBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; view?: string; q?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const topics = store.getTopics();
  const topic = params.topic ? store.getTopicBySlug(params.topic) : null;
  const view = (VIEWS.find((entry) => entry.key === params.view)?.key ?? 'hepsi') as (typeof VIEWS)[number]['key'];

  const stories = store.listWhyStories({
    topicId: topic?.id ?? null,
    featuredOnly: view === 'one-cikan',
    followingOnly: view === 'takip',
    myCommunitiesOnly: view === 'topluluk',
    viewerId: viewer?.id ?? null,
    query: params.q,
  });

  const href = (patch: { topic?: string | null; view?: string }) => {
    const search = new URLSearchParams();
    const nextTopic = patch.topic === undefined ? params.topic : patch.topic;
    const nextView = patch.view ?? view;
    if (nextTopic) search.set('topic', nextTopic);
    if (nextView !== 'hepsi') search.set('view', nextView);
    if (params.q) search.set('q', params.q);
    const value = search.toString();
    return value ? `/explore/why?${value}` : '/explore/why';
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Neden panosu"
        description="Bir kişiyi o alana, projeye veya başarıya götüren deneyim, merak, problem ya da dönüm noktası."
        action={
          <Link
            href="/create/why"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Hikâyeni yaz
          </Link>
        }
      />

      <InfoNote icon="spark">
        Burası motivasyon sözü duvarı değil. İyi bir Neden hikâyesi somut bir an anlatır: neyi çözemedin, ne
        kaybettin, ne fark ettin?
      </InfoNote>

      <div className="space-y-2">
        <ChipRow label="Görünüm">
          {VIEWS.map((entry) => (
            <FilterChip key={entry.key} href={href({ view: entry.key })} active={view === entry.key}>
              {entry.label}
            </FilterChip>
          ))}
        </ChipRow>

        <ChipRow label="Konu">
          <FilterChip href={href({ topic: null })} active={!topic}>
            Tüm konular
          </FilterChip>
          {topics.map((entry) => (
            <FilterChip key={entry.id} href={href({ topic: entry.slug })} active={topic?.id === entry.id}>
              {entry.name}
            </FilterChip>
          ))}
        </ChipRow>
      </div>

      {stories.length === 0 ? (
        <EmptyState
          icon="spark"
          title="Bu filtrede hikâye yok"
          description="Neden panosunda insanlar bir alana ya da projeye nasıl yöneldiklerini anlatır. İlk hikâyeyi sen yazabilirsin."
          action={
            <Link href="/create/why" className="text-sm font-semibold text-accent underline">
              Kendi hikâyeni yaz
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {stories.map((entry) => (
            <li key={entry.story.id}>
              <Card as="article" className="flex h-full flex-col p-4">
                <div className="flex items-center gap-2">
                  <Avatar profile={entry.author} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.author.displayName}</p>
                    <p className="text-xs text-fg-subtle">
                      <time dateTime={entry.story.createdAt}>{formatRelative(entry.story.createdAt)}</time>
                      {entry.provinceName ? ` · ${entry.provinceName}` : ''}
                    </p>
                  </div>
                  {entry.story.featured ? (
                    <span className="ml-auto">
                      <Badge tone="accent">Öne çıkan</Badge>
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 font-semibold">
                  <Link href={`/explore/why/${entry.story.id}`} className="hover:underline">
                    {entry.story.title}
                  </Link>
                </h2>

                <p className="mt-2 line-clamp-4 text-sm text-fg-muted">{entry.story.body}</p>

                <div className="mt-auto pt-3">
                  {entry.linkedProject ? (
                    <Link
                      href={`/projects/${entry.linkedProject.slug}`}
                      className="flex items-center gap-2 rounded-lg border border-line bg-bg-sunken px-2.5 py-2 text-sm hover:border-accent"
                    >
                      <span className="min-w-0 flex-1 truncate">{entry.linkedProject.title}</span>
                      <Icon name="chevronRight" size={16} className="text-fg-subtle" />
                    </Link>
                  ) : entry.linkedCommunity ? (
                    <Link
                      href={`/communities/${entry.linkedCommunity.slug}`}
                      className="flex items-center gap-2 rounded-lg border border-line bg-bg-sunken px-2.5 py-2 text-sm hover:border-accent"
                    >
                      <span className="min-w-0 flex-1 truncate">{entry.linkedCommunity.name}</span>
                      <Icon name="chevronRight" size={16} className="text-fg-subtle" />
                    </Link>
                  ) : null}

                  <p className="mt-2 flex items-center gap-2 text-xs text-fg-subtle">
                    {entry.media ? <span>🎬 Video anlatım</span> : null}
                    {entry.topics[0] ? <span>{entry.topics[0].name}</span> : null}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
