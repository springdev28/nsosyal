import type { Metadata } from 'next';
import Link from 'next/link';

import { joinCommunity, leaveCommunity } from '@/actions/social';
import { Badge, Card, ChipRow, EmptyState, FilterChip, InfoNote, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';

export const metadata: Metadata = { title: 'Topluluklar' };

const SCOPES = [
  { key: 'hepsi', label: 'Tümü' },
  { key: 'uyeliklerim', label: 'Üye olduklarım' },
  { key: 'yerel', label: 'Yerel' },
  { key: 'cevrimici', label: 'Çevrim içi' },
] as const;

/** Topluluk listesi (PROJECT_SPEC 7.3). */
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const topics = store.getTopics();
  const topic = params.topic ? store.getTopicBySlug(params.topic) : null;
  const scope = (SCOPES.find((entry) => entry.key === params.scope)?.key ?? 'hepsi') as (typeof SCOPES)[number]['key'];

  const memberIds = viewer ? store.getMemberCommunityIds(viewer.id) : [];

  const roots = store.listCommunities({ kind: 'root', topicId: topic?.id ?? null });
  let branches = store.listCommunities({ kind: 'branch', topicId: topic?.id ?? null });

  if (scope === 'uyeliklerim') branches = branches.filter((community) => memberIds.includes(community.id));
  if (scope === 'yerel') branches = branches.filter((community) => community.scope === 'local');
  if (scope === 'cevrimici') branches = branches.filter((community) => community.scope === 'online');

  const href = (patch: { topic?: string | null; scope?: string }) => {
    const search = new URLSearchParams();
    const nextTopic = patch.topic === undefined ? params.topic : patch.topic;
    const nextScope = patch.scope ?? scope;
    if (nextTopic) search.set('topic', nextTopic);
    if (nextScope !== 'hepsi') search.set('scope', nextScope);
    const value = search.toString();
    return value ? `/communities?${value}` : '/communities';
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Topluluklar"
        description="Kök alanlar platform moderatörlerince açılır. Niş ve yerel topluluklar kullanıcı önerisi ve moderatör onayıyla kurulur."
        action={
          <Link
            href="/communities/apply"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Topluluk öner
          </Link>
        }
      />

      <div className="space-y-2">
        <ChipRow label="Kapsam">
          {SCOPES.map((entry) => (
            <FilterChip key={entry.key} href={href({ scope: entry.key })} active={scope === entry.key}>
              {entry.label}
            </FilterChip>
          ))}
        </ChipRow>
        <ChipRow label="Kök alan">
          <FilterChip href={href({ topic: null })} active={!topic}>
            Tüm alanlar
          </FilterChip>
          {topics.map((entry) => (
            <FilterChip key={entry.id} href={href({ topic: entry.slug })} active={topic?.id === entry.id}>
              <span aria-hidden="true">{entry.emoji}</span> {entry.name}
            </FilterChip>
          ))}
        </ChipRow>
      </div>

      {scope === 'hepsi' || scope === 'uyeliklerim' ? (
        <section aria-labelledby="roots-heading">
          <SectionHeader
            title={<span id="roots-heading">Kök topluluklar</span>}
            description="Kalıcı ana alanlar. Her dal topluluk bunlardan birine bağlıdır."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {roots
              .filter((community) => scope !== 'uyeliklerim' || memberIds.includes(community.id))
              .map((community) => (
                <li key={community.id}>
                  <CommunityRow
                    slug={community.slug}
                    name={community.name}
                    emoji={community.emoji}
                    description={community.description}
                    memberCount={community.memberCount}
                    kind="root"
                    place={null}
                    isMember={memberIds.includes(community.id)}
                    communityId={community.id}
                  />
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="branches-heading">
        <SectionHeader
          title={<span id="branches-heading">Dal topluluklar ({branches.length})</span>}
          description="Moderatör onayıyla açılmış yerel ve niş topluluklar."
        />

        {branches.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Bu filtrede topluluk yok"
            description="Aradığın topluluk yoksa kendin önerebilirsin; moderatör onayından sonra açılır."
            action={
              <Link href="/communities/apply" className="text-sm font-semibold text-accent underline">
                Topluluk öner
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {branches.map((community) => (
              <li key={community.id}>
                <CommunityRow
                  slug={community.slug}
                  name={community.name}
                  emoji={community.emoji}
                  description={community.description}
                  memberCount={community.memberCount}
                  kind="branch"
                  place={locationLabel(community.provinceCode, community.districtCode)}
                  isMember={memberIds.includes(community.id)}
                  communityId={community.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <InfoNote icon="🛡️">
        Topluluk açma başvuruları moderatör incelemesinden geçer. Bu, benzer toplulukların çoğalmasını ve
        kurallara aykırı alanların açılmasını önler.
      </InfoNote>
    </div>
  );
}

function CommunityRow({
  slug,
  name,
  emoji,
  description,
  memberCount,
  kind,
  place,
  isMember,
  communityId,
}: {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: number;
  kind: 'root' | 'branch';
  place: string | null;
  isMember: boolean;
  communityId: string;
}) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={`/communities/${slug}`} className="hover:underline">
              {name}
            </Link>
          </h3>
          <p className="text-xs text-fg-subtle">
            {memberCount.toLocaleString('tr-TR')} üye{place ? ` · ${place}` : ''}
          </p>
        </div>
        <Badge tone={kind === 'root' ? 'accent' : 'neutral'}>{kind === 'root' ? 'Kök' : 'Dal'}</Badge>
      </div>

      <p className="mt-2 line-clamp-3 flex-1 text-sm text-fg-muted">{description}</p>

      <div className="mt-3">
        {isMember ? (
          <form action={leaveCommunity}>
            <input type="hidden" name="communityId" value={communityId} />
            <input type="hidden" name="revalidate" value="/communities" />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
            >
              <span aria-hidden="true">✓</span> Üyesin · ayrıl
            </button>
          </form>
        ) : (
          <form action={joinCommunity}>
            <input type="hidden" name="communityId" value={communityId} />
            <input type="hidden" name="revalidate" value="/communities" />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
            >
              Katıl
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}
