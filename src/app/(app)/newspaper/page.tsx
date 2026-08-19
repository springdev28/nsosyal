import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, EmptyState, SectionHeader } from '@/components/ui';
import { CoverTile } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { placementByCode } from '@/lib/newspaper/inventory';
import { formatDate } from '@/lib/time';
import type { NewspaperSection } from '@/types/domain';
import type { NewspaperItemView } from '@/types/view';

export const metadata: Metadata = { title: 'nGazete' };

const SECTION_LABEL: Record<NewspaperSection, string> = {
  gundem: 'Gündem',
  yerel: 'Yerel',
  proje: 'Projeler',
  topluluk: 'Topluluklar',
  etkinlik: 'Etkinlik',
  kaynak: 'Kaynaklar',
};

/**
 * nGazete (PROJECT_SPEC 7.9 / 17.12 / 17.18-8).
 *
 * Spec'in acik kurali: burasi bir kart katalogu DEGILDIR. Okuyucu gercek bir
 * dijital gazete hissi almalidir; bu yuzden sayfa masthead, sayi ve tarih,
 * manset hiyerarsisi, hero gorsel, bolum etiketleri ve kolon/grid kompozisyonu
 * kullanir.
 *
 * Ucretli alanlar da ayni grid'in icinde yasar. Onceki surumde sponsorlu
 * kartlar sayfanin altinda ayri bir "Ucretli alanlar" listesine yigiliyordu;
 * spec bunu ismen yasakliyor. Simdi her sponsorlu kart satin aldigi envanter
 * alaninin span'i kadar yer kaplar ve bulundugu yerde "Sponsorlu" etiketi
 * tasir. Etiket, sadelestirme kuralinin istisnasidir (spec 8.1.2): kullanici
 * kararini etkiledigi icin her zaman gorunur kalir.
 *
 * Gelir modelinin nasil calistigi burada ANLATILMAZ; o metin /about ve
 * reklamveren ekraninda yasar (spec 7.9).
 */
