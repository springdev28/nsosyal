import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, EmptyState, InfoNote, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate } from '@/lib/time';
import type { NewspaperItemView } from '@/types/view';

export const metadata: Metadata = { title: 'nGazete' };

const ITEM_LABEL: Record<string, string> = {
  lead: 'Günün ana başlığı',
  editorial: 'Editoryal',
  local: 'Yerel gündem',
  project_showcase: 'Proje vitrini',
  event_ad: 'Etkinlik ilanı',
  org_ad: 'Kurumsal ilan',
};

/**
 * nGazete (PROJECT_SPEC 7.9 / 17.12).
 *
 * Iki isi ayni anda yapar: gunluk acilmaya deger editoryal ozet ve kisisel akis
 * siralamasindan tamamen ayrilmis bir ticari envanter. Sponsorlu kartlar hem
 * gorsel hem metinsel olarak editoryal icerikten ayrilir.
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
        icon="📰"
        title="Yayımlanmış sayı yok"
        description="Gazete her sabah yayımlanır. Yeni sayı çıktığında navigasyondaki nGazete düğmesinde rozet görünür."
      />
    );
  }

  const editorial = current.items.filter((entry) => !entry.item.sponsored);
  const sponsored = current.items.filter((entry) => entry.item.sponsored);
  const lead = editorial.find((entry) => entry.item.itemType === 'lead');
  const rest = editorial.filter((entry) => entry !== lead);

  const canAdvertise = viewer?.kind === 'organization' || viewer?.role === 'admin';

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="nGazete"
        description="Günün editoryal özeti ve açıkça işaretlenmiş ücretli alanlar."
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
                  <span aria-hidden="true">{entry.issue.coverEmoji}</span>
                  {formatDate(`${entry.issue.issueDate}T09:00:00Z`)}
                  {entry.issue.theme ? ` · ${entry.issue.theme}` : ''}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Card className="overflow-hidden">
        <div className="border-b-4 border-double border-line-strong bg-bg-sunken px-4 py-5 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-subtle">
            nSosyal 5N · Dijital Gazete
          </p>
          <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">{current.issue.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            <time dateTime={current.issue.issueDate}>
              {formatDate(`${current.issue.issueDate}T09:00:00Z`)}
            </time>
            {current.issue.theme ? ` · ${current.issue.theme} özel sayısı` : ''}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-fg-muted">{current.issue.standfirst}</p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {lead ? <LeadCard entry={lead} /> : null}

          {rest.length > 0 ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {rest.map((entry) => (
                <li key={entry.item.id}>
                  <EditorialCard entry={entry} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>

      <section aria-labelledby="sponsored-heading">
        <SectionHeader
          title={<span id="sponsored-heading">Ücretli alanlar</span>}
          description="Bu kartlar için ödeme yapılmıştır ve gazete dışında hiçbir sıralamayı etkilemez."
        />

        {sponsored.length === 0 ? (
          <InfoNote icon="📰">Bu sayıda ücretli alan yok.</InfoNote>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sponsored.map((entry) => (
              <li key={entry.item.id}>
                <SponsoredCard entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="p-4">
        <h2 className="font-semibold">Gelir modeli nasıl çalışıyor?</h2>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>• Ücretli görünürlük yalnızca nGazete içinde satılır.</li>
          <li>• Sponsorlu kartlar zorunlu olarak “Sponsorlu” etiketi taşır ve editoryal içerikten ayrılır.</li>
          <li>
            • Kişisel akış sıralaması hiçbir ödemeyle değiştirilemez; sıralama kodunda sponsorlu bir alan
            bulunmaz.
          </li>
          <li>• Kurumlar tekil ilan veya düzenli yer alma (abonelik) tercih edebilir.</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link href="/about#gelir" className="font-semibold text-accent underline">
            Ayrıntılar ve kodda nerede durduğu
          </Link>
        </p>
      </Card>
    </div>
  );
}

function LeadCard({ entry }: { entry: NewspaperItemView }) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        {ITEM_LABEL[entry.item.itemType]}
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold leading-tight">{entry.item.title}</h3>
      <p className="mt-2 text-fg-muted">{entry.item.body}</p>
    </>
  );

  return entry.href ? (
    <Link href={entry.href} className="block rounded-xl border border-line p-4 hover:border-accent">
      {content}
      <span className="mt-2 inline-block text-sm font-semibold text-accent">Devamını gör →</span>
    </Link>
  ) : (
    <div className="rounded-xl border border-line p-4">{content}</div>
  );
}

function EditorialCard({ entry }: { entry: NewspaperItemView }) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        {ITEM_LABEL[entry.item.itemType]}
      </p>
      <h3 className="mt-1 font-serif text-lg font-bold leading-snug">{entry.item.title}</h3>
      <p className="mt-1 text-sm text-fg-muted">{entry.item.body}</p>
    </>
  );

  return entry.href ? (
    <Link href={entry.href} className="block h-full rounded-xl border border-line p-4 hover:border-accent">
      {content}
    </Link>
  ) : (
    <div className="h-full rounded-xl border border-line p-4">{content}</div>
  );
}

/**
 * Sponsorlu kart. Editoryal karttan bilerek farkli gorunur: kesikli kenarlik,
 * farkli arka plan ve zorunlu etiket (PROJECT_SPEC 7.9).
 */
function SponsoredCard({ entry }: { entry: NewspaperItemView }) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="sponsored">Sponsorlu</Badge>
        <span className="text-xs text-fg-subtle">{ITEM_LABEL[entry.item.itemType]}</span>
      </div>
      <h3 className="mt-2 font-semibold leading-snug">{entry.item.title}</h3>
      <p className="mt-1 text-sm text-fg-muted">{entry.item.body}</p>
      {entry.item.sponsorName ? (
        <p className="mt-2 text-xs text-fg-subtle">Veren: {entry.item.sponsorName}</p>
      ) : null}
    </>
  );

  const className =
    'block h-full rounded-xl border-2 border-dashed border-signal-500 bg-signal-50 p-4 dark:bg-signal-900/25';

  return entry.href ? (
    <Link href={entry.href} className={`${className} hover:border-signal-600`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
