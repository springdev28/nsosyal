'use client';

import { useRef, useState } from 'react';

import type { Media } from '@/types/domain';

/**
 * Kisa video oynatici (PROJECT_SPEC 7.2).
 *
 * Prototipte transcode/CDN altyapisi yoktur: dosya dogrudan oynatilir.
 * Erisilebilirlik gerekleri:
 * - Otomatik oynatma sessizdir, ses yalnizca kullanici etkilesimiyle acilir.
 * - Tarayicinin yerel kontrolleri acik kalir (klavye ile kullanilabilir).
 * - Her videonun bir metin karsiligi (transkript ozeti) gosterilebilir.
 */
export function VideoPlayer({
  media,
  className = '',
  autoPlay = false,
}: {
  media: Media;
  className?: string;
  autoPlay?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`rounded-xl border border-line bg-bg-sunken p-4 ${className}`}>
        <p className="text-sm font-medium">Video yüklenemedi.</p>
        <p className="mt-1 text-sm text-fg-muted">{media.altText}</p>
      </div>
    );
  }

  return (
    <figure className={`overflow-hidden rounded-xl border border-line bg-ink-950 ${className}`}>
      <video
        ref={videoRef}
        src={media.storagePath}
        poster={media.posterPath ?? undefined}
        controls
        playsInline
        loop
        muted={autoPlay}
        autoPlay={autoPlay}
        preload="metadata"
        onError={() => setFailed(true)}
        aria-label={media.caption}
        className="mx-auto max-h-[70dvh] w-full bg-ink-950 object-contain"
      />

      <figcaption className="bg-bg-raised px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{media.caption}</p>
          <button
            type="button"
            onClick={() => setShowTranscript((value) => !value)}
            aria-expanded={showTranscript}
            className="inline-flex min-h-9 items-center rounded-lg border border-line px-2.5 text-xs font-semibold text-fg-muted hover:bg-bg-sunken"
          >
            {showTranscript ? 'Metni gizle' : 'Metin karşılığı'}
          </button>
        </div>
        {showTranscript ? <p className="mt-2 text-sm text-fg-muted">{media.altText}</p> : null}
      </figcaption>
    </figure>
  );
}
