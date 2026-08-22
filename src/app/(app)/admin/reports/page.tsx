/** Icerik raporlarini yetkili personele sunar ve cozum notunu denetim yoluna yazar. */
import type { Metadata } from 'next';

import { resolveReport } from '@/actions/communities';
import { Badge, Card, EmptyState, SectionHeader } from '@/components/ui';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Raporlar · Yönetim' };

const STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  open: { label: 'Açık', tone: 'warning' },
  reviewing: { label: 'İnceleniyor', tone: 'warning' },
  actioned: { label: 'İşlem yapıldı', tone: 'success' },
  dismissed: { label: 'Kapatıldı', tone: 'neutral' },
};

/** Rapor kuyrugu (PROJECT_SPEC 11.2). */
export default async function ReportsPage() {
  const store = getStore();
  const reports = store.listReports();

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Raporlar"
        description="Kullanıcı bildirimleri. Her karar moderasyon işlem kaydına yazılır."
      />

      {reports.length === 0 ? (
        <EmptyState icon="flag" title="Rapor yok" description="Bildirilen içerik burada listelenir." />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const status = STATUS[report.status];
            const reporter = store.getProfile(report.reporterId);
            return (
              <li key={report.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{report.reason}</p>
                      <p className="text-sm text-fg-subtle">
                        {reporter?.displayName ?? 'Bilinmeyen'} ·{' '}
                        <time dateTime={report.createdAt}>{formatRelative(report.createdAt)}</time> ·{' '}
                        {report.entityType}
                      </p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>

                  <p className="mt-2 text-sm text-fg-muted">{report.detail}</p>

                  {report.status === 'open' || report.status === 'reviewing' ? (
                    <form action={resolveReport} className="mt-3 space-y-2">
                      <input type="hidden" name="reportId" value={report.id} />
                      <label htmlFor={`note-${report.id}`} className="sr-only">
                        Karar notu
                      </label>
                      <input
                        id={`note-${report.id}`}
                        name="note"
                        placeholder="Karar notu"
                        className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          name="status"
                          value="actioned"
                          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
                        >
                          İşlem yapıldı
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="dismissed"
                          className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
                        >
                          Kapat
                        </button>
                      </div>
                    </form>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
