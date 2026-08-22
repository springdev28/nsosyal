/**
 * Etkinlik ViewModel'ini zaman, konum ve hatirlatma eylemiyle sunar. Hatirlatma
 * durumu kart icinde tutulmaz; Server Action sonrasi sunucu verisi yenilenir.
 */
import Link from 'next/link';

import { cancelReminder, createReminder } from '@/actions/social';
import { Badge, Icon } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
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
    <article className="card p-4 transition-colors hover:border-accent-line">
      <div className="flex items-start gap-3">
        <CoverBadge seed={event.slug} glyph={event.emoji} size={48} />

        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug">
            <Link href={`/events/${event.slug}`} className="hover:text-accent">
              {event.title}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={14} />
              <time dateTime={event.startsAt}>{formatEventRange(event.startsAt, event.endsAt)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name={event.mode === 'online' ? 'globe' : 'mapPin'} size={14} />
              {place || (event.mode === 'online' ? 'Çevrim içi' : 'Konum belirtilmemiş')}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={isPast ? 'neutral' : 'accent'}>
            {isPast ? 'Gerçekleşti' : formatRelative(event.startsAt)}
          </Badge>
          <Badge tone="neutral">{MODE_LABEL[event.mode]}</Badge>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-fg-muted">{event.description}</p>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-fg-subtle">
        <Link href={view.organizerHref} className="hover:text-accent">
          {view.organizerName}
        </Link>
        {event.venue ? <span>· {event.venue}</span> : null}
        {event.deadlineAt && !isPast ? (
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} />
            Son başvuru <time dateTime={event.deadlineAt}>{formatRelative(event.deadlineAt)}</time>
          </span>
        ) : null}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!isPast ? (
          view.viewerReminder ? (
            <form action={cancelReminder}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-success-soft px-4 text-sm font-semibold text-success ring-1 ring-current/40"
              >
                <Icon name="check" size={15} />
                Hatırlatma kurulu · kaldır
              </button>
            </form>
          ) : (
            <form action={createReminder}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="btn-gradient inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm"
              >
                <Icon name="bell" size={15} />
                Hatırlat
              </button>
            </form>
          )
        ) : null}

        <Link
          href={`/events/${event.slug}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-fg-muted ring-1 ring-[var(--border)] transition-colors hover:bg-bg-hover hover:text-fg"
        >
          {isPast ? 'Etkinlik sayfası' : 'Ayrıntılar'}
          <Icon name="chevronRight" size={15} />
        </Link>
      </div>
    </article>
  );
}
