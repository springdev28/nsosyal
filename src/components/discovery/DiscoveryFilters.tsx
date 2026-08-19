import Link from 'next/link';

import { ChipRow, FilterChip, Icon } from '@/components/ui';
import { DISTRICTS, PROVINCES } from '@/lib/geo';
import { PRESET_LABELS, type TimePreset } from '@/lib/time';
import type { Topic } from '@/types/domain';

/**
 * Ortak kesif filtreleri (PROJECT_SPEC 7.4 / 12.4).
 *
 * Filtreler tamamen baglanti tabanlidir: JavaScript olmadan da calisir, geri
 * tusu beklendigi gibi davranir ve her durum paylasilabilir bir URL'e sahiptir.
 */

export interface FilterState {
  province: string | null;
  district: string | null;
  topic: string | null;
  time: TimePreset;
  mode: 'all' | 'physical' | 'online' | 'hybrid';
  query: string;
}

const TIME_PRESETS: Array<Exclude<TimePreset, 'custom'>> = [
  'all',
  'today',
  'this-week',
  'next-7',
  'next-30',
  'past-30',
];

const MODES: Array<{ value: FilterState['mode']; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'physical', label: 'Fiziksel' },
  { value: 'online', label: 'Çevrim içi' },
  { value: 'hybrid', label: 'Hibrit' },
];

export function buildFilterHref(base: string, state: FilterState, patch: Partial<FilterState>): string {
  const next = { ...state, ...patch };
  const params = new URLSearchParams();
  if (next.province) params.set('province', next.province);
  if (next.district) params.set('district', next.district);
  if (next.topic) params.set('topic', next.topic);
  if (next.time && next.time !== 'all') params.set('time', next.time);
  if (next.mode && next.mode !== 'all') params.set('mode', next.mode);
  if (next.query) params.set('q', next.query);
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export function DiscoveryFilterBar({
  base,
  state,
  topics,
  showLocation = true,
  showMode = true,
}: {
  base: string;
  state: FilterState;
  topics: Topic[];
  showLocation?: boolean;
  showMode?: boolean;
}) {
  const province = PROVINCES.find((entry) => entry.code === state.province);
  const district = DISTRICTS.find((entry) => entry.code === state.district);
  const topic = topics.find((entry) => entry.slug === state.topic);

  const activeCount = [state.province, state.topic, state.time !== 'all' ? state.time : null, state.mode !== 'all' ? state.mode : null, state.query]
    .filter(Boolean).length;

  return (
    <div className="space-y-3">
      <form action={base} method="get" role="search" className="flex gap-2">
        {/* Arama disindaki filtreler form gonderiminde kaybolmasin. */}
        {state.province ? <input type="hidden" name="province" value={state.province} /> : null}
        {state.district ? <input type="hidden" name="district" value={state.district} /> : null}
        {state.topic ? <input type="hidden" name="topic" value={state.topic} /> : null}
        {state.time !== 'all' ? <input type="hidden" name="time" value={state.time} /> : null}
        {state.mode !== 'all' ? <input type="hidden" name="mode" value={state.mode} /> : null}

        <label htmlFor="discovery-q" className="sr-only">
          Konu, topluluk, etkinlik veya proje ara
        </label>
        <input
          id="discovery-q"
          name="q"
          type="search"
          defaultValue={state.query}
          placeholder="Ara: havacılık, erişilebilirlik, roket…"
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
        <FilterGroup label="Ne · konu">
          <FilterChip href={buildFilterHref(base, state, { topic: null })} active={!state.topic}>
            Tüm konular
          </FilterChip>
          {topics.map((entry) => (
            <FilterChip
              key={entry.id}
              href={buildFilterHref(base, state, { topic: entry.slug })}
              active={state.topic === entry.slug}
            >
              {entry.name}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Ne zaman">
          {TIME_PRESETS.map((preset) => (
            <FilterChip
              key={preset}
              href={buildFilterHref(base, state, { time: preset })}
              active={state.time === preset}
            >
              {PRESET_LABELS[preset]}
            </FilterChip>
          ))}
        </FilterGroup>

        {showMode ? (
          <FilterGroup label="Katılım biçimi">
            {MODES.map((entry) => (
              <FilterChip
                key={entry.value}
                href={buildFilterHref(base, state, { mode: entry.value })}
                active={state.mode === entry.value}
              >
                {entry.label}
              </FilterChip>
            ))}
          </FilterGroup>
        ) : null}
      </div>

      {(showLocation && (province || topic)) || activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-fg-subtle">Etkin filtreler:</span>
          {province ? (
            <ActiveFilter
              label={`Nerede: ${province.name}${district ? ` / ${district.name}` : ''}`}
              href={buildFilterHref(base, state, { province: null, district: null })}
            />
          ) : null}
          {topic ? (
            <ActiveFilter label={`Ne: ${topic.name}`} href={buildFilterHref(base, state, { topic: null })} />
          ) : null}
          {state.time !== 'all' && state.time !== 'custom' ? (
            <ActiveFilter
              label={`Ne zaman: ${PRESET_LABELS[state.time]}`}
              href={buildFilterHref(base, state, { time: 'all' })}
            />
          ) : null}
          {state.mode !== 'all' ? (
            <ActiveFilter
              label={`Biçim: ${MODES.find((m) => m.value === state.mode)?.label}`}
              href={buildFilterHref(base, state, { mode: 'all' })}
            />
          ) : null}
          {state.query ? (
            <ActiveFilter label={`Arama: ${state.query}`} href={buildFilterHref(base, state, { query: '' })} />
          ) : null}
          <Link href={base} className="text-fg-muted underline">
            Hepsini temizle
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</p>
      <ChipRow label={label}>{children}</ChipRow>
    </div>
  );
}

function ActiveFilter({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-sunken px-2 py-0.5 hover:border-line-strong"
    >
      {label}
      <Icon name="close" size={12} />
      <span className="sr-only">filtresini kaldır</span>
    </Link>
  );
}

/** URL parametrelerinden filtre durumunu cozer. */
export function parseFilters(params: Record<string, string | string[] | undefined>): FilterState {
  const single = (key: string) => {
    const value = params[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  };

  const time = (single('time') ?? 'all') as TimePreset;
  const mode = (single('mode') ?? 'all') as FilterState['mode'];

  return {
    province: single('province'),
    district: single('district'),
    topic: single('topic'),
    time: ['today', 'this-week', 'this-month', 'next-7', 'next-30', 'past-30', 'all'].includes(time)
      ? time
      : 'all',
    mode: ['all', 'physical', 'online', 'hybrid'].includes(mode) ? mode : 'all',
    query: single('q') ?? '',
  };
}
