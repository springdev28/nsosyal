/** Topluluk basvuru formuna konu, il ve mevcut benzer topluluk baglamini saglar. */
import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, SectionHeader, Icon } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { DISTRICTS, PROVINCES } from '@/lib/geo';
import { formatRelative } from '@/lib/time';

import { ApplicationForm } from './ApplicationForm';

export const metadata: Metadata = { title: 'Topluluk öner' };

const STATUS_LABEL: Record<string, { label: string; tone: 'neutral' | 'success' | 'danger' | 'warning' }> = {
  pending: { label: 'İncelemede', tone: 'warning' },
  approved: { label: 'Onaylandı', tone: 'success' },
  rejected: { label: 'Reddedildi', tone: 'danger' },
  changes_requested: { label: 'Düzenleme istendi', tone: 'warning' },
};

export default async function ApplyPage() {
  const viewer = await getViewer();
  const store = getStore();

  const mine = viewer
    ? store.listApplications().filter((entry) => entry.application.applicantId === viewer.id)
    : [];

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/communities" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />Topluluklar
        </Link>
      </p>

      <SectionHeader
        as="h1"
        title="Topluluk öner"
        description="Yerel veya niş bir topluluk başlatmak istiyorsan başvuru gönder. Moderatör onayından sonra açılır."
      />

      {mine.length > 0 ? (
        <section aria-labelledby="my-applications">
          <SectionHeader title={<span id="my-applications">Başvurularım</span>} />
          <ul className="space-y-2">
            {mine.map((entry) => {
              const status = STATUS_LABEL[entry.application.status];
              return (
                <li key={entry.application.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{entry.application.name}</span>
                      <span className="block text-sm text-fg-subtle">
                        <time dateTime={entry.application.createdAt}>
                          {formatRelative(entry.application.createdAt)}
                        </time>{' '}
                        gönderildi
                      </span>
                      {entry.application.reviewerNote ? (
                        <span className="mt-1 block text-sm text-fg-muted">
                          Moderatör notu: {entry.application.reviewerNote}
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

      <ApplicationForm
        topics={store.getTopics()}
        provinces={[...PROVINCES]}
        districts={[...DISTRICTS]}
        existingNames={store.listCommunities().map((community) => community.name)}
      />
    </div>
  );
}
