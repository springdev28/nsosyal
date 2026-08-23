/**
 * Shared short-video categories used by Composer, the create-post Server Action,
 * and the `/video` feed. Keeping one list prevents upload labels and filters from
 * drifting apart while the action still validates browser-submitted values.
 */
import type { Post } from '@/types/domain';

export type VideoKind = NonNullable<Post['videoKind']>;

export const VIDEO_KIND_OPTIONS = [
  { value: 'gundelik', label: 'Gündelik' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'demo', label: 'Demo' },
  { value: 'ilerleme', label: 'İlerleme' },
  { value: 'nasil', label: 'Nasıl' },
  { value: 'neden', label: 'Neden' },
  { value: 'soru', label: 'Soru' },
] as const satisfies ReadonlyArray<{ value: VideoKind; label: string }>;

export function isVideoKind(value: string): value is VideoKind {
  return VIDEO_KIND_OPTIONS.some((option) => option.value === value);
}
