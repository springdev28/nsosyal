import Link from 'next/link';

import { cancelReminder, createReminder } from '@/actions/social';
import { Badge, Card } from '@/components/ui';
import { formatEventRange, formatRelative } from '@/lib/time';
import type { EventView } from '@/types/view';

const MODE_LABEL: Record<string, string> = {
  physical: 'Fiziksel',
  online: 'Çevrim içi',
  hybrid: 'Hibrit',
};

/**
 * Etkinlik karti ve hatirlatma kontrolu (PROJECT_SPEC 6.3 adim 6, 17.7).
 * Gecmis etkinliklerde hatirlatma gosterilmez; bunun yerine sonuc baglantisi verilir.
 */
export function EventCard({ view, revalidate }: { view: EventView; revalidate: string }) {
  const { event } = view;
  const isPast = new Date(event.endsAt).getTime() < Date.now();
  const place = [view.provinceName, view.districtName].filter(Boolean).join(' / ');

  return (
    <Card as="article" className="p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl">
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <Link href={`/events/${event.slug}`} className="hover:underline">
              {event.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-fg-muted">
            <time dateTime={event.startsAt}>{formatEventRange(event.startsAt, event.endsAt)}</time>
          </p>
          <p className="mt-0.5 text-sm text-fg-subtle">
            {place || (event.mode === 'online' ? 'Çevrim içi' : 'Konum belirtilmemiş')}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge tone={isPast ? 'neutral' : 'accent'}>
            {isPast ? 'Gerçekleşti' : formatRelative(event.startsAt)}
          </Badge>
          <Badge tone="neutral">{MODE_LABEL[event.mode]}</Badge>
        </div>
      </div>

      <p className="mt-3 text-sm text-fg-muted">{event.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <Link href={view.organizerHref} className="text-fg-muted hover:underline">
          Düzenleyen: <span className="font-medium text-fg">{view.organizerName}</span>
        </Link>

        {event.deadlineAt && !isPast ? (
          <span className="text-fg-subtle">
            · Son başvuru <time dateTime={event.deadlineAt}>{formatRelative(event.deadlineAt)}</time>
          </span>
        ) : null}
      </div>

      {!isPast ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {view.viewerReminder ? (
            <form action={cancelReminder}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-success/50 bg-success-soft px-3 text-sm font-semibold text-success"
              >
                <span aria-hidden="true">✓</span> Hatırlatma kurulu · kaldır
              </button>
            </form>
          ) : (
            <form action={createReminder}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
              >
                <span aria-hidden="true">🔔</span> Hatırlat
              </button>
            </form>
          )}

          <Link
            href={`/events/${event.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
          >
            Ayrıntılar
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
          >
            Etkinlik sayfası
          </Link>
        </div>
      )}
    </Card>
  );
}
