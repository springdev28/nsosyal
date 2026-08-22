/**
 * Yukleme siniri testleri, istemci formundan bagimsiz sunucu dogrulama
 * sozlesmesini sabitler. Burada dosya icerigi degil, kayittan once guvenle
 * olculebilen MIME ve byte sinirlari test edilir.
 */
import { describe, expect, it } from 'vitest';

import { MAX_VIDEO_BYTES, validateVideoUpload } from '@/lib/media/constraints';

describe('validateVideoUpload', () => {
  it('desteklenen video turlerini boyut siniri icinde kabul eder', () => {
    expect(validateVideoUpload({ type: 'video/mp4', size: 1024 })).toBeNull();
    expect(validateVideoUpload({ type: 'video/webm', size: MAX_VIDEO_BYTES })).toBeNull();
  });

  it('desteklenmeyen turu proje kaydi acilmadan reddeder', () => {
    expect(validateVideoUpload({ type: 'video/quicktime', size: 1024 })).toBe(
      'Yalnızca MP4 veya WebM video yükleyebilirsin.',
    );
  });

  it('50 MB ustundeki dosyayi proje kaydi acilmadan reddeder', () => {
    expect(validateVideoUpload({ type: 'video/mp4', size: MAX_VIDEO_BYTES + 1024 * 1024 })).toBe(
      'Dosya çok büyük (51 MB). Sınır 50 MB.',
    );
  });
});
