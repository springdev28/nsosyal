import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { NewspaperAutoOpen } from '@/components/newspaper/NewspaperAutoOpen';
import { AppShell } from '@/components/layout/AppShell';
import {
  getViewer,
  hasCompletedOnboarding,
  hasSeenTodaysNewspaper,
  prefersReducedMotion,
} from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { toIstanbulDateKey } from '@/lib/time';

/**
 * Oturum acmis kullanicilar icin uygulama kabugu.
 *
 * nGazete gun icindeki ilk oturumda otomatik acilir (PROJECT_SPEC 7.9). Karar
 * burada verilir cunku hangi sayfada olursa olsun gecerlidir.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!(await hasCompletedOnboarding())) redirect('/onboarding');

  const store = getStore();
  const todayKey = toIstanbulDateKey(new Date());
  const issue = store.getIssueByDate(todayKey);
  const alreadySeen = await hasSeenTodaysNewspaper(todayKey);
  const reducedMotion = await prefersReducedMotion();

  return (
    <>
      <AppShell
        viewer={viewer}
        unreadCount={store.unreadNotificationCount(viewer.id)}
        hasNewIssue={Boolean(issue) && !alreadySeen}
      >
        {children}
      </AppShell>

      {issue && !alreadySeen ? (
        <NewspaperAutoOpen
          issueDate={issue.issue.issueDate}
          title={issue.issue.title}
          standfirst={issue.issue.standfirst}
          coverEmoji={issue.issue.coverEmoji}
          leadTitle={issue.items[0]?.item.title ?? ''}
          sponsoredCount={issue.items.filter((entry) => entry.item.sponsored).length}
          /* Erisilebilirlik tercihi varsa bekleme uygulanmaz (PROJECT_SPEC 7.9). */
          closeDelaySeconds={reducedMotion ? 0 : 3}
        />
      ) : null}
    </>
  );
}
