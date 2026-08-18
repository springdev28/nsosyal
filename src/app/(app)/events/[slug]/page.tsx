import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { cancelReminder, createReminder } from '@/actions/social';
import { Badge, Card, InfoNote, SectionHeader, Icon } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatDate, formatEventRange, formatRelative, formatWeekday } from '@/lib/time';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = getStore().getEventBySlug(slug);
  return { title: event ? event.title : 'Etkinlik' };
}

const MODE_LABEL: Record<string, string> = {
  physical: 'Fiziksel katılım',
  online: 'Çevrim içi',
  hybrid: 'Hibrit (fiziksel + çevrim içi)',
};

/** Etkinlik detayi ve hatirlatma (PROJECT_SPEC 6.1 ekran 18). */
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  const store = getStore();

  const view = store.getEventView(slug, viewer?.id ?? null);
  if (!view) notFound();

  const { event } = view;
  const isPast = new Date(event.endsAt).getTime() < Date.now();
  const base = `/events/${slug}`;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/explore/time" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />Ne zaman
        </Link>
      </p>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <CoverBadge seed={event.slug} glyph={event.emoji} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
            <p className="mt-1 text-fg-muted">{event.description}</p>
          </div>
          <Badge tone={isPast ? 'neutral' : 'accent'}>
            {isPast ? 'Gerçekleşti' : formatRelative(event.startsAt)}
          </Badge>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-fg-subtle">Ne zaman</dt>
            <dd className="font-medium">
              <time dateTime={event.startsAt}>{formatEventRange(event.startsAt, event.endsAt)}</time>
              <span className="block text-sm font-normal text-fg-muted">{formatWeekday(event.startsAt)}</span>
            </dd>
          </div>

          <div>
            <dt className="text-sm text-fg-subtle">Nerede</dt>
            <dd className="font-medium">
              {[view.provinceName, view.districtName].filter(Boolean).join(' / ') || 'Çevrim içi'}
              {event.venue ? <span className="block text-sm font-normal text-fg-muted">{event.venue}</span> : null}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-fg-subtle">Katılım biçimi</dt>
            <dd className="font-medium">{MODE_LABEL[event.mode]}</dd>
          </div>

          <div>
            <dt className="text-sm text-fg-subtle">Düzenleyen</dt>
            <dd className="font-medium">
              <Link href={view.organizerHref} className="underline">
                {view.organizerName}
              </Link>
            </dd>
          </div>

          {event.deadlineAt ? (
            <div>
              <dt className="text-sm text-fg-subtle">Son başvuru</dt>
              <dd className="font-medium">
                <time dateTime={event.deadlineAt}>{formatDate(event.deadlineAt)}</time>
                <span className="block text-sm font-normal text-fg-muted">
                  {formatRelative(event.deadlineAt)}
                </span>
              </dd>
            </div>
          ) : null}
        </dl>

        {event.onlineUrl ? (
          <p className="mt-3 text-sm text-fg-muted">
            Çevrim içi bağlantı demo amaçlıdır ve gerçek bir toplantıya gitmez.
          </p>
        ) : null}

        {!isPast ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {view.viewerReminder ? (
              <form action={cancelReminder}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="revalidate" value={base} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-success/50 bg-success-soft px-4 text-sm font-semibold text-success"
                >
                  <Icon name="check" size={15} /> Hatırlatma kurulu · kaldır
                </button>
              </form>
            ) : (
              <form action={createReminder}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="revalidate" value={base} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
                >
                  <span aria-hidden="true">🔔</span> Hatırlat
                </button>
              </form>
            )}

            <Link
              href="/notifications"
              className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
            >
              Bildirimlerim
            </Link>
          </div>
        ) : null}

        {view.viewerReminder ? (
          <p className="mt-3 text-sm text-fg-muted">
            Hatırlatma zamanı:{' '}
            <time dateTime={view.viewerReminder.remindAt}>{formatEventRange(view.viewerReminder.remindAt, view.viewerReminder.remindAt)}</time>
          </p>
        ) : null}
      </Card>

      {view.community ? (
        <section aria-labelledby="event-community">
          <SectionHeader title={<span id="event-community">Düzenleyen topluluk</span>} />
          <Link href={`/communities/${view.community.slug}`} className="card block p-4 hover:border-accent">
            <span className="font-medium">{view.community.name}</span>
          </Link>
        </section>
      ) : null}

      {view.topics.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {view.topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/explore?topic=${topic.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted hover:border-line-strong"
              >
                {topic.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <InfoNote icon="info">
        Bu etkinlik sentetik demo verisidir. Gerçek bir organizasyonu, mekânı veya tarihi temsil etmez.
      </InfoNote>
    </div>
  );
}
