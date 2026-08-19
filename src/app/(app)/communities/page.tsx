import type { Metadata } from 'next';
import Link from 'next/link';

import { CommunityCard } from '@/components/community/CommunityCard';
import { ChipRow, EmptyState, FilterChip, Icon, InfoNote, SectionHeader, TopTabs } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';

export const metadata: Metadata = { title: 'Topluluklar' };

const SCOPES = [
  { key: 'hepsi', label: 'Tümü' },
  { key: 'yerel', label: 'Yerel' },
  { key: 'cevrimici', label: 'Çevrim içi' },
] as const;

/** Topluluk listesi (PROJECT_SPEC 7.3). */
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; scope?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const topics = store.getTopics();
  const topic = params.topic ? store.getTopicBySlug(params.topic) : null;
  const scope = (SCOPES.find((entry) => entry.key === params.scope)?.key ??
    'hepsi') as (typeof SCOPES)[number]['key'];
  const mine = params.tab === 'benim';

  const memberIds = viewer ? store.getMemberCommunityIds(viewer.id) : [];

  const roots = store.listCommunities({ kind: 'root', topicId: topic?.id ?? null });
  let branches = store.listCommunities({ kind: 'branch', topicId: topic?.id ?? null });

  if (scope === 'yerel') branches = branches.filter((community) => community.scope === 'local');
  if (scope === 'cevrimici') branches = branches.filter((community) => community.scope === 'online');

  const visibleRoots = mine ? roots.filter((entry) => memberIds.includes(entry.id)) : roots;
  const visibleBranches = mine ? branches.filter((entry) => memberIds.includes(entry.id)) : branches;

  const href = (patch: { topic?: string | null; scope?: string; tab?: string }) => {
    const search = new URLSearchParams();
    const nextTopic = patch.topic === undefined ? params.topic : patch.topic;
    const nextScope = patch.scope ?? scope;
    const nextTab = patch.tab === undefined ? params.tab : patch.tab;
    if (nextTopic) search.set('topic', nextTopic);
    if (nextScope !== 'hepsi') search.set('scope', nextScope);
    if (nextTab) search.set('tab', nextTab);
    const value = search.toString();
    return value ? `/communities?${value}` : '/communities';
  };

  const memberPreview = (communityId: string) =>
    store
      .getCommunityMembers(communityId)
      .slice(0, 5)
      .map((entry) => entry.profile);

  return (
    <div>
      <TopTabs
        tabs={[
          { href: href({ tab: '' }), label: 'Keşfet', active: !mine },
          { href: href({ tab: 'benim' }), label: 'Topluluklarım', active: mine },
        ]}
      />

      <SectionHeader
        as="h1"
        title="Topluluklar"
        description="Kök alanlar platform moderatörlerince açılır. Niş ve yerel topluluklar kullanıcı önerisi ve moderatör onayıyla kurulur."
        action={
          <Link
            href="/communities/apply"
            className="btn-gradient inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm"
          >
            <Icon name="plus" size={16} strokeWidth={2.4} />
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
              {entry.name}
            </FilterChip>
          ))}
        </ChipRow>
      </div>

      {visibleRoots.length > 0 ? (
        <section aria-labelledby="roots-heading" className="mt-5">
          <SectionHeader
            title={<span id="roots-heading">Kök topluluklar</span>}
            description="Kalıcı ana alanlar. Her dal topluluk bunlardan birine bağlıdır."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibleRoots.map((community) => (
              <li key={community.id}>
                <CommunityCard
                  slug={community.slug}
                  name={community.name}
                  emoji={community.emoji}
                  description={community.description}
                  memberCount={community.memberCount}
                  kind="root"
                  place={null}
                  members={memberPreview(community.id)}
                  isMember={memberIds.includes(community.id)}
                  communityId={community.id}
                  revalidate="/communities"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="branches-heading" className="mt-5">
        <SectionHeader
          title={<span id="branches-heading">Dal topluluklar ({visibleBranches.length})</span>}
          description="Moderatör onayıyla açılmış yerel ve niş topluluklar."
        />

        {visibleBranches.length === 0 ? (
          <EmptyState
            icon="users"
            title={mine ? 'Henüz bir topluluğa üye değilsin' : 'Bu filtrede topluluk yok'}
            description={
              mine
                ? 'Keşfet sekmesinden ilgi alanına uygun toplulukları görebilirsin.'
                : 'Aradığın topluluk yoksa kendin önerebilirsin; moderatör onayından sonra açılır.'
            }
            action={
              <Link
                href={mine ? href({ tab: '' }) : '/communities/apply'}
                className="text-sm font-semibold text-accent underline"
              >
                {mine ? 'Toplulukları keşfet' : 'Topluluk öner'}
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibleBranches.map((community) => (
              <li key={community.id}>
                <CommunityCard
                  slug={community.slug}
                  name={community.name}
                  emoji={community.emoji}
                  description={community.description}
                  memberCount={community.memberCount}
                  kind="branch"
                  place={locationLabel(community.provinceCode, community.districtCode)}
                  members={memberPreview(community.id)}
                  isMember={memberIds.includes(community.id)}
                  communityId={community.id}
                  revalidate="/communities"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5">
        <InfoNote icon="shield">
          Topluluk açma başvuruları moderatör incelemesinden geçer. Bu, benzer toplulukların çoğalmasını ve
          kurallara aykırı alanların açılmasını önler.
        </InfoNote>
      </div>
    </div>
  );
}
