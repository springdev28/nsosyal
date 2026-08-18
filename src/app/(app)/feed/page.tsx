import type { Metadata } from 'next';
import Link from 'next/link';

import { Composer } from '@/components/feed/Composer';
import { PostCard } from '@/components/feed/PostCard';
import { Card, ChipRow, EmptyState, FilterChip, InfoNote, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';
import { intentLabel } from '@/lib/ranking/rank';
import type { IntentMode } from '@/types/domain';

export const metadata: Metadata = { title: 'Ana Akış' };

const INTENT_MODES: IntentMode[] = ['sosyallesme', 'kesfet', 'ogren', 'uret'];

const INTENT_HINT: Record<IntentMode, string> = {
  sosyallesme: 'Takip ettiklerin, topluluk sohbetleri ve gündelik paylaşımlar öne çıkıyor.',
  kesfet: 'Yeni hesaplar, kısa videolar ve yerel içerik çeşitliliği artırıldı.',
  ogren: 'Kaynaklar, açıklayıcı içerikler ve sorular öne çıkıyor.',
  uret: 'Projeler, ilerleme günlükleri ve etkinlikler öne çıkıyor.',
};

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
  const intentMode = (INTENT_MODES.includes(params.mod as IntentMode) ? params.mod : viewer.intentMode) as IntentMode;
  const newVoicesOnly = params.filtre === 'yeni-sesler';

  const posts = store.getFeed({
    viewerId: viewer.id,
    intentMode,
    newVoicesOnly,
    limit: 40,
  });

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

  const buildHref = (mod: IntentMode, filtre?: string) => {
    const search = new URLSearchParams({ mod });
    if (filtre) search.set('filtre', filtre);
    return `/feed?${search.toString()}`;
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Ana Akış"
        description="Gündelik sohbet, mizah, sorular ve üretim aynı akışta."
        action={
          <Link
            href="/video"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
          >
            <span aria-hidden="true">🎬</span> Kısa videolar
          </Link>
        }
      />

      <section aria-labelledby="intent-heading" className="space-y-2">
        <h2 id="intent-heading" className="text-sm font-semibold text-fg-muted">
          Bugün buraya ne için geldin?
        </h2>
        <ChipRow label="Akış niyet modu">
          {INTENT_MODES.map((mode) => (
            <FilterChip key={mode} href={buildHref(mode, newVoicesOnly ? 'yeni-sesler' : undefined)} active={mode === intentMode}>
              {intentLabel(mode)}
            </FilterChip>
          ))}
          <FilterChip
            href={newVoicesOnly ? buildHref(intentMode) : buildHref(intentMode, 'yeni-sesler')}
            active={newVoicesOnly}
          >
            🌱 Yeni sesler
          </FilterChip>
        </ChipRow>
        <p className="text-sm text-fg-subtle">{INTENT_HINT[intentMode]}</p>
      </section>

      <Composer
        topics={store.getTopics()}
        communities={memberCommunities}
        hasLocation={Boolean(viewer.provinceCode)}
        locationLabel={locationLabel(viewer.provinceCode, viewer.districtCode)}
      />

      {newVoicesOnly ? (
        <InfoNote icon="🌱">
          Yeni sesler filtresi, takipçi sayısı düşük hesapların içeriklerini gösterir. Bu bir kalite garantisi
          değildir; içerik yine konu ve topluluk uygunluğunu karşılamalıdır.
        </InfoNote>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          icon="🌾"
          title="Bu filtrede gösterilecek gönderi yok"
          description="Filtreyi kaldırabilir veya başka bir niyet modu deneyebilirsin."
          action={
            <Link href="/feed" className="text-sm font-semibold text-accent underline">
              Tüm akışa dön
            </Link>
          }
        />
      ) : (
        <ol className="space-y-3">
          {posts.map((view) => (
            <li key={view.post.id}>
              <PostCard view={view} revalidate="/feed" />
            </li>
          ))}
        </ol>
      )}

      <Card className="p-4">
        <p className="text-sm text-fg-muted">
          <strong className="font-semibold text-fg">Sıralama nasıl çalışıyor?</strong> Akış; konu uyumu, takip
          ettiklerin, topluluk üyeliğin, niyet modun, tazelik, isteğe bağlı konumun ve yeni sesler bonusundan
          oluşan açıklanabilir bir skorla sıralanır. Ücretli hiçbir alan bu sıralamaya giremez.{' '}
          <Link href="/about#siralama" className="font-semibold text-accent underline">
            Ayrıntılar
          </Link>
        </p>
      </Card>
    </div>
  );
}
