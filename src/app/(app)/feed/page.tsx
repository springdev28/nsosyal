/**
 * Ana akis ViewModel'lerini kalici tercihler ve gecici niyetle sunucuda siralar.
 * Composer ve PostCard'lar hazir veriyi render eder; sponsorluk bu yola girmez.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import { Composer } from '@/components/feed/Composer';
import { PostCard } from '@/components/feed/PostCard';
import { StoryRail } from '@/components/feed/StoryRail';
import { ChipRow, EmptyState, FilterChip, Icon, TopTabs } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';
import { intentLabel } from '@/lib/ranking/rank';
import type { IntentMode } from '@/types/domain';

export const metadata: Metadata = { title: 'Ana Sayfa' };

const INTENT_MODES: IntentMode[] = ['sosyallesme', 'kesfet', 'ogren', 'uret'];

/**
 * Ana akis (PROJECT_SPEC 7.1 / 17.5).
 *
 * Kritik urun kurali: bu akista ciddi proje icerigi ile gundelik sohbet, mizah,
 * soru ve kisa video birlikte yasar. Sponsorlu icerik BURAYA GIRMEZ.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ mod?: string; filtre?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (!viewer) return null;

  const store = getStore();
  // Mod secmek zorunlu degil (spec 7.10). URL'de gecerli bir mod varsa o,
  // yoksa profilin varsayilani; o da yoksa mod YOK ve akis kalici platform
  // amaclarindan turer.
  const intentMode: IntentMode | null = INTENT_MODES.includes(params.mod as IntentMode)
    ? (params.mod as IntentMode)
    : params.mod === 'yok'
      ? null
      : viewer.intentMode;
  const newVoicesOnly = params.filtre === 'yeni-sesler';

  const posts = store.getFeed({ viewerId: viewer.id, intentMode, newVoicesOnly, limit: 40 });
  const stories = posts.filter((view) => view.media.length > 0).slice(0, 12);

  const memberCommunities = store
    .getMemberCommunityIds(viewer.id)
    .map((id) => store.getCommunity(id))
    .filter((community): community is NonNullable<typeof community> => Boolean(community))
    .map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      emoji: community.emoji,
      kind: community.kind,
    }));

  const buildHref = (mod: IntentMode | null, filtre?: string) => {
    const search = new URLSearchParams({ mod: mod ?? 'yok' });
    if (filtre) search.set('filtre', filtre);
    return `/feed?${search.toString()}`;
  };

  return (
    <div>
      <TopTabs
        tabs={[
          { href: buildHref(intentMode), label: 'Akış', active: true },
          { href: '/video', label: 'Medya', active: false },
        ]}
      />

      <h1 className="sr-only">Ana akış</h1>

      <StoryRail stories={stories} />

      <section aria-labelledby="intent-heading" className="mb-3 px-1 sm:px-3">
        <h2 id="intent-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
          Bugün buraya ne için geldin?
        </h2>
        <ChipRow label="Akış niyet modu">
          {/* Mod secmemek de gecerli bir secim: amaclarina gore kisisellestirilmis akis. */}
          <FilterChip
            href={buildHref(null, newVoicesOnly ? 'yeni-sesler' : undefined)}
            active={intentMode === null}
          >
            Amaçlarıma göre
          </FilterChip>
          {INTENT_MODES.map((mode) => (
            <FilterChip
              key={mode}
              href={buildHref(mode, newVoicesOnly ? 'yeni-sesler' : undefined)}
              active={mode === intentMode}
            >
              {intentLabel(mode)}
            </FilterChip>
          ))}
          <FilterChip
            href={newVoicesOnly ? buildHref(intentMode) : buildHref(intentMode, 'yeni-sesler')}
            active={newVoicesOnly}
          >
            <Icon name="seedling" size={14} /> Yeni sesler
          </FilterChip>
        </ChipRow>
      </section>

      <Composer
        viewer={{
          id: viewer.id,
          username: viewer.username,
          displayName: viewer.displayName,
          avatarEmoji: viewer.avatarEmoji,
          avatarTone: viewer.avatarTone,
          kind: viewer.kind,
          verified: viewer.verified,
          demo: true,
          role: viewer.role,
        }}
        topics={store.getTopics()}
        communities={memberCommunities}
        hasLocation={Boolean(viewer.provinceCode)}
        locationLabel={locationLabel(viewer.provinceCode, viewer.districtCode)}
      />

      {posts.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="seedling"
            title="Bu filtrede gösterilecek gönderi yok"
            description="Filtreyi kaldırabilir veya başka bir niyet modu deneyebilirsin."
            action={
              <Link href="/feed" className="text-sm font-semibold text-accent underline">
                Tüm akışa dön
              </Link>
            }
          />
        </div>
      ) : (
        <ol>
          {posts.map((view) => (
            <li key={view.post.id}>
              <PostCard view={view} revalidate="/feed" />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
