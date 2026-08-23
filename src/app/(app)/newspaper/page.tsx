/**
 * Renders one nGazete issue as a paged newspaper composition. Editorial and
 * sponsored items share the layout, while the entire data path stays outside the feed.
 */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { IssueCalendar } from '@/components/newspaper/IssueCalendar';
import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { CoverTile } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, toIstanbulDateKey } from '@/lib/time';
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

/** Four items preserve visible page navigation without making a page feel empty. */
const ITEMS_PER_PAGE = 4;

const INTEREST_KEYWORDS: Record<string, string[]> = {
  'havacilik-uzay': ['havacılık', 'uzay', 'roket', 'iha', 'uydu', 'uçuş'],
  biyoteknoloji: ['biyoteknoloji', 'biyolab', 'laboratuvar', 'hücre', 'sera'],
  robotik: ['robotik', 'robot', 'devre', 'sensör', 'maker'],
  'yapay-zeka': ['yapay zekâ', 'model', 'veri', 'nlp', 'algoritma'],
  surdurulebilirlik: ['sürdürülebilirlik', 'enerji', 'ges', 'iklim', 'rüzgâr'],
};

function normalizeForInterest(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

export default async function NewspaperPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; sayfa?: string; ay?: string }>;
}) {
  const { date, sayfa, ay } = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const issues = store.listIssues();
  const today = toIstanbulDateKey(new Date());

  // Prefer today's published issue; before publication, fall back to the latest one.
  const current = date ? store.getIssueByDate(date) : (store.getIssueByDate(today) ?? store.getLatestIssue());

  if (!current) {
    return (
      <EmptyState
        icon="newspaper"
        title="Yayımlanmış sayı yok"
        description="Gazete her sabah yayımlanır."
      />
    );
  }

  const issueDates = new Set(issues.map((entry) => entry.issue.issueDate));
  const themeByDate = Object.fromEntries(
    issues.map((entry) => [entry.issue.issueDate, entry.issue.theme]),
  );
  const months = issues.map((entry) => entry.issue.issueDate.slice(0, 7)).sort();
  const month = ay && /^\d{4}-\d{2}$/.test(ay) ? ay : current.issue.issueDate.slice(0, 7);

  // Number issues in chronological order from the oldest available issue.
  const issueNumber =
    issues.length - issues.findIndex((entry) => entry.issue.id === current.issue.id);

  // Sponsored and editorial items share one priority/publication-order sequence.
  const composed = [...current.items].sort(
    (a, b) => a.item.priority - b.item.priority || a.item.publicationOrder - b.item.publicationOrder,
  );

  // The lead story stays on page one; only the remaining items are paginated.
  const lead = composed[0] ?? null;
  const rest = composed.slice(1);

  // The reader composition is capped at the product limit of five pages.
  const pageCount = Math.min(5, Math.max(1, Math.ceil(rest.length / ITEMS_PER_PAGE)));
  const requested = Number(sayfa);
  const page = Number.isFinite(requested) ? Math.min(Math.max(1, Math.trunc(requested)), pageCount) : 1;

  const pageItems = rest.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const interestTerms = (viewer?.topicIds ?? [])
    .map((id) => store.getTopic(id))
    .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic))
    .flatMap((topic) => [topic.name, topic.slug, ...(INTEREST_KEYWORDS[topic.slug] ?? [])])
    .flatMap((term) => normalizeForInterest(term).split(/\s+/))
    .filter((term) => term.length >= 4);
  const isForViewer = (entry: NewspaperItemView) => {
    const text = normalizeForInterest(`${entry.item.title} ${entry.item.standfirst ?? ''} ${entry.item.body}`);
    return interestTerms.some((term) => text.includes(term));
  };
  const pageHref = (target: number) =>
    `/newspaper?date=${current.issue.issueDate}&ay=${month}${target > 1 ? `&sayfa=${target}` : ''}`;

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="nGazete"
        action={
          viewer ? (
            <Link
              href="/publish"
              target="_blank"
              rel="noopener noreferrer"
              prefetch
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              Yayın Atölyesi <span className="sr-only">yeni sekmede açılır</span>
            </Link>
          ) : null
        }
      />

      {/* Full-width placement keeps the newspaper readable inside the two-sidebar app shell. */}
      <IssueCalendar
        month={month}
        issueDates={issueDates}
        themeByDate={themeByDate}
        activeDate={current.issue.issueDate}
        earliestMonth={months[0] ?? month}
        latestMonth={months[months.length - 1] ?? month}
      />

      <Card className="newspaper-sheet mx-auto max-w-4xl overflow-hidden">
          {/* Masthead */}
          <header className="newspaper-masthead border-b-4 border-double border-line-strong px-4 py-6 text-center sm:px-8">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-fg-subtle">
              nSosyal
            </p>
            <p className="font-serif text-4xl font-black tracking-tight sm:text-5xl">nGazete</p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-y border-line py-1.5 text-xs text-fg-muted">
              <span>Sayı {issueNumber}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={current.issue.issueDate}>
                {formatDate(`${current.issue.issueDate}T09:00:00Z`)}
              </time>
              {current.issue.issueDate === today ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-accent">Bugünün sayısı</span>
                </>
              ) : null}
              {current.issue.theme ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{current.issue.theme} özel sayısı</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>
                Sayfa {page}/{pageCount}
              </span>
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight">
              {current.issue.title}
            </h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-fg-muted">{current.issue.standfirst}</p>

            <p className="mx-auto mt-2 max-w-xl border-t border-line pt-2 text-[0.7rem] text-fg-subtle">
              Turuncu şerit, ilgi alanlarınla eşleşen haberleri gösterir.
            </p>
          </header>

          {/* The lead story owns the full width on page one. */}
          {lead && page === 1 ? (
            <div className="border-b border-line">
              <LeadCell entry={lead} highlighted={isForViewer(lead)} />
            </div>
          ) : null}

          {/* CSS columns fill uneven article heights; break-inside keeps each article intact. */}
          <div className="gap-x-7 px-4 py-4 sm:px-6 md:columns-2 2xl:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
            {pageItems.map((entry) => (
              <ColumnCell key={entry.item.id} entry={entry} highlighted={isForViewer(entry)} />
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              aria-label="Gazete sayfaları"
              className="flex flex-wrap items-center justify-center gap-2 border-t border-line bg-bg-sunken px-4 py-3"
            >
              <PageLink href={pageHref(page - 1)} enabled={page > 1} label="Önceki sayfa">
                ‹ Önceki
              </PageLink>

              <ul className="flex flex-wrap items-center gap-1">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
                  <li key={target}>
                    <Link
                      href={pageHref(target)}
                      aria-current={target === page ? 'page' : undefined}
                      aria-label={`Sayfa ${target}`}
                      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm ${
                        target === page
                          ? 'bg-accent font-bold text-accent-fg'
                          : 'border border-line text-fg-muted hover:bg-bg-hover'
                      }`}
                    >
                      {target}
                    </Link>
                  </li>
                ))}
              </ul>

              <PageLink href={pageHref(page + 1)} enabled={page < pageCount} label="Sonraki sayfa">
                Sonraki ›
              </PageLink>
            </nav>
        ) : null}
      </Card>
    </div>
  );
}

function PageLink({
  href,
  enabled,
  label,
  children,
}: {
  href: string;
  enabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm text-fg-subtle"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm text-fg-muted hover:bg-bg-hover"
    >
      {children}
    </Link>
  );
}

/** Mansetin kendisi: sayfanin ustunde, tam genislikte, en buyuk hiyerarsi. */
function LeadCell({ entry, highlighted }: { entry: NewspaperItemView; highlighted: boolean }) {
  const { item } = entry;

  if (item.imageUrl) {
    return (
      <article aria-label={item.title} className="p-4 sm:p-6">
        <PublicationArtwork entry={entry} height={360} />
        <PublicationButtons entry={entry} />
      </article>
    );
  }

  const body = (
    <>
      {item.imageSeed && item.imageGlyph ? (
        <CoverTile
          seed={item.imageSeed}
          glyph={item.imageGlyph}
          height={200}
          rounded="none"
          className="mb-4"
        />
      ) : null}

      <div className={`px-4 pb-5 sm:px-6 ${highlighted ? 'border-l-4 border-signal-500 bg-signal-50 pt-4 dark:bg-signal-900/25' : ''}`}>
        <SectionTag item={item} highlighted={highlighted} />
        <h3 className="mt-1 font-serif text-3xl font-bold leading-tight sm:text-4xl">
          {item.title}
        </h3>
        {item.standfirst ? (
          <p className="mt-2 max-w-2xl font-serif text-lg italic leading-snug text-fg-muted">
            {item.standfirst}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl leading-relaxed text-fg-muted">{item.body}</p>
        {item.sourceOrAuthor ? (
          <p className="mt-3 text-xs text-fg-subtle">{item.sourceOrAuthor}</p>
        ) : null}
      </div>
    </>
  );

  if (entry.href) {
    return (
      <Link href={entry.href} className="block transition-colors hover:bg-bg-hover">
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}

/** Renders one article in the shared editorial/sponsored column flow. */
function ColumnCell({ entry, highlighted }: { entry: NewspaperItemView; highlighted: boolean }) {
  const { item } = entry;

  if (item.imageUrl) {
    return (
      <article aria-label={item.title} className="rounded-xl border border-line bg-bg-raised p-3">
        <PublicationArtwork entry={entry} height={280} />
        <PublicationButtons entry={entry} />
      </article>
    );
  }
  const isFeature = item.layoutVariant === 'feature';
  const isBrief = item.layoutVariant === 'brief';

  const headingClass = isFeature
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
          height={128}
          rounded="all"
          className="mb-3"
        />
      ) : null}

      <SectionTag item={item} highlighted={highlighted} />

      <h3 className={`mt-1 ${headingClass}`}>{item.title}</h3>

      {item.standfirst ? (
        <p className="mt-1.5 font-serif italic leading-snug text-fg-muted">{item.standfirst}</p>
      ) : null}

      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.body}</p>

      {item.sourceOrAuthor ? (
        <p className="mt-2 text-xs text-fg-subtle">{item.sourceOrAuthor}</p>
      ) : null}
    </>
  );

  const className = highlighted
    ? 'block border-l-2 border-signal-500 bg-signal-50 p-3 dark:bg-signal-900/25'
    : 'block';

  if (entry.href) {
    return (
      <Link href={entry.href} className={`${className} transition-colors hover:opacity-90`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

/** Shows the approved creative without editor guides and preserves its aspect ratio. */
function PublicationArtwork({ entry, height }: { entry: NewspaperItemView; height: number }) {
  const { item } = entry;
  if (!item.imageUrl) return null;
  return (
    <div className="relative overflow-hidden rounded-xl bg-bg-sunken" style={{ height }}>
      <Image
        src={item.imageUrl}
        alt={item.imageAlt ?? ''}
        fill
        unoptimized
        sizes="(max-width: 768px) 92vw, 720px"
        className="object-contain"
      />
    </div>
  );
}

/** Publishes approved CTA styling and opens external targets in a new tab. */
function PublicationButtons({ entry }: { entry: NewspaperItemView }) {
  const buttons = entry.item.ctaButtons ?? [];
  if (buttons.length === 0) return null;

  return (
    <nav aria-label={`${entry.item.title} bağlantıları`} className="mt-3 flex flex-wrap gap-2">
      {buttons.map((button, index) => {
        const isExternal = /^https:\/\//i.test(button.url);
        const isOutline = button.variant === 'outline';
        const style: React.CSSProperties = {
          color: button.color,
          borderColor: button.backgroundColor,
          borderRadius:
            button.variant === 'pill' ? 999 : button.variant === 'square' ? 4 : 12,
          background: isOutline
            ? 'transparent'
            : button.variant === 'gradient'
              ? `linear-gradient(120deg, ${button.gradientFrom}, ${button.gradientTo})`
              : button.backgroundColor,
        };
        return (
          <Link
            key={`${button.url}-${index}`}
            href={button.url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            style={style}
            className={`publication-cta--${button.animation} inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90`}
          >
            {button.label}
            {isExternal ? <span className="sr-only"> yeni sekmede açılır</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Uses the orange treatment only for reader-interest matches, never payment status. */
function SectionTag({ item, highlighted }: { item: NewspaperItemView['item']; highlighted: boolean }) {
  if (highlighted) {
    return (
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-signal-700 dark:text-signal-300">
        İlgine göre · {SECTION_LABEL[item.section]}
      </p>
    );
  }
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
      {SECTION_LABEL[item.section]}
    </p>
  );
}
