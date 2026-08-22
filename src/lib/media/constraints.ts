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

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const;
export const MAX_VIDEO_SECONDS = 90;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_POST_MEDIA = 4;
