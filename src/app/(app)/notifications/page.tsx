import type { Metadata } from 'next';
import Link from 'next/link';

import { markNotificationsRead } from '@/actions/social';
import { Badge, Card, EmptyState, Icon, SectionHeader, type IconName } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatEventRange, formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Bildirimler' };

/** Bildirim turune gore ikon. */
const TYPE_ICON: Record<string, IconName> = {
  event_reminder: 'bell',
  community_application: 'shield',
  community_joined: 'users',
  comment: 'message',
  moderation: 'check',
  newspaper: 'newspaper',
  ad_request: 'megaphone',
};

/** Uygulama ici bildirim merkezi (PROJECT_SPEC 6.1 ekran 21). */
export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const store = getStore();
  const notifications = store.listNotifications(viewer.id);
  const reminders = store.getReminders(viewer.id);
  const unread = notifications.filter((entry) => entry.readAt === null).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Bildirimler"
        description="Hatırlatmalar, topluluk işlemleri ve moderasyon kararları."
        action={
          unread > 0 ? (
            <form action={markNotificationsRead}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
              >
                Tümünü okundu işaretle
              </button>
            </form>
          ) : null
        }
      />

      {reminders.length > 0 ? (
        <section aria-labelledby="reminders-heading">
          <SectionHeader
            title={<span id="reminders-heading">Yaklaşan hatırlatmalar ({reminders.length})</span>}
          />
          <ul className="space-y-2">
            {reminders.map((entry) => (
              <li key={entry.reminder.id}>
                <Card className="flex flex-wrap items-center gap-3 p-3">
                  <CoverBadge seed={entry.event.slug} glyph={entry.event.emoji} size={40} />
                  <span className="min-w-0 flex-1">
                    <Link href={`/events/${entry.event.slug}`} className="font-medium hover:underline">
                      {entry.event.title}
                    </Link>
                    <span className="block text-sm text-fg-muted">
                      <time dateTime={entry.event.startsAt}>
                        {formatEventRange(entry.event.startsAt, entry.event.endsAt)}
                      </time>
                    </span>
                    <span className="block text-xs text-fg-subtle">
                      Hatırlatma: <time dateTime={entry.reminder.remindAt}>{formatRelative(entry.reminder.remindAt)}</time>
                    </span>
                  </span>
                  <Badge tone="accent">Kurulu</Badge>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="all-notifications">
        <SectionHeader title={<span id="all-notifications">Tümü</span>} />

        {notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Bildirim yok"
            description="Bir etkinliğe hatırlatma kurduğunda veya bir topluluğa katıldığında burada görünür."
            action={
              <Link href="/explore/time" className="text-sm font-semibold text-accent underline">
                Yaklaşan etkinliklere bak
              </Link>
            }
          />
        ) : (
          <ol className="space-y-2">
            {notifications.map((notification) => {
              const unreadItem = notification.readAt === null;
              const content = (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-sunken text-accent">
                      <Icon name={TYPE_ICON[notification.type] ?? 'info'} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {notification.title}
                        {unreadItem ? (
                          <span className="ml-2 align-middle">
                            <Badge tone="accent">Yeni</Badge>
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-sm text-fg-muted">{notification.body}</p>
                      <p className="mt-1 text-xs text-fg-subtle">
                        <time dateTime={notification.createdAt}>{formatRelative(notification.createdAt)}</time>
                      </p>
                    </div>
                  </div>
                </>
              );

              return (
                <li key={notification.id}>
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      className={`card block p-3 hover:border-accent ${unreadItem ? 'border-accent/40' : ''}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <Card className={`p-3 ${unreadItem ? 'border-accent/40' : ''}`}>{content}</Card>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
