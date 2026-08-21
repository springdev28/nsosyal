import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell, type TrendingTopic } from '@/components/layout/AppShell';
import { NewspaperAutoOpen } from '@/components/newspaper/NewspaperAutoOpen';
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

  // Sag paneldeki "Popüler" listesi: konuya bagli gonderi sayilari.
  const posts = store.getFeed({ viewerId: null, limit: 500 });
  const trending: TrendingTopic[] = store
    .getTopics()
    .map((topic) => ({
      slug: topic.slug,
      name: topic.name,
      postCount: posts.filter((view) => view.post.topicIds.includes(topic.id)).length,
    }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6);

  return (
    <>
      <AppShell
        viewer={viewer}
        unreadCount={store.unreadNotificationCount(viewer.id)}
        hasNewIssue={Boolean(issue) && !alreadySeen}
        trending={trending}
      >
        {children}
      </AppShell>

      {issue && !alreadySeen ? (
        <NewspaperAutoOpen
          issueDate={issue.issue.issueDate}
          title={issue.issue.title}
          standfirst={issue.issue.standfirst}
          leadTitle={issue.items[0]?.item.title ?? ''}
          /* Erisilebilirlik tercihi varsa bekleme uygulanmaz (PROJECT_SPEC 7.9). */
          closeDelaySeconds={reducedMotion ? 0 : 3}
        />
      ) : null}
    </>
  );
}
