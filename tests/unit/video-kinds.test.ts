import { describe, expect, it } from 'vitest';

import { isVideoKind, VIDEO_KIND_OPTIONS } from '@/lib/video/kinds';

describe('short-video categories', () => {
  it('keeps upload choices and feed filters on the complete unique category list', () => {
    expect(VIDEO_KIND_OPTIONS.map((option) => option.value)).toEqual([
      'gundelik',
      'pitch',
      'demo',
      'ilerleme',
      'nasil',
      'neden',
      'soru',
    ]);
    expect(new Set(VIDEO_KIND_OPTIONS.map((option) => option.value)).size).toBe(VIDEO_KIND_OPTIONS.length);
  });

  it('rejects values that a modified browser could submit', () => {
    expect(isVideoKind('demo')).toBe(true);
    expect(isVideoKind('sponsorlu')).toBe(false);
    expect(isVideoKind('')).toBe(false);
  });
});
