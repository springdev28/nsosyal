/**
 * Shared upload limits for the browser forms and Server Actions.
 *
 * Browser checks provide quick feedback. The inspection functions below are
 * the security boundary because they read the bytes again on the server.
 */

import { readVideoDurationSeconds } from '@/lib/media/duration';

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;
export const MAX_VIDEO_SECONDS = 90;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_POST_MEDIA = 4;

export type VideoUploadInspection =
  | { ok: true; bytes: Uint8Array; durationSec: number }
  | { ok: false; error: string };

export type ImageUploadInspection =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; error: string };

/**
 * Performs the cheap video metadata checks before reading the whole file.
 * Container duration and reported byte length are checked by inspectVideoUpload.
 */
export function validateVideoUpload(file: Pick<File, 'size' | 'type'>): string | null {
  if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
    return 'Yalnızca MP4 veya WebM video yükleyebilirsin.';
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = Math.round(file.size / (1024 * 1024));
    return `Dosya çok büyük (${mb} MB). Sınır 50 MB.`;
  }
  return null;
}

/**
 * Reads a video once and returns the exact bytes that may be written.
 * This keeps duration validation and persistence on the same byte sequence.
 */
export async function inspectVideoUpload(
  file: Pick<File, 'arrayBuffer' | 'size' | 'type'>,
): Promise<VideoUploadInspection> {
  const metadataError = validateVideoUpload(file);
  if (metadataError) return { ok: false, error: metadataError };

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, error: 'Video dosyası okunamadı. Tekrar seçip yeniden dene.' };
  }
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_VIDEO_BYTES) {
    return { ok: false, error: 'Video dosyasının boyutu doğrulanamadı.' };
  }

  const durationSec = readVideoDurationSeconds(bytes, file.type);
  if (durationSec === null) {
    return {
      ok: false,
      error: 'Video süresi okunamadı. Geçerli bir MP4 veya WebM dosyası yükle.',
    };
  }
  if (durationSec > MAX_VIDEO_SECONDS) {
    return {
      ok: false,
      error: `Video ${MAX_VIDEO_SECONDS} saniyeden uzun olamaz (${Math.ceil(durationSec)} saniye).`,
    };
  }

  return { ok: true, bytes, durationSec: Math.round(durationSec * 100) / 100 };
}

function hasBytes(bytes: Uint8Array, offset: number, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function imageBytesMatchMime(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return hasBytes(bytes, 0, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/png') {
    return hasBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === 'image/webp') {
    return hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46])
      && hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50]);
  }
  return false;
}

/**
 * Verifies an image MIME claim against its file signature and reported size.
 * The returned bytes are the only bytes the upload action is allowed to write.
 */
export async function inspectImageUpload(
  file: Pick<File, 'arrayBuffer' | 'size' | 'type'>,
): Promise<ImageUploadInspection> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'Yalnızca JPG, PNG veya WebP görsel yükleyebilirsin.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Görsel dosyası 12 MB sınırını aşıyor.' };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, error: 'Görsel dosyası okunamadı. Tekrar seçip yeniden dene.' };
  }
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Görsel dosyasının boyutu doğrulanamadı.' };
  }
  if (!imageBytesMatchMime(bytes, file.type)) {
    return { ok: false, error: 'Görsel içeriği seçilen dosya türüyle uyuşmuyor.' };
  }

  return { ok: true, bytes };
}
