/**
 * Topluluk basvurularini benzerlik baglamiyla inceletir. Her karar communities
 * action'i uzerinden moderasyon loguna yazilir.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import { reviewCommunityApplication } from '@/actions/communities';
import { Avatar, Badge, Card, EmptyState, InfoNote, SectionHeader } from '@/components/ui';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';
import type { ApplicationView } from '@/types/view';

export const metadata: Metadata = { title: 'Topluluk başvuruları · Yönetim' };

const SCOPE_LABEL: Record<string, string> = {
  local: 'Yerel',
  national: 'Ulusal',
  online: 'Çevrim içi',
};

const STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'İncelemede', tone: 'warning' },
  approved: { label: 'Onaylandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
  changes_requested: { label: 'Düzenleme istendi', tone: 'warning' },
};

/**
 * Moderator onay kuyrugu (PROJECT_SPEC 6.1 ekran 12 / 17.8).
 *
 * Onaylandiginda topluluk gercekten olusur ve basvuran community_manager olur.
 * Her karar moderation_actions tablosuna yazilir.
 */
export default async function ModerationPage() {
  const store = getStore();
  const pending = store.listApplications('pending');
  const reviewed = store.listApplications().filter((entry) => entry.application.status !== 'pending');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Topluluk başvuruları"
        description="Topluluklar doğrudan açılmaz. Onaylanan başvuru topluluğu oluşturur ve başvuranı yönetici yapar."
      />

      <InfoNote icon="search">
        Benzer isimli aktif topluluklar her başvurunun altında listelenir; bu, aynı alanın tekrar tekrar
        açılmasını önlemek içindir.
      </InfoNote>

      {pending.length === 0 ? (
        <EmptyState
          icon="check"
          title="Bekleyen başvuru yok"
          description="Yeni başvurular geldiğinde burada ve bildirimlerinde görünür."
        />
      ) : (
        <ul className="space-y-3">
          {pending.map((entry) => (
            <li key={entry.application.id}>
              <ApplicationCard entry={entry} />
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 ? (
        <section aria-labelledby="reviewed-heading">
          <SectionHeader title={<span id="reviewed-heading">Karara bağlananlar</span>} />
          <ul className="space-y-2">
            {reviewed.map((entry) => {
              const status = STATUS[entry.application.status];
              return (
                <li key={entry.application.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{entry.application.name}</span>
                      <span className="block text-sm text-fg-subtle">
                        {entry.applicant.displayName}
                        {entry.application.reviewedAt
                          ? ` · ${formatRelative(entry.application.reviewedAt)} karara bağlandı`
                          : ''}
                      </span>
                      {entry.application.reviewerNote ? (
                        <span className="mt-1 block text-sm text-fg-muted">
                          Not: {entry.application.reviewerNote}
                        </span>
                      ) : null}
                    </span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ApplicationCard({ entry }: { entry: ApplicationView }) {
  const { application } = entry;

  return (
    <Card as="article" className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar profile={entry.applicant} size={40} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold">{application.name}</h3>
          <p className="text-sm text-fg-subtle">
            <Link href={`/profile/${entry.applicant.username}`} className="hover:underline">
              {entry.applicant.displayName}
            </Link>
            <span aria-hidden="true"> · </span>
            <time dateTime={application.createdAt}>{formatRelative(application.createdAt)}</time>
          </p>
        </div>
        <Badge tone="warning">İncelemede</Badge>
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-subtle">Kök alan</dt>
          <dd className="font-medium">{entry.rootTopic.name}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Kapsam</dt>
          <dd className="font-medium">
            {SCOPE_LABEL[application.scope]}
            {entry.provinceName ? ` · ${entry.provinceName}` : ''}
            {entry.districtName ? ` / ${entry.districtName}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-fg-subtle">Hedef kitle</dt>
          <dd className="font-medium">{application.audience}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <p className="text-sm font-semibold">Amaç</p>
        <p className="mt-1 whitespace-pre-line text-sm text-fg-muted">{application.rationale}</p>
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold">Kurallar</p>
        <p className="mt-1 whitespace-pre-line text-sm text-fg-muted">{application.rules}</p>
      </div>

      {entry.similarCommunities.length > 0 ? (
        <div className="mt-3 rounded-xl border border-warning/40 bg-warning-soft p-3">
          <p className="text-sm font-semibold text-warning">Benzer aktif topluluklar</p>
          <ul className="mt-1 space-y-1 text-sm">
            {entry.similarCommunities.map((community) => (
              <li key={community.id}>
                <Link href={`/communities/${community.slug}`} className="underline">
                  {community.emoji} {community.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-fg-muted">
            Kapsam gerçekten farklı mı? Değilse başvuranı mevcut topluluğa yönlendirebilirsin.
          </p>
        </div>
      ) : null}

      <form action={reviewCommunityApplication} className="mt-4 space-y-3">
        <input type="hidden" name="applicationId" value={application.id} />

        <div>
          <label htmlFor={`note-${application.id}`} className="mb-1 block text-sm font-medium">
            Karar notu
          </label>
          <textarea
            id={`note-${application.id}`}
            name="note"
            rows={2}
            placeholder="Başvurana iletilecek kısa gerekçe."
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="decision"
            value="approved"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Onayla ve topluluğu aç
          </button>
          <button
            type="submit"
            name="decision"
            value="changes_requested"
            className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
          >
            Düzenleme iste
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
  );
}
