/**
 * Yukleme sinirlari (PROJECT_SPEC 7.2 / 11.3).
 *
 * Bu degerler hem istemci tarafinda hizli geri bildirim icin hem de sunucu
 * tarafinda gercek dogrulama icin kullanilir. Istemci kontrolu bir kolaylik,
 * sunucu kontrolu ise guvenlik sinirdir.
 *
 * Ayri bir modulde durmalarinin nedeni: 'use server' dosyalarindan yalnizca
 * async fonksiyon disa aktarilabilir, sabit disa aktarilamaz.
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

/**
 * Dosya turu ve boyutu, proje kaydi acilmadan once ayni kuralla denetlenir.
 * Boylece bozuk bir pitch denemesi yarim proje veya tekrar denemede kopya proje
 * birakmaz. Icerik suresi asagidaki asenkron denetimde ayrica okunur.
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
 * Dosyayi bir kez okuyup hem gercek kapsayici suresini hem yazilacak byte'lari
 * dondurur. Action'in dogrulama sonrasi dosyayi yeniden okumasini ve iki farkli
 * byte dizisi arasinda tutarsizlik olusmasini engeller.
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
