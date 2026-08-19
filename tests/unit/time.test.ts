import { describe, expect, it } from 'vitest';

import {
  addDays,
  endOfIstanbulMonth,
  eventOverlaps,
  formatEventRange,
  formatRelative,
  isWithin,
  resolvePreset,
  startOfIstanbulDay,
  startOfIstanbulMonth,
  startOfIstanbulWeek,
  toIstanbulDateKey,
} from '@/lib/time';

/**
 * Zaman mantigi testleri (PROJECT_SPEC 7.5 / 17.7).
 *
 * Kritik urun kurali: her varlik kendi zaman alanini kullanir. "Gelecek"
 * gorunumu gecmis gonderileri kapsamamalı, "gecmis" gorunumu de gelecekteki
 * etkinlikleri getirmemelidir.
 */

// Salı, 18 Ağustos 2026, 12:00 Istanbul (UTC+3).
const NOW = new Date('2026-08-18T09:00:00Z');

describe('İstanbul gün sınırları', () => {
  it('gün başlangıcı yerel 00:00, yani UTC 21:00 (önceki gün)', () => {
    const start = startOfIstanbulDay(NOW);
    expect(start.toISOString()).toBe('2026-08-17T21:00:00.000Z');
  });

  it('yerel gece yarısından hemen sonrası aynı güne düşer', () => {
    const justAfterMidnight = new Date('2026-08-17T21:05:00Z');
    expect(startOfIstanbulDay(justAfterMidnight).toISOString()).toBe('2026-08-17T21:00:00.000Z');
  });

  it('yerel gece yarısından hemen öncesi bir önceki güne düşer', () => {
    const justBeforeMidnight = new Date('2026-08-17T20:55:00Z');
    expect(startOfIstanbulDay(justBeforeMidnight).toISOString()).toBe('2026-08-16T21:00:00.000Z');
  });

  it('hafta pazartesi başlar', () => {
    // 18 Ağustos 2026 salı; haftanın başı 17 Ağustos pazartesi.
    expect(startOfIstanbulWeek(NOW).toISOString()).toBe('2026-08-16T21:00:00.000Z');
  });

  it('ay sınırları doğru hesaplanır', () => {
    expect(startOfIstanbulMonth(NOW).toISOString()).toBe('2026-07-31T21:00:00.000Z');
    expect(endOfIstanbulMonth(NOW).toISOString()).toBe('2026-08-31T21:00:00.000Z');
  });

  it('tarih anahtarı yerel güne göre üretilir', () => {
    expect(toIstanbulDateKey(NOW)).toBe('2026-08-18');
    // UTC'de hâlâ 17 Ağustos ama İstanbul'da 18 Ağustos olmuş.
    expect(toIstanbulDateKey(new Date('2026-08-17T21:30:00Z'))).toBe('2026-08-18');
  });
});

