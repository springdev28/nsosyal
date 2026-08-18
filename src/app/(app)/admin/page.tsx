import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, SectionHeader, Stat } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Yönetim' };

export default async function AdminHomePage() {
  const viewer = await getViewer();
  const store = getStore();

  const pendingApplications = store.listApplications('pending');
  const openReports = store.listReports().filter((report) => report.status === 'open');
  const pendingAds = store.listAdRequests('pending');
  const actions = store.listModerationActions();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Bekleyen başvuru" value={pendingApplications.length} />
        <Stat label="Açık rapor" value={openReports.length} />
        <Stat label="Bekleyen ilan" value={pendingAds.length} />
        <Stat label="İşlem kaydı" value={actions.length} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/moderation" className="card block p-4 hover:border-accent">
          <span className="text-2xl" aria-hidden="true">
            🛡️
          </span>
          <span className="mt-2 block font-semibold">Topluluk başvuruları</span>
          <span className="mt-1 block text-sm text-fg-muted">
            {pendingApplications.length} başvuru incelemeni bekliyor. Onaylanan başvurular topluluğu açar ve
            başvuranı yönetici yapar.
          </span>
        </Link>

        <Link href="/admin/reports" className="card block p-4 hover:border-accent">
          <span className="text-2xl" aria-hidden="true">
            🚩
          </span>
          <span className="mt-2 block font-semibold">Raporlar</span>
          <span className="mt-1 block text-sm text-fg-muted">
            {openReports.length} açık rapor var.
          </span>
        </Link>

        {viewer?.role === 'admin' ? (
          <Link href="/admin/newspaper" className="card block p-4 hover:border-accent">
            <span className="text-2xl" aria-hidden="true">
              📰
            </span>
            <span className="mt-2 block font-semibold">Gazete ve ilanlar</span>
            <span className="mt-1 block text-sm text-fg-muted">
              {pendingAds.length} ilan başvurusu incelemede. Onaylanan ilan yalnızca gazeteye eklenir.
            </span>
          </Link>
        ) : null}
      </div>

      <section aria-labelledby="audit-heading">
        <SectionHeader
          title={<span id="audit-heading">Moderasyon işlem kaydı</span>}
          description="Her yönetim işlemi denetlenebilir olsun diye kaydedilir (audit log)."
        />
        {actions.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-fg-muted">
              Henüz işlem yok. Bir topluluk başvurusunu onayladığında burada görünecek.
            </p>
          </Card>
        ) : (
          <ol className="space-y-2">
            {actions.slice(0, 20).map((entry) => (
              <li key={entry.action.id}>
                <Card className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <code className="rounded bg-bg-sunken px-1.5 py-0.5 text-xs">{entry.action.action}</code>
                  <span className="text-fg-muted">{entry.moderator.displayName}</span>
                  <time dateTime={entry.action.createdAt} className="text-fg-subtle">
                    {formatRelative(entry.action.createdAt)}
                  </time>
                  {entry.action.note ? (
                    <span className="w-full text-fg-muted">Not: {entry.action.note}</span>
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
