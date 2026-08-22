'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Avatar } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import type { PostView } from '@/types/view';

const IMAGE_DURATION_MS = 6_000;

/**
 * Ana akistaki gorsel ve video hikayeleri.
 *
 * Hikaye seridi Neden panosuna baglanmaz. Akistaki medya gonderilerini kisa,
 * tam ekran bir izleyicide sunar; boylece ayni medya ve erisilebilir metin
 * ikinci bir veri modelinde kopyalanmaz.
 */
export function StoryRail({ stories }: { stories: PostView[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const progressRef = useRef(0);

  const active = activeIndex === null ? null : stories[activeIndex] ?? null;
  const activeMedia = active?.media[0] ?? null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const close = useCallback(() => {
    setActiveIndex(null);
    progressRef.current = 0;
    setProgress(0);
    setPaused(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const move = useCallback(
    (direction: 1 | -1) => {
      if (activeIndex === null) return;
      const next = activeIndex + direction;
      if (next < 0 || next >= stories.length) {
        close();
        return;
      }
      setActiveIndex(next);
      progressRef.current = 0;
      setProgress(0);
      setPaused(false);
    },
    [activeIndex, close, stories.length],
  );

  useEffect(() => {
    if (activeIndex === null) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === ' ') {
        event.preventDefault();
        setPaused((value) => !value);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, close, move]);

  useEffect(() => {
    if (!activeMedia || activeMedia.mediaType !== 'image' || paused || reducedMotion) return;
    const startedAt = performance.now() - progressRef.current * IMAGE_DURATION_MS;
    const timer = window.setInterval(() => {
      const next = Math.min(1, (performance.now() - startedAt) / IMAGE_DURATION_MS);
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) {
        window.clearInterval(timer);
        move(1);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [activeMedia, move, paused, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else void video.play().catch(() => undefined);
  }, [paused]);

  function open(index: number, trigger: HTMLButtonElement) {
    returnFocusRef.current = trigger;
    setActiveIndex(index);
    progressRef.current = 0;
    setProgress(0);
    setPaused(false);
  }

  return (
    <section aria-labelledby="story-rail-title" className="mb-4 border-b border-line px-1 pb-4 sm:px-3">
      <h2 id="story-rail-title" className="sr-only">Hikâyeler</h2>
      <div className="story-strip scroll-x flex gap-3 pb-2" role="group" tabIndex={0} aria-label="Hikâyeler">
        <label
          htmlFor="composer-media"
          className="group flex w-[4.75rem] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl py-1 text-center text-xs text-fg-muted"
        >
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-accent bg-accent-soft text-accent transition-colors group-hover:bg-bg-hover">
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </span>
          <span className="line-clamp-2">Hikâye ekle</span>
        </label>

        {stories.map((view, index) => {
          const media = view.media[0];
          if (!media) return null;
          return (
            <button
              key={view.post.id}
              type="button"
              onClick={(event) => open(index, event.currentTarget)}
              className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-xl py-1 text-center text-xs text-fg-muted"
              aria-label={`${view.author.displayName} hikâyesini aç`}
            >
              <span className="story-ring relative rounded-full p-[3px] transition-transform group-hover:scale-105">
                <span className="block rounded-full bg-bg p-[2px]">
                  <Avatar profile={view.author} size={48} />
                </span>
                {media.mediaType === 'video' ? (
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-bg text-accent ring-2 ring-bg">
                    <Icon name="play" size={11} filled />
                  </span>
                ) : null}
              </span>
              <span className="line-clamp-2 leading-tight">{view.author.displayName}</span>
            </button>
          );
        })}
      </div>

      {mounted && active && activeMedia
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${active.author.displayName} hikâyesi`}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-0 sm:p-5"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) close();
              }}
            >
              <div className="relative flex h-dvh w-full max-w-[30rem] flex-col overflow-hidden bg-black shadow-2xl sm:h-[min(52rem,92dvh)] sm:rounded-[2rem] sm:ring-1 sm:ring-white/15">
                <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-3 pb-10 pt-3">
                  <div className="mb-3 flex gap-1" aria-label={`${activeIndex! + 1}/${stories.length}`}>
                    {stories.map((story, index) => (
                      <span key={story.post.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                        <span
                          className="block h-full origin-left rounded-full bg-white"
                          style={{
                            transform: `scaleX(${index < activeIndex! ? 1 : index === activeIndex ? progress : 0})`,
                            transition: reducedMotion ? 'none' : 'transform 80ms linear',
                          }}
                        />
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-white">
                    <Avatar profile={active.author} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{active.author.displayName}</p>
                      <p className="text-xs text-white/70">Demo hikâye</p>
                    </div>
                    {activeMedia.mediaType === 'video' ? (
                      <button
                        type="button"
                        onClick={() => setMuted((value) => !value)}
                        className="min-h-10 rounded-full px-3 text-xs font-semibold hover:bg-white/15"
                        aria-pressed={!muted}
                      >
                        {muted ? 'Sesi aç' : 'Sesi kapat'}
                      </button>
                    ) : null}
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={close}
                      className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15"
                      aria-label="Hikâyeyi kapat"
                    >
                      <Icon name="close" size={22} />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => move(-1)}
                  disabled={activeIndex === 0}
                  aria-label="Önceki hikâye"
                  className="absolute inset-y-24 left-0 z-10 w-1/3 cursor-w-resize disabled:cursor-default"
                />
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label={activeIndex === stories.length - 1 ? 'Hikâyeleri kapat' : 'Sonraki hikâye'}
                  className="absolute inset-y-24 right-0 z-10 w-1/3 cursor-e-resize"
                />

                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                  {activeMedia.mediaType === 'video' ? (
                    <video
                      key={activeMedia.id}
                      ref={videoRef}
                      src={activeMedia.storagePath}
                      poster={activeMedia.posterPath ?? undefined}
                      muted={muted}
                      autoPlay={!reducedMotion}
                      playsInline
                      onClick={() => setPaused((value) => !value)}
                      onTimeUpdate={(event) => {
                        const video = event.currentTarget;
                        if (video.duration) {
                          progressRef.current = video.currentTime / video.duration;
                          setProgress(progressRef.current);
                        }
                      }}
                      onEnded={() => move(1)}
                      className="h-full w-full object-cover"
                      aria-label={activeMedia.altText}
                    />
                  ) : (
                    // Sentetik demo gorselleri yerel dosyadir; uzak resim kaynagi yoktur.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeMedia.storagePath}
                      alt={activeMedia.altText}
                      className="h-full w-full object-cover"
                    />
                  )}

                  {paused ? (
                    <button
                      type="button"
                      onClick={() => setPaused(false)}
                      className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30"
                      aria-label="Hikâyeyi sürdür"
                    >
                      <Icon name="play" size={28} filled />
                    </button>
                  ) : null}
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-5 pb-6 pt-20 text-white">
                  <p className="line-clamp-3 text-[0.95rem] leading-relaxed">{active.post.body}</p>
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    className="mt-3 min-h-10 rounded-full bg-white/12 px-4 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/20"
                  >
                    {paused ? 'Sürdür' : 'Duraklat'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
