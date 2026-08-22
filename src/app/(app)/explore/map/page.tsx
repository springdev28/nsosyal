/**
 * Nerede sorgusunu URL filtrelerinden kurar, yogunluk verisini Store'dan alir ve
 * ayni sonucu hem harita hem erisilebilir liste icin hazirlar.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import { DiscoveryFilterBar, buildFilterHref, parseFilters } from '@/components/discovery/DiscoveryFilters';
import { EventCard } from '@/components/discovery/EventCard';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, Badge, Card, EmptyState, InfoNote, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import {
  DISTRICT_DATA_PROVINCES,
  districtByCode,
  districtsOfProvince,
  hasDistrictData,
  provinceByCode,
} from '@/lib/geo';
import { resolvePreset } from '@/lib/time';

import { MapExplorer } from './MapExplorer';

export const metadata: Metadata = { title: 'Nerede · Keşfet' };

/**
 * "Nerede" kesif ekrani (PROJECT_SPEC 7.4 / 17.6).
 *
 * Erisilebilirlik: harita gorsel bir yardimcidir. Ayni sonuclar hem il listesi
 * hem de sonuc panelinde metin olarak sunulur, boylece klavye ve ekran okuyucu
 * kullanicilari hicbir sey kacirmaz (8.3).
 *
 * Mahremiyet: bireysel kullanicilar kesin koordinatla gosterilmez; yalnizca
 * konum gorunurlugune izin veren profiller listelenir (11.1).
 */
