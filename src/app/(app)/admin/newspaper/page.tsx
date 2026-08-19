import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { reviewAdRequest } from '@/actions/newspaper';
import { Badge, Card, EmptyState, InfoNote, SectionHeader } from '@/components/ui';
import { getViewer, isAdmin } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Gazete ve ilanlar · Yönetim' };

const PLACEMENT_LABEL: Record<string, string> = {
  event_ad: 'Etkinlik ilanı',
  org_ad: 'Kurumsal ilan',
  project_showcase: 'Proje vitrini',
};

const STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'İncelemede', tone: 'warning' },
  approved: { label: 'Yayımlandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
  changes_requested: { label: 'Düzenleme istendi', tone: 'warning' },
};

/**
 * Gazete yonetimi (PROJECT_SPEC 7.9 / 17.12).
 * Onaylanan ilan yalnizca bir gazete sayisina eklenir; akis siralamasina
 * hicbir etkisi yoktur.
 */
export default async function AdminNewspaperPage() {
  const viewer = await getViewer();
  if (!isAdmin(viewer)) redirect('/admin');

  const store = getStore();
  const pending = store.listAdRequests('pending');
  const decided = store.listAdRequests().filter((entry) => entry.request.status !== 'pending');
  const issues = store.listIssues();

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Gazete ve ilanlar"
        description="İlan başvurularını karara bağla ve onaylananları bir sayıya yerleştir."
      />

      <InfoNote icon="info">
        Onaylanan ilan yalnızca gazete sayısına “Sponsorlu” kart olarak eklenir. Sıralama kodunda sponsorlu bir
        alan yoktur; ödeme hiçbir kullanıcının akışını değiştiremez.
      </InfoNote>

      <section aria-labelledby="pending-ads">
        <SectionHeader title={<span id="pending-ads">Bekleyen başvurular ({pending.length})</span>} />

        {pending.length === 0 ? (
          <EmptyState
            icon="newspaper"
            title="Bekleyen ilan başvurusu yok"
            description="Kurum hesapları başvuru gönderdiğinde burada listelenir."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((entry) => (
              <li key={entry.request.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{entry.request.title}</h3>
                      <p className="text-sm text-fg-subtle">
                        <Link href={`/profile/${entry.organization.username}`} className="hover:underline">
                          {entry.organization.displayName}
                        </Link>
                        <span aria-hidden="true"> · </span>
                        {PLACEMENT_LABEL[entry.request.placementType]}
                        <span aria-hidden="true"> · </span>
                        <time dateTime={entry.request.createdAt}>
                          {formatRelative(entry.request.createdAt)}
                        </time>
                      </p>
                    </div>
                    <Badge tone="warning">İncelemede</Badge>
                  </div>

                  <p className="mt-2 text-sm text-fg-muted">{entry.request.body}</p>
                  <p className="mt-1 text-xs text-fg-subtle">İletişim: {entry.request.contactEmail}</p>

                  <form action={reviewAdRequest} className="mt-3 space-y-2">
                    <input type="hidden" name="requestId" value={entry.request.id} />

                    <div>
                      <label
                        htmlFor={`issue-${entry.request.id}`}
                        className="mb-1 block text-sm font-medium"
                      >
                        Hangi sayıya eklensin?
                      </label>
                      <select
                        id={`issue-${entry.request.id}`}
                        name="issueDate"
                        defaultValue={entry.request.requestedIssueStart ?? issues[0]?.issue.issueDate}
                        className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3 sm:max-w-xs"
                      >
                        {issues.map((issue) => (
                          <option key={issue.issue.id} value={issue.issue.issueDate}>
                            {formatDate(`${issue.issue.issueDate}T09:00:00Z`)}
                            {issue.issue.theme ? ` · ${issue.issue.theme}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
                      >
                        Onayla ve sayıya ekle
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="inline-flex min-h-11 items-center rounded-xl border border-danger/40 bg-danger-soft px-4 text-sm font-semibold text-danger"
                      >
                        Reddet
                      </button>
                    </div>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 ? (
        <section aria-labelledby="decided-ads">
          <SectionHeader title={<span id="decided-ads">Karara bağlananlar</span>} />
          <ul className="space-y-2">
            {decided.map((entry) => {
              const status = STATUS[entry.request.status];
              return (
                <li key={entry.request.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{entry.request.title}</span>
                      <span className="block text-sm text-fg-subtle">
                        {entry.organization.displayName}
                        {entry.request.reviewedAt
                          ? ` · ${formatRelative(entry.request.reviewedAt)} karara bağlandı`
                          : ''}
                      </span>
                    </span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="issues-heading">
        <SectionHeader title={<span id="issues-heading">Yayımlanan sayılar</span>} />
        <ul className="grid gap-2 sm:grid-cols-2">
          {issues.map((entry) => (
            <li key={entry.issue.id}>
              <Link
                href={`/newspaper?date=${entry.issue.issueDate}`}
                className="card block p-3 hover:border-accent"
              >
                <span className="font-medium">
                  {' '}
                  {formatDate(`${entry.issue.issueDate}T09:00:00Z`)}
                </span>
                <span className="mt-0.5 block text-sm text-fg-subtle">
                  {entry.items.length} kart · {entry.items.filter((item) => item.item.sponsored).length}{' '}
                  sponsorlu
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
