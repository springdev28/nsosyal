'use client';

import { useRef, useState } from 'react';

import type { Media } from '@/types/domain';

/**
 * Accessible short-video player used by `/video`. The fixed 9:16 stage keeps
 * every source inside a phone-shaped frame; `object-contain` preserves the full
 * picture and leaves unused space black instead of cropping it.
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
      <div data-video-stage="short" className="relative mx-auto aspect-[9/16] w-full max-w-[420px] bg-black">
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
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />
      </div>

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
