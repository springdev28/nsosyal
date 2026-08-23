/**
 * Wraps signed-in routes in AppShell and loads shared sidebar data once.
 * `/publish` stays outside this route group because it owns a separate workspace shell.
 */
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell, type TrendingTopic } from '@/components/layout/AppShell';
import { NewspaperAutoOpen } from '@/components/newspaper/NewspaperAutoOpen';
import {
  getViewer,
  hasCompletedOnboarding,
  hasSeenNewspaperIssue,
  prefersReducedMotion,
} from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!(await hasCompletedOnboarding())) redirect('/onboarding');

  const store = getStore();
  // Track the issue actually shown, not the calendar date. Before 06:00 that is
  // yesterday's issue; after publication, today's issue may open once as well.
  const issue = store.getLatestIssue();
  const alreadySeen = issue ? await hasSeenNewspaperIssue(issue.issue.issueDate) : false;
  const reducedMotion = await prefersReducedMotion();

  // The shared Popular panel ranks topics by visible post count.
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
          /* Reduced motion removes the timed close delay. */
          closeDelaySeconds={reducedMotion ? 0 : 3}
        />
      ) : null}
    </>
  );
}
