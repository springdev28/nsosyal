import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, InfoNote, SectionHeader, Icon } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, formatRelative } from '@/lib/time';

import { AdRequestForm } from './AdRequestForm';

export const metadata: Metadata = { title: 'nGazete’de ilan ver' };

const STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'İncelemede', tone: 'warning' },
  approved: { label: 'Yayımlandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
  changes_requested: { label: 'Düzenleme istendi', tone: 'warning' },
};

export default async function AdvertisePage() {
  const viewer = await getViewer();
  const store = getStore();
  const canAdvertise = viewer?.kind === 'organization' || viewer?.role === 'admin';

  const issues = store.listIssues().map((entry) => ({
    value: entry.issue.issueDate,
    label: `${formatDate(`${entry.issue.issueDate}T09:00:00Z`)}${entry.issue.theme ? ` · ${entry.issue.theme}` : ''}`,
  }));

  const mine = viewer
    ? store.listAdRequests().filter((entry) => entry.request.organizationId === viewer.id)
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/newspaper" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />nGazete
        </Link>
      </p>

      <SectionHeader
        as="h1"
        title="nGazete’de ilan ver"
        description="Kurumlar için ücretli görünürlük. Kişisel akış sıralaması bundan etkilenmez."
      />

      {!canAdvertise ? (
        <InfoNote icon="building">
          İlan başvurusunu yalnızca kurum hesapları gönderebilir. Demoda kurum akışını görmek için{' '}
          <Link href="/login" className="underline">
            Ege Teknopark demo hesabıyla
          </Link>{' '}
          giriş yapabilirsin.
        </InfoNote>
      ) : null}

      {mine.length > 0 ? (
        <section aria-labelledby="my-ads">
          <SectionHeader title={<span id="my-ads">Başvurularım</span>} />
          <ul className="space-y-2">
            {mine.map((entry) => {
              const status = STATUS[entry.request.status];
              return (
                <li key={entry.request.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{entry.request.title}</span>
                      <span className="block text-sm text-fg-subtle">
                        <time dateTime={entry.request.createdAt}>
                          {formatRelative(entry.request.createdAt)}
                        </time>{' '}
                        gönderildi
                        {entry.request.requestedIssueDate
                          ? ` · hedef sayı ${formatDate(`${entry.request.requestedIssueDate}T09:00:00Z`)}`
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

      {canAdvertise ? (
        <AdRequestForm issueDates={issues} defaultEmail={`demo@${viewer?.username ?? 'kurum'}`} />
      ) : null}

      <Card className="p-4">
        <h2 className="font-semibold">Ne satılıyor, ne satılmıyor?</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-success/40 bg-success-soft p-3">
            <p className="text-sm font-semibold text-success">Satılır</p>
            <ul className="mt-1 space-y-1 text-sm text-fg-muted">
              <li>• Gazete içinde etkinlik ve kurumsal ilan</li>
              <li>• Proje vitrini (sponsorlu etiketiyle)</li>
              <li>• Tematik sayılarda düzenli yer alma</li>
            </ul>
          </div>
          <div className="rounded-xl border border-danger/40 bg-danger-soft p-3">
            <p className="text-sm font-semibold text-danger">Satılmaz</p>
            <ul className="mt-1 space-y-1 text-sm text-fg-muted">
              <li>• Kişisel akışta sıralama yükseltme</li>
              <li>• Öneri algoritmasında öncelik</li>
              <li>• Topluluk akışlarında yerleşim</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