export default async function NewspaperPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const issues = store.listIssues();
  const current = date ? store.getIssueByDate(date) : store.getLatestIssue();

  if (!current) {
    return (
      <EmptyState
        icon="newspaper"
        title="Yayımlanmış sayı yok"
        description="Gazete her sabah yayımlanır."
      />
    );
  }

  // Sayi numarasi: en eski sayidan bugune artan sira.
  const issueNumber = issues.length - issues.findIndex((entry) => entry.issue.id === current.issue.id);

  // Kompozisyon sirasi: once oncelik, esitlikte yayin sirasi. Sponsorlu kartlar
  // ayri bir listeye alinmaz; ayni siralamaya girer.
  const composed = [...current.items].sort(
    (a, b) => a.item.priority - b.item.priority || a.item.publicationOrder - b.item.publicationOrder,
  );

  const canAdvertise = viewer?.kind === 'organization' || viewer?.role === 'admin';

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="nGazete"
        action={
          canAdvertise ? (
            <Link
              href="/newspaper/advertise"
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              İlan ver
            </Link>
          ) : null
        }
      />

      <nav aria-label="Gazete sayıları">
        <ul className="scroll-x hide-scrollbar flex gap-2 pb-1">
          {issues.map((entry) => {
            const active = entry.issue.id === current.issue.id;
            return (
              <li key={entry.issue.id}>
                <Link
                  href={`/newspaper?date=${entry.issue.issueDate}`}
                  aria-current={active ? 'true' : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm ${
                    active
                      ? 'border-accent bg-accent-soft font-semibold text-accent'
                      : 'border-line bg-bg-raised text-fg-muted hover:border-line-strong'
                  }`}
                >
                  {formatDate(`${entry.issue.issueDate}T09:00:00Z`)}
                  {entry.issue.theme ? ` · ${entry.issue.theme}` : ''}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Card className="overflow-hidden">
        {/* Masthead */}
        <header className="border-b-4 border-double border-line-strong bg-bg-sunken px-4 py-5 text-center sm:px-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-fg-subtle">
            nSosyal 5N1K
          </p>
          <p className="font-serif text-4xl font-black tracking-tight sm:text-5xl">nGazete</p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-y border-line py-1.5 text-xs text-fg-muted">
            <span>Sayı {issueNumber}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={current.issue.issueDate}>
              {formatDate(`${current.issue.issueDate}T09:00:00Z`)}
            </time>
            {current.issue.theme ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{current.issue.theme} özel sayısı</span>
              </>
            ) : null}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight">{current.issue.title}</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-fg-muted">{current.issue.standfirst}</p>
        </header>

        {/* Editoryal grid. Sponsorlu alanlar bu grid'in icinde yer alir. */}
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {composed.map((entry) => (
            <NewspaperCell key={entry.item.id} entry={entry} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Grid hucresi: span'i kartin kendi layout/envanter kaydindan gelir. */
function NewspaperCell({ entry }: { entry: NewspaperItemView }) {
  const { item } = entry;
  const colSpan = Math.min(4, Math.max(1, item.gridColumnSpan));

  // Tailwind sinif adlarini calisma aninda birlestirmiyoruz; JIT tarayamaz.
  const spanClass =
    colSpan >= 4
      ? 'sm:col-span-2 lg:col-span-4'
      : colSpan === 3
        ? 'sm:col-span-2 lg:col-span-3'
        : colSpan === 2
          ? 'sm:col-span-2 lg:col-span-2'
          : '';
  const rowClass = item.gridRowSpan >= 2 ? 'lg:row-span-2' : '';

  return (
    <div className={`bg-bg-raised ${spanClass} ${rowClass}`}>
      {item.sponsored ? <SponsoredCell entry={entry} /> : <EditorialCell entry={entry} />}
    </div>
  );
}

function EditorialCell({ entry }: { entry: NewspaperItemView }) {
  const { item } = entry;
  const isLead = item.layoutVariant === 'lead';
  const isFeature = item.layoutVariant === 'feature';
  const isBrief = item.layoutVariant === 'brief';

  const headingClass = isLead
    ? 'font-serif text-2xl font-bold leading-tight sm:text-3xl'
    : isFeature
      ? 'font-serif text-xl font-bold leading-snug'
      : isBrief
        ? 'font-serif text-base font-bold leading-snug'
        : 'font-serif text-lg font-bold leading-snug';

  const body = (
    <>
      {item.imageSeed && item.imageGlyph ? (
        <CoverTile
          seed={item.imageSeed}
          glyph={item.imageGlyph}
          height={isLead ? 180 : 120}
          rounded="none"
          className="mb-3"
        />
      ) : null}

      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
        {SECTION_LABEL[item.section]}
      </p>

      <h3 className={`mt-1 ${headingClass}`}>{item.title}</h3>

      {item.standfirst ? (
        <p className="mt-1.5 font-serif text-base italic leading-snug text-fg-muted">
          {item.standfirst}
        </p>
      ) : null}

      {!isBrief ? <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</p> : null}

      {item.sourceOrAuthor ? (
        <p className="mt-2 text-xs text-fg-subtle">{item.sourceOrAuthor}</p>
      ) : null}
    </>
  );

  const padding = isLead ? 'p-4 sm:p-6' : 'p-4';

  if (entry.href) {
    return (
      <Link href={entry.href} className={`block h-full ${padding} transition-colors hover:bg-bg-hover`}>
        {body}
      </Link>
    );
  }

  return <div className={`h-full ${padding}`}>{body}</div>;
}

/**
 * Sponsorlu alan. Gazetenin grid'i icinde durur ama editoryal karttan bakisla
 * ayirt edilebilir: farkli zemin, kesikli ust cizgi ve zorunlu etiket.
 * Etiket rengi tek basina tasiyici degildir; metin de "Sponsorlu" yazar.
 */
function SponsoredCell({ entry }: { entry: NewspaperItemView }) {
  const { item } = entry;
  const placement = placementByCode(item.placementCode);

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="sponsored">Sponsorlu</Badge>
        {item.sponsorName ? <span className="text-xs text-fg-subtle">{item.sponsorName}</span> : null}
      </div>

      {item.imageSeed && item.imageGlyph ? (
        <CoverTile
          seed={item.imageSeed}
          glyph={item.imageGlyph}
          height={96}
          rounded="all"
          className="mt-3"
        />
      ) : null}

      <h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{item.body}</p>

      {placement ? (
        <p className="mt-2 text-[0.68rem] text-fg-subtle">
          {placement.widthPx}×{placement.heightPx} · {placement.label}
        </p>
      ) : null}
    </>
  );

  const className =
    'block h-full border-t-2 border-dashed border-signal-500 bg-signal-50 p-4 dark:bg-signal-900/25';

  if (entry.href) {
    return (
      <Link href={entry.href} className={`${className} transition-colors hover:bg-signal-100 dark:hover:bg-signal-900/40`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
