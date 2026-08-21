'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui';

/**
 * Gunun ilk oturumunda acilan gazete kapagi (PROJECT_SPEC 6.6 / 7.9).
 *
 * Kasitli olarak deneysel bir davranis: kapatma kontrolu 3 saniye sonra aktif
 * olur ve bu kullanilabilirlik testinde olculecektir. Erisilebilirlik tercihi
 * (prefers-reduced-motion veya ayarlardaki gecersiz kilma) varsa bekleme
 * UYGULANMAZ; bu durumda `closeDelaySeconds` 0 gelir.
 *
 * Erisilebilirlik: odak modala hapsedilir, Esc kapatir (bekleme bittiginde),
 * geri sayim aria-live ile duyurulur.
 */
export function NewspaperAutoOpen({
  issueDate,
  title,
  standfirst,
  leadTitle,
  closeDelaySeconds,
}: {
  issueDate: string;
  title: string;
  standfirst: string;
  leadTitle: string;
  closeDelaySeconds: number;
}) {
  const [open, setOpen] = useState(true);
  const [remaining, setRemaining] = useState(closeDelaySeconds);
  /**
   * Geri sayim YALNIZCA tarayicida isliyor, ama kapatma dugmeleri sunucudan
   * `disabled` olarak geliyordu. Hydration gecikirse ya da basarisiz olursa
   * `remaining` hic azalmaz ve modal kapanmaz: kullanici tam ekran bir kapagin
   * arkasinda kilitli kalir. Render'in ucretsiz katmaninda uyanma suresi bunu
   * gercek bir duvara cevirdi.
   *
   * Bu yuzden kilit ancak JavaScript'in calistigi DOGRULANDIKTAN sonra uygulanir.
   * Deneysel bekleme korunur; kacis yolu her kosulda acik kalir.
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const locked = hydrated && remaining > 0;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Sistem tercihi de beklemeyi kaldirir; ayar cerezi tek yol degil.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setRemaining(0);
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0) closeRef.current?.focus();
  }, [remaining]);

  function dismiss() {
    if (locked) return;
    // Bugun icin gorulmus olarak isaretle; ayni gun tekrar acilmasin.
    document.cookie = `nsosyal_newspaper_seen=${issueDate}; path=/; max-age=86400; samesite=lax`;
    setOpen(false);
  }

  // Odak tuzagi ve Esc.
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;

    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
    // dismiss kimligi degisse de davranis ayni; bagimlilik listesini sade tutuyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, remaining]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newspaper-modal-title"
        aria-describedby="newspaper-modal-desc"
        className="card max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-[var(--radius-card)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent"
            >
              <Icon name="newspaper" size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Günün sayısı</p>
              <h2 id="newspaper-modal-title" className="text-xl font-bold">
                {title}
              </h2>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={dismiss}
            disabled={locked}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-[var(--border)] transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            {locked ? (
              <span aria-hidden="true">{remaining}</span>
            ) : (
              <Icon name="close" size={18} aria-hidden="true" />
            )}
            <span className="sr-only">{locked ? `${remaining} saniye sonra kapatılabilir` : 'Kapat'}</span>
          </button>
        </div>

        <p id="newspaper-modal-desc" className="mt-3 text-fg-muted">
          {standfirst}
        </p>

        {leadTitle ? (
          <p className="mt-4 rounded-2xl bg-bg-sunken p-3.5 font-serif text-lg leading-snug ring-1 ring-[var(--border)]">
            {leadTitle}
          </p>
        ) : null}

        <p className="mt-3 rounded-xl border-l-2 border-signal-500 bg-signal-50 px-3 py-2 text-sm text-fg-muted dark:bg-signal-900/25">
          Turuncu şeritler, ilgi alanlarınla eşleşen haberleri gösterir.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/newspaper"
            onClick={dismiss}
            className="btn-gradient inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4"
          >
            Gazeteyi aç
          </Link>
          <button
            type="button"
            onClick={dismiss}
            disabled={locked}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-4 font-semibold ring-1 ring-[var(--border)] transition-colors hover:bg-bg-hover disabled:opacity-50"
          >
            Sonra
          </button>
        </div>

        <p aria-live="polite" className="mt-2 text-center text-xs text-fg-subtle">
          {locked
            ? `Kapatma ${remaining} saniye sonra aktif olacak.`
            : 'Kapatabilirsin. Bu bekleme davranışı kullanılabilirlik testinde ölçülüyor.'}
        </p>
      </div>
    </div>
  );
}
