import Link from 'next/link';

import { IstanbulClock } from '@/components/time/IstanbulClock';
import { Icon } from '@/components/ui/Icon';
import { toIstanbulDateKey } from '@/lib/time';

/**
 * Sayi takvimi (PROJECT_SPEC 7.9).
 *
 * Onceki surumde gazetenin gecmisine erisim UC adet tarih rozetiydi. Gercek bir
 * gazetede okuyucu bir gune tiklayip o gunun sayisini acar; ustelik varsayilan
 * her zaman BUGUNDUR. Bu bilesen ay takvimini cizer, sayisi olan gunleri
 * baglanti yapar, bugunu isaretler ve sayisi olmayan gunleri devre disi
 * birakir - renk tek basina tasiyici degildir, durumu metin de soyler.
 *
 * Sunucu bileseni: veriyi sayfa yukler, burada yalnizca gorunum var.
 */

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'] as const;
const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

/** `YYYY-AA` -> o ayin ilk gunu. Yerel saat diliminden bagimsiz calisir. */
function monthStart(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
}

function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = monthStart(month);
  const next = new Date(Date.UTC(year, monthIndex + delta, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function IssueCalendar({
  /** Gosterilecek ay, `YYYY-AA`. */
  month,
  /** Sayisi olan gunler (`YYYY-AA-GG`) ve varsa tema adlari. */
  issueDates,
  themeByDate,
  /** Su an acik olan sayinin tarihi. */
  activeDate,
  /** Aylar arasi gezinmenin hangi aylara izin verecegini sinirlar. */
  earliestMonth,
  latestMonth,
}: {
  month: string;
  issueDates: ReadonlySet<string>;
  themeByDate: Readonly<Record<string, string | null>>;
  activeDate: string;
  earliestMonth: string;
  latestMonth: string;
}) {
  const { year, monthIndex } = monthStart(month);
  const today = toIstanbulDateKey(new Date());

  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  // Pazartesi ile baslayan hafta: JS'te Pazar 0'dir.
  const leading = (first.getUTCDay() + 6) % 7;

  const cells: Array<string | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) =>
        `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
    ),
  ];

  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoBack = previous >= earliestMonth;
  const canGoForward = next <= latestMonth;

  return (
    <nav
      aria-label="Gazete arşivi takvimi"
      className="mx-auto w-full max-w-3xl"
    >
      <details className="group rounded-2xl border border-line bg-bg-raised shadow-sm">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 text-sm transition-colors hover:bg-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <Icon name="calendar" size={19} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">Bugün · <IstanbulClock /></span>
            <span className="block truncate text-xs text-fg-subtle">Arşivde açık sayı: {activeDate}</span>
          </span>
          <span className="shrink-0 font-semibold text-accent group-open:hidden">Takvimi aç</span>
          <span className="hidden shrink-0 font-semibold text-accent group-open:inline">Takvimi kapat</span>
        </summary>

        <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <MonthLink
          href={`/newspaper?ay=${previous}&date=${activeDate}`}
          enabled={canGoBack}
          label="Önceki ay"
          glyph="‹"
        />
        <h2 className="text-sm font-semibold">
          {MONTHS[monthIndex]} {year}
        </h2>
        <MonthLink
          href={`/newspaper?ay=${next}&date=${activeDate}`}
          enabled={canGoForward}
          label="Sonraki ay"
          glyph="›"
        />
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <caption className="sr-only">
          Sayısı olan günler bağlantıdır; sayısı olmayan günler seçilemez.
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day} scope="col" className="pb-1 text-[0.65rem] font-medium text-fg-subtle">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((date, index) => (
                <td key={date ?? `bos-${index}`} className="p-0">
                  {date ? (
                    <DayCell
                      date={date}
                      month={month}
                      hasIssue={issueDates.has(date)}
                      theme={themeByDate[date] ?? null}
                      isToday={date === today}
                      isActive={date === activeDate}
                    />
                  ) : (
                    <span className="block h-9" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </details>
    </nav>
  );
}

function MonthLink({
  href,
  enabled,
  label,
  glyph,
}: {
  href: string;
  enabled: boolean;
  label: string;
  glyph: string;
}) {
  if (!enabled) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-subtle opacity-40"
      >
        {glyph}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg-muted transition-colors hover:border-line-strong hover:bg-bg-hover"
    >
      <span aria-hidden="true">{glyph}</span>
    </Link>
  );
}

function DayCell({
  date,
  month,
  hasIssue,
  theme,
  isToday,
  isActive,
}: {
  date: string;
  month: string;
  hasIssue: boolean;
  theme: string | null;
  isToday: boolean;
  isActive: boolean;
}) {
  const day = Number(date.slice(8));

  if (!hasIssue) {
    return (
      <span
        className={`block h-9 rounded-lg text-sm leading-9 text-fg-subtle ${
          isToday ? 'ring-1 ring-[var(--border-strong)]' : ''
        }`}
        // Sayisi olmayan gun bir baglanti degildir; ekran okuyucuya da oyle
        // duyurulur, yalnizca soluk gorunmesine birakilmaz.
        aria-label={`${day} — sayı yok`}
      >
        {day}
      </span>
    );
  }

  // Durum yalnizca renkle degil metinle de tasinir (8.3 / WCAG 1.4.1).
  const state = [
    isActive ? 'açık sayı' : null,
    isToday ? 'bugün' : null,
    theme ? `${theme} özel sayısı` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      href={`/newspaper?date=${date}&ay=${month}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={state ? `${day} — ${state}` : `${day} — sayıyı aç`}
      className={`relative block h-9 rounded-lg text-sm leading-9 transition-colors ${
        isActive
          ? 'bg-accent font-bold text-accent-fg'
          : 'bg-bg-sunken font-medium text-fg hover:bg-bg-hover'
      } ${isToday && !isActive ? 'ring-2 ring-accent' : ''}`}
    >
      {day}
      {theme ? (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0.5 mx-auto block h-1 w-1 rounded-full ${
            isActive ? 'bg-accent-fg' : 'bg-accent'
          }`}
        />
      ) : null}
    </Link>
  );
}
