import type { Metadata } from 'next';
import Link from 'next/link';

import { ResourceCard } from '@/components/discovery/ResourceCard';
import { ChipRow, EmptyState, FilterChip, SectionHeader } from '@/components/ui';
import { getStore } from '@/lib/data/store';
import type { Resource } from '@/types/domain';

export const metadata: Metadata = { title: 'Nasıl · Keşfet' };

const LEVELS: Array<{ value: Resource['level'] | 'all'; label: string }> = [
  { value: 'all', label: 'Tüm seviyeler' },
  { value: 'baslangic', label: 'Başlangıç' },
  { value: 'orta', label: 'Orta' },
  { value: 'ileri', label: 'İleri' },
];

const TYPES: Array<{ value: Resource['type'] | 'all'; label: string }> = [
  { value: 'all', label: 'Tüm türler' },
  { value: 'rehber', label: 'Rehber' },
  { value: 'kontrol_listesi', label: 'Kontrol listesi' },
  { value: 'soru_cevap', label: 'Soru-cevap' },
  { value: 'video', label: 'Video' },
  { value: 'baglanti', label: 'Bağlantı' },
];

/**
 * "Nasil" kaynaklari (PROJECT_SPEC 7.7 / 17.10).
 * Kurs platformu degil: her kayit kisa, sosyal baglami olan bir karttir.
 */
export default async function HowPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; type?: string; topic?: string; q?: string; resource?: string }>;
}) {
  const params = await searchParams;
  const store = getStore();

  const topics = store.getTopics();
  const topic = params.topic ? store.getTopicBySlug(params.topic) : null;
  const level = (LEVELS.find((entry) => entry.value === params.level)?.value ?? 'all') as
    | Resource['level']
    | 'all';
  const type = (TYPES.find((entry) => entry.value === params.type)?.value ?? 'all') as Resource['type'] | 'all';

  const resources = store.listResources({
    level,
    type,
    topicId: topic?.id ?? null,
    query: params.q,
  });

  const href = (patch: { level?: string; type?: string; topic?: string | null }) => {
    const search = new URLSearchParams();
    const nextLevel = patch.level ?? level;
    const nextType = patch.type ?? type;
    const nextTopic = patch.topic === undefined ? params.topic : patch.topic;
    if (nextLevel !== 'all') search.set('level', nextLevel);
    if (nextType !== 'all') search.set('type', nextType);
    if (nextTopic) search.set('topic', nextTopic);
    if (params.q) search.set('q', params.q);
    const value = search.toString();
    return value ? `/explore/how?${value}` : '/explore/how';
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Nasıl"
        description="Toplulukların kendi deneyimlerinden ürettiği kısa rehberler, kontrol listeleri ve derlemeler."
      />

      <form action="/explore/how" method="get" role="search" className="flex gap-2">
        {level !== 'all' ? <input type="hidden" name="level" value={level} /> : null}
        {type !== 'all' ? <input type="hidden" name="type" value={type} /> : null}
        {params.topic ? <input type="hidden" name="topic" value={params.topic} /> : null}
        <label htmlFor="how-q" className="sr-only">
          Kaynak ara
        </label>
        <input
          id="how-q"
          name="q"
          type="search"
          defaultValue={params.q ?? ''}
          placeholder="Ara: lehim, erişilebilirlik, makale okuma…"
          className="min-h-11 flex-1 rounded-xl border border-line bg-bg-raised px-3"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
        >
          Ara
        </button>
      </form>

      <div className="space-y-2">
        <ChipRow label="Seviye">
          {LEVELS.map((entry) => (
            <FilterChip key={entry.value} href={href({ level: entry.value })} active={level === entry.value}>
              {entry.label}
            </FilterChip>
          ))}
        </ChipRow>

        <ChipRow label="Kaynak türü">
          {TYPES.map((entry) => (
            <FilterChip key={entry.value} href={href({ type: entry.value })} active={type === entry.value}>
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

      {resources.length === 0 ? (
        <EmptyState
          icon="route"
          title="Bu filtrede kaynak yok"
          description="Seviye veya tür filtresini gevşetebilirsin. Kaynaklar topluluk sayfalarındaki Kaynaklar sekmesinden de eklenir."
          action={
            <Link href="/explore/how" className="text-sm font-semibold text-accent underline">
              Filtreleri temizle
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {resources.map((entry) => (
            <li key={entry.resource.id} id={entry.resource.id}>
              <ResourceCard view={entry} highlighted={params.resource === entry.resource.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
