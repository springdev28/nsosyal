/**
 * Zaman yardimcilari - "Ne zaman" boyutu (PROJECT_SPEC 7.5).
 *
 * Veritabaninda her sey timestamptz olarak saklanir; kullaniciya Europe/Istanbul
 * saatiyle gosterilir. Turkiye 2016'dan beri yil boyunca UTC+03:00 kullanmakta ve
 * yaz saati uygulamamaktadir; bu nedenle gun sinirlarini sabit ofsetle hesaplamak
 * hem dogru hem de test edilebilir bir yaklasimdir.
 */

export const ISTANBUL_OFFSET_MINUTES = 180;
export const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

/** Onemli: her varlik kendi zaman alanini kullanir, alanlar birbirine karistirilmaz. */
export type TimePreset =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'next-7'
  | 'next-30'
  | 'past-30'
  | 'all'
  | 'custom';

export interface DateRange {
  /** Dahil. */
  from: Date;
  /** Haric (yarim acik aralik). */
  to: Date;
}

function shiftToIstanbul(date: Date): Date {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MINUTES * 60_000);
}

function shiftFromIstanbul(date: Date): Date {
  return new Date(date.getTime() - ISTANBUL_OFFSET_MINUTES * 60_000);
}

/** Verilen anin Istanbul saatiyle gun baslangici (UTC olarak doner). */
export function startOfIstanbulDay(date: Date): Date {
  const local = shiftToIstanbul(date);
  local.setUTCHours(0, 0, 0, 0);
  return shiftFromIstanbul(local);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Istanbul saatine gore haftanin baslangici (Pazartesi). */
export function startOfIstanbulWeek(date: Date): Date {
  const dayStart = startOfIstanbulDay(date);
  const local = shiftToIstanbul(dayStart);
  // getUTCDay: 0 = Pazar. Pazartesi'yi hafta basi kabul ediyoruz.
  const weekday = (local.getUTCDay() + 6) % 7;
  return addDays(dayStart, -weekday);
}

export function startOfIstanbulMonth(date: Date): Date {
  const local = shiftToIstanbul(date);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return shiftFromIstanbul(local);
}

export function endOfIstanbulMonth(date: Date): Date {
  const local = shiftToIstanbul(date);
  local.setUTCMonth(local.getUTCMonth() + 1, 1);
  local.setUTCHours(0, 0, 0, 0);
  return shiftFromIstanbul(local);
}

/**
 * Hazir zaman araliklari.
 *
 * "Gelecek 30 gun" gecmise dogru aciklama yapmaz; gelecekte gerceklesecek
 * etkinlikleri, son tarihleri ve planlanmis demolari kapsar (PROJECT_SPEC 7.5).
 */
export function resolvePreset(preset: TimePreset, now: Date, custom?: Partial<DateRange>): DateRange | null {
  switch (preset) {
    case 'today': {
      const from = startOfIstanbulDay(now);
      return { from, to: addDays(from, 1) };
    }
    case 'this-week': {
      const from = startOfIstanbulWeek(now);
      return { from, to: addDays(from, 7) };
    }
    case 'this-month':
      return { from: startOfIstanbulMonth(now), to: endOfIstanbulMonth(now) };
    case 'next-7':
      return { from: now, to: addDays(startOfIstanbulDay(now), 8) };
    case 'next-30':
      return { from: now, to: addDays(startOfIstanbulDay(now), 31) };
    case 'past-30':
      return { from: addDays(startOfIstanbulDay(now), -30), to: now };
    case 'all':
      return null;
    case 'custom': {
      if (!custom?.from || !custom?.to) return null;
      // Bitis gunu de dahil olsun diye bir gun ekliyoruz.
      return { from: startOfIstanbulDay(custom.from), to: addDays(startOfIstanbulDay(custom.to), 1) };
    }
  }
}

export const PRESET_LABELS: Record<Exclude<TimePreset, 'custom'>, string> = {
  today: 'Bugün',
  'this-week': 'Bu hafta',
  'this-month': 'Bu ay',
  'next-7': 'Gelecek 7 gün',
  'next-30': 'Gelecek 30 gün',
  'past-30': 'Son 30 gün',
  all: 'Tüm zamanlar',
};

/** Bir anin araliga dusup dusmedigi. Aralik yoksa her sey gecerlidir. */
export function isWithin(range: DateRange | null, value: string | Date): boolean {
  if (!range) return true;
  const time = (typeof value === 'string' ? new Date(value) : value).getTime();
  return time >= range.from.getTime() && time < range.to.getTime();
}

/**
 * Etkinlik araliga dusuyor mu? Etkinlikler bir an degil bir sure kaplar:
 * baslangici aralik bittikten sonra ya da bitisi aralik baslamadan once ise disaridadir.
 */
export function eventOverlaps(range: DateRange | null, startsAt: string, endsAt: string): boolean {
  if (!range) return true;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  return start < range.to.getTime() && end >= range.from.getTime();
}

// --- Bicimlendirme --------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const weekdayFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: ISTANBUL_TIME_ZONE,
  weekday: 'long',
});

export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value));
export const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value));
export const formatTime = (value: string | Date) => timeFormatter.format(new Date(value));
export const formatWeekday = (value: string | Date) => weekdayFormatter.format(new Date(value));

/** Etkinlik zaman araligi: aynı gunse tek tarih + iki saat gosterilir. */
export function formatEventRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = startOfIstanbulDay(start).getTime() === startOfIstanbulDay(end).getTime();
  if (sameDay) {
    return `${formatDate(start)} · ${formatTime(start)}-${formatTime(end)}`;
  }
  return `${formatDateTime(start)} → ${formatDateTime(end)}`;
}

/** "3 saat önce" gibi goreli zaman. Gelecek icin "3 saat sonra". */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const target = new Date(value).getTime();
  const diffMs = target - now.getTime();
  const future = diffMs > 0;
  const abs = Math.abs(diffMs);

  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return future ? `${minutes} dk sonra` : `${minutes} dk önce`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return future ? `${hours} sa sonra` : `${hours} sa önce`;

  const days = Math.round(hours / 24);
  if (days < 30) return future ? `${days} gün sonra` : `${days} gün önce`;

  const months = Math.round(days / 30);
  if (months < 12) return future ? `${months} ay sonra` : `${months} ay önce`;

  const years = Math.round(months / 12);
  return future ? `${years} yıl sonra` : `${years} yıl önce`;
}

/** YYYY-MM-DD (Istanbul gunu). Gazete sayilari bu bicimi kullanir. */
export function toIstanbulDateKey(value: string | Date): string {
  const local = shiftToIstanbul(new Date(value));
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(
    local.getUTCDate(),
  ).padStart(2, '0')}`;
}
