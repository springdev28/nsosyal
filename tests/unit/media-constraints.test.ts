/**
 * Verifies the byte-level upload boundary without relying on a browser form.
 * These tests cover the exact bytes that Server Actions are allowed to persist.
 */
import { describe, expect, it } from 'vitest';

import {
  inspectImageUpload,
  inspectVideoUpload,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  validateVideoUpload,
} from '@/lib/media/constraints';

function mp4Box(type: string, payload: Uint8Array): Uint8Array {
  const box = Buffer.alloc(8 + payload.byteLength);
  box.writeUInt32BE(box.byteLength, 0);
  box.write(type, 4, 4, 'ascii');
  Buffer.from(payload).copy(box, 8);
  return box;
}

/** The fixture needs the `mvhd` duration read by the validator, not a video codec. */
function makeMp4(durationSeconds: number): Uint8Array {
  const timescale = 1_000;
  const movieHeader = Buffer.alloc(20);
  movieHeader.writeUInt32BE(timescale, 12);
  movieHeader.writeUInt32BE(Math.round(durationSeconds * timescale), 16);
  const fileType = mp4Box('ftyp', Buffer.from('isom\0\0\0\0', 'binary'));
  const movie = mp4Box('moov', mp4Box('mvhd', movieHeader));
  return Buffer.concat([fileType, movie]);
}

function ebmlElement(id: number[], payload: Uint8Array): Uint8Array {
  if (payload.byteLength > 126) throw new Error('Test EBML elemani tek byte boyutu asmamali.');
  return Buffer.concat([Buffer.from(id), Buffer.from([0x80 | payload.byteLength]), Buffer.from(payload)]);
}

/** WebM stores Duration in TimecodeScale units inside the Info element. */
function makeWebm(durationSeconds: number): Uint8Array {
  const scale = ebmlElement([0x2a, 0xd7, 0xb1], Buffer.from([0x0f, 0x42, 0x40]));
  const duration = Buffer.alloc(8);
  duration.writeDoubleBE(durationSeconds * 1_000);
  const info = ebmlElement([0x15, 0x49, 0xa9, 0x66], Buffer.concat([
    scale,
    ebmlElement([0x44, 0x89], duration),
  ]));
  return Buffer.concat([
    ebmlElement([0x1a, 0x45, 0xdf, 0xa3], Buffer.alloc(0)),
    ebmlElement([0x18, 0x53, 0x80, 0x67], info),
  ]);
}

function upload(bytes: Uint8Array, type: string, size = bytes.byteLength) {
  const owned = Uint8Array.from(bytes);
  return { type, size, arrayBuffer: async () => owned.buffer };
}

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

  it('90 saniyelik MP4 ve daha kisa WebM dosyasini kapsayicidan kabul eder', async () => {
    const mp4 = await inspectVideoUpload(upload(makeMp4(90), 'video/mp4'));
    const webm = await inspectVideoUpload(upload(makeWebm(89.5), 'video/webm'));

    expect(mp4).toMatchObject({ ok: true, durationSec: 90 });
    expect(webm).toMatchObject({ ok: true, durationSec: 89.5 });
  });

  it('90 saniyeyi asan videoyu istemci degerine guvenmeden reddeder', async () => {
    const result = await inspectVideoUpload(upload(makeMp4(90.01), 'video/mp4'));
    expect(result).toEqual({
      ok: false,
      error: 'Video 90 saniyeden uzun olamaz (91 saniye).',
    });
  });

  it('MIME ile kapsayici uyusmazsa veya sure yoksa guvenli tarafta kalir', async () => {
    const wrongContainer = await inspectVideoUpload(upload(makeMp4(40), 'video/webm'));
    const malformed = await inspectVideoUpload(upload(Buffer.from('not-a-video'), 'video/mp4'));
    expect(wrongContainer).toMatchObject({ ok: false, error: expect.stringContaining('süresi okunamadı') });
    expect(malformed).toMatchObject({ ok: false, error: expect.stringContaining('süresi okunamadı') });
  });

  it('bildirilen boyut ile okunan byte sayisi farkliysa dosyayi reddeder', async () => {
    const bytes = makeWebm(30);
    expect(await inspectVideoUpload(upload(bytes, 'video/webm', bytes.byteLength + 1))).toEqual({
      ok: false,
      error: 'Video dosyasının boyutu doğrulanamadı.',
    });
  });
});

describe('inspectImageUpload', () => {
  it('JPG, PNG ve WebP imzalarını bildirilen MIME türüyle kabul eder', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webp = Buffer.from('RIFF\x04\x00\x00\x00WEBP', 'binary');

    await expect(inspectImageUpload(upload(jpeg, 'image/jpeg'))).resolves.toMatchObject({ ok: true });
    await expect(inspectImageUpload(upload(png, 'image/png'))).resolves.toMatchObject({ ok: true });
    await expect(inspectImageUpload(upload(webp, 'image/webp'))).resolves.toMatchObject({ ok: true });
  });

  it('sahte MIME, değişen byte sayısı ve boyut aşımını yazmadan reddeder', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await expect(inspectImageUpload(upload(png, 'image/jpeg'))).resolves.toEqual({
      ok: false,
      error: 'Görsel içeriği seçilen dosya türüyle uyuşmuyor.',
    });
    await expect(inspectImageUpload(upload(png, 'image/png', png.byteLength + 1))).resolves.toEqual({
      ok: false,
      error: 'Görsel dosyasının boyutu doğrulanamadı.',
    });
    await expect(inspectImageUpload(upload(png, 'image/png', MAX_IMAGE_BYTES + 1))).resolves.toEqual({
      ok: false,
      error: 'Görsel dosyası 12 MB sınırını aşıyor.',
    });
  });
});