export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const viewer = await getViewer();
  const store = getStore();

  const topics = store.getTopics();
  const topic = filters.topic ? store.getTopicBySlug(filters.topic) : null;
  const range = resolvePreset(filters.time, new Date());

  const storeFilters = {
    provinceCode: filters.province,
    districtCode: filters.district,
    topicId: topic?.id ?? null,
    range,
    mode: filters.mode,
    query: filters.query,
    viewerId: viewer?.id ?? null,
  };

  // Harita dolgusu icin: konum filtresi disindaki filtreler her il icin uygulanir.
  const summaries = store.getProvinceSummaries({
    topicId: topic?.id ?? null,
    range,
    mode: filters.mode,
    query: filters.query,
  });
  const districtSummaries = filters.province
    ? store.getDistrictSummaries(filters.province, {
        topicId: topic?.id ?? null,
        range,
        mode: filters.mode,
        query: filters.query,
      })
    : [];

  const results = filters.province ? store.discover(storeFilters) : null;
  const province = provinceByCode(filters.province);
  const district = districtByCode(filters.district);
  const districts = filters.province ? districtsOfProvince(filters.province) : [];

  const withResults = summaries.filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);
  const currentPath = '/explore/map';

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Nerede"
        description="Bir il seç; o bölgeye bağlı topluluk, kurum, etkinlik, proje ve paylaşımları gör."
      />

      <DiscoveryFilterBar base={currentPath} state={filters} topics={topics} />

      <MapExplorer
        metrics={summaries}
        districtMetrics={districtSummaries}
        selectedProvince={filters.province}
        selectedDistrict={filters.district}
        districtDataProvinces={DISTRICT_DATA_PROVINCES}
      />

      {/* Haritanin erisilebilir esdegeri: ayni veriyi gosteren il listesi. */}
      <section aria-labelledby="province-list-heading">
        <h2 id="province-list-heading" className="mb-2 text-sm font-semibold text-fg-muted">
          İl listesi{' '}
          <span className="font-normal text-fg-subtle">
            (haritanın klavyeyle kullanılabilen eşdeğeri · {withResults.length} ilde sonuç var)
          </span>
        </h2>

        {withResults.length === 0 ? (
          <EmptyState
            icon="mapPin"
            title="Bu filtrelerde hiçbir ilde sonuç yok"
            description="Tarih aralığını genişletebilir veya çevrim içi sonuçları dahil edebilirsin."
            action={
              <Link
                href={buildFilterHref(currentPath, filters, { time: 'all', mode: 'all' })}
                className="text-sm font-semibold text-accent underline"
              >
                Zaman ve biçim filtrelerini temizle
              </Link>
            }
          />
        ) : (
          <ul className="filter-strip gap-2 pb-1">
            {withResults.slice(0, 24).map((entry) => (
              <li key={entry.code}>
                <Link
                  href={buildFilterHref(currentPath, filters, { province: entry.code, district: null })}
                  aria-current={entry.code === filters.province ? 'true' : undefined}
                  className={`flex min-h-11 min-w-[7.5rem] flex-col justify-center rounded-xl border px-3 py-1.5 ${
                    entry.code === filters.province
                      ? 'border-accent bg-accent-soft font-semibold text-accent'
                      : 'border-line bg-bg-raised hover:border-line-strong'
                  }`}
                >
                  <span className="text-sm">{entry.name}</span>
                  <span className="text-xs text-fg-subtle">{entry.total} sonuç</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {province ? (
        <>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">
                {province.name}
                {district ? <span className="text-fg-muted"> / {district.name}</span> : null}
              </h2>
              <Link
                href={buildFilterHref(currentPath, filters, { province: null, district: null })}
                className="text-sm text-fg-muted underline"
              >
                Seçimi temizle
              </Link>
            </div>

            {hasDistrictData(province.code) ? (
              <div className="mt-3">
                <p id="district-list-label" className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  İlçeler
                </p>
                <ul aria-labelledby="district-list-label" className="filter-strip flex gap-1.5 pb-1">
                  <li>
                    <Link
                      href={buildFilterHref(currentPath, filters, { district: null })}
                      aria-current={!filters.district ? 'true' : undefined}
                      className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm ${
                        !filters.district
                          ? 'border-accent bg-accent text-accent-fg font-semibold'
                          : 'border-line text-fg-muted hover:border-line-strong'
                      }`}
                    >
                      Tüm il
                    </Link>
                  </li>
                  {districts.map((entry) => {
                    const metric = districtSummaries.find((summary) => summary.code === entry.code);
                    return (
                    <li key={entry.code}>
                      <Link
                        href={buildFilterHref(currentPath, filters, { district: entry.code })}
                        aria-current={filters.district === entry.code ? 'true' : undefined}
                        className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm ${
                          filters.district === entry.code
                            ? 'border-accent bg-accent text-accent-fg font-semibold'
                            : 'border-line text-fg-muted hover:border-line-strong'
                        }`}
                      >
                        {entry.name}
                        <span className="ml-1 text-xs opacity-70">{metric?.total ?? 0}</span>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-fg-subtle">
                Bu il için ilçe sınırı henüz yüklü değil. İl düzeyinde keşfe devam edebilirsin.
              </p>
            )}
          </Card>

          {results ? <ResultPanel results={results} revalidate={currentPath} /> : null}
        </>
      ) : (
        <InfoNote icon="mapPin">
          Haritadan bir il seç ya da yukarıdaki listeden ilerle. Konum paylaşmıyor olman keşfi engellemez;
          yalnızca kendin yerel kişi sonuçlarında görünmezsin.
        </InfoNote>
      )}

      <p className="text-xs text-fg-subtle">
        Sınır verisi: OpenStreetMap katkıda bulunanlar (ODbL). Görsel keşif amaçlıdır, resmî idari sınır verisi
        değildir. <Link href="/about#veri" className="underline">Kaynaklar</Link>
      </p>
    </div>
  );
}

function ResultPanel({
  results,
  revalidate,
}: {
  results: NonNullable<Awaited<ReturnType<ReturnType<typeof getStore>['discover']>>>;
  revalidate: string;
}) {
  const total =
    results.communities.length +
    results.events.length +
    results.projects.length +
    results.posts.length +
    results.organizations.length +
    results.profiles.length;

  if (total === 0) {
    return (
      <EmptyState
        icon="search"
        title="Bu filtrelerde sonuç bulunamadı"
        description="Tarihi genişletebilir, konuyu kaldırabilir veya çevrim içi sonuçları dahil edebilirsin."
      />
    );
  }

  return (
    <div className="space-y-5">
      {results.events.length > 0 ? (
        <section aria-labelledby="res-events">
          <SectionHeader title={<span id="res-events">Etkinlikler ({results.events.length})</span>} />
          <ul className="space-y-3">
            {results.events.map((view) => (
              <li key={view.event.id}>
                <EventCard view={view} revalidate={revalidate} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.communities.length > 0 ? (
        <section aria-labelledby="res-communities">
          <SectionHeader title={<span id="res-communities">Topluluklar ({results.communities.length})</span>} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.communities.map((view) => (
              <li key={view.community.id}>
                <Card className="h-full p-4">
                  <Link href={`/communities/${view.community.slug}`} className="font-semibold hover:underline">
                    {view.community.name}
                  </Link>
                  <p className="mt-1 text-sm text-fg-muted">{view.community.description}</p>
                  <p className="mt-2 text-xs text-fg-subtle">
                    {view.community.memberCount.toLocaleString('tr-TR')} üye
                    {view.provinceName ? ` · ${view.provinceName}` : ''}
                    {view.districtName ? ` / ${view.districtName}` : ''}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.organizations.length > 0 || results.profiles.length > 0 ? (
        <section aria-labelledby="res-people">
          <SectionHeader
            title={
              <span id="res-people">
                Kurumlar ve kişiler ({results.organizations.length + results.profiles.length})
              </span>
            }
            description="Yalnızca konumunu paylaşmayı seçen profiller listelenir. Kesin adres veya canlı konum gösterilmez."
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...results.organizations, ...results.profiles].map((profile) => (
              <li key={profile.id}>
                <Link
                  href={`/profile/${profile.username}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-bg-raised p-3 hover:border-accent"
                >
                  <Avatar profile={profile} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{profile.displayName}</span>
                    <span className="block truncate text-sm text-fg-subtle">@{profile.username}</span>
                  </span>
                  {profile.kind === 'organization' ? <Badge tone="accent">Kurum</Badge> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.projects.length > 0 ? (
        <section aria-labelledby="res-projects">
          <SectionHeader title={<span id="res-projects">Projeler ({results.projects.length})</span>} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.projects.map((project) => (
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
        </section>
      ) : null}

      {results.posts.length > 0 ? (
        <section aria-labelledby="res-posts">
          <SectionHeader title={<span id="res-posts">Paylaşımlar ({results.posts.length})</span>} />
          <ul className="space-y-3">
            {results.posts.slice(0, 8).map((view) => (
              <li key={view.post.id}>
                <PostCard view={view} revalidate={revalidate} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