describe('resolvePreset', () => {
  it('"bugün" tek günlük aralıktır', () => {
    const range = resolvePreset('today', NOW)!;
    expect(range.from.toISOString()).toBe('2026-08-17T21:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-08-18T21:00:00.000Z');
  });

  it('"tüm zamanlar" aralık üretmez', () => {
    expect(resolvePreset('all', NOW)).toBeNull();
  });

  it('"gelecek 30 gün" şu andan başlar: geçmiş içeriği kapsamaz', () => {
    const range = resolvePreset('next-30', NOW)!;
    expect(range.from.getTime()).toBe(NOW.getTime());
    expect(range.to.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('"son 30 gün" şu anda biter: gelecek etkinlikleri kapsamaz', () => {
    const range = resolvePreset('past-30', NOW)!;
    expect(range.to.getTime()).toBe(NOW.getTime());
    expect(range.from.getTime()).toBeLessThan(NOW.getTime());
  });

  it('gelecek ve geçmiş aralıkları çakışmaz', () => {
    const future = resolvePreset('next-30', NOW)!;
    const past = resolvePreset('past-30', NOW)!;
    expect(past.to.getTime()).toBeLessThanOrEqual(future.from.getTime());
  });

  it('özel aralıkta bitiş günü de dahildir', () => {
    const range = resolvePreset('custom', NOW, {
      from: new Date('2026-09-01T09:00:00Z'),
      to: new Date('2026-09-03T09:00:00Z'),
    })!;
    // 3 Eylül'ün tamamı dahil olmalı, yani üst sınır 4 Eylül 00:00 yerel.
    expect(range.to.toISOString()).toBe('2026-09-03T21:00:00.000Z');
  });

  it('eksik özel aralık null döner', () => {
    expect(resolvePreset('custom', NOW, { from: NOW })).toBeNull();
  });
});

describe('isWithin', () => {
  const range = resolvePreset('today', NOW)!;

  it('aralık yoksa her şey geçerlidir', () => {
    expect(isWithin(null, NOW)).toBe(true);
  });

  it('aralık içindeki anı kabul eder', () => {
    expect(isWithin(range, NOW)).toBe(true);
  });

  it('üst sınır hariçtir', () => {
    expect(isWithin(range, range.to)).toBe(false);
  });

  it('alt sınır dahildir', () => {
    expect(isWithin(range, range.from)).toBe(true);
  });
});

describe('eventOverlaps', () => {
  const range = { from: new Date('2026-09-01T00:00:00Z'), to: new Date('2026-09-08T00:00:00Z') };

  it('aralığın tamamen içindeki etkinlik geçerlidir', () => {
    expect(eventOverlaps(range, '2026-09-03T09:00:00Z', '2026-09-03T17:00:00Z')).toBe(true);
  });

  it('aralığı kapsayan uzun etkinlik geçerlidir', () => {
    expect(eventOverlaps(range, '2026-08-25T09:00:00Z', '2026-09-20T17:00:00Z')).toBe(true);
  });

  it('aralık başlamadan biten etkinlik dışarıdadır', () => {
    expect(eventOverlaps(range, '2026-08-20T09:00:00Z', '2026-08-21T17:00:00Z')).toBe(false);
  });

  it('aralık bittikten sonra başlayan etkinlik dışarıdadır', () => {
    expect(eventOverlaps(range, '2026-09-10T09:00:00Z', '2026-09-11T17:00:00Z')).toBe(false);
  });

  it('aralığın başına taşan çok günlü etkinlik yakalanır', () => {
    // Bu tam olarak "48 saatlik jam" senaryosu: başlangıç aralıktan önce.
    expect(eventOverlaps(range, '2026-08-31T18:00:00Z', '2026-09-02T18:00:00Z')).toBe(true);
  });
});

describe('biçimlendirme', () => {
  it('aynı gün süren etkinlik tek tarih ve iki saat gösterir', () => {
    const text = formatEventRange('2026-09-03T07:00:00Z', '2026-09-03T13:00:00Z');
    expect(text).toContain('3 Eylül 2026');
    expect(text).toMatch(/10:00-16:00/);
  });

  it('birden çok güne yayılan etkinlik iki tarih gösterir', () => {
    const text = formatEventRange('2026-09-03T15:00:00Z', '2026-09-05T15:00:00Z');
    expect(text).toContain('→');
  });

  it('göreli zaman geçmiş için "önce", gelecek için "sonra" der', () => {
    expect(formatRelative(new Date(NOW.getTime() - 3 * 3_600_000), NOW)).toBe('3 sa önce');
    expect(formatRelative(new Date(NOW.getTime() + 2 * 86_400_000), NOW)).toBe('2 gün sonra');
  });

  it('bir dakikadan yakın olaylar "az önce" der', () => {
    expect(formatRelative(new Date(NOW.getTime() - 5_000), NOW)).toBe('az önce');
  });
});

describe('addDays', () => {
  it('gün ekler ve çıkarır', () => {
    expect(addDays(NOW, 1).toISOString()).toBe('2026-08-19T09:00:00.000Z');
    expect(addDays(NOW, -1).toISOString()).toBe('2026-08-17T09:00:00.000Z');
  });
});
