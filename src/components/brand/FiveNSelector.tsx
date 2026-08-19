'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * 5N boyut secici (PROJECT_SPEC 4.4 / 17.18-4).
 *
 * Spec bu mekanigi olumsuz cumlelerle tarif ediyor, o yuzden once ne DEGIL:
 *   - Kesfet sayfasinin ustunde duran bes sabit buton degil.
 *   - Bes buyuk kart ya da surekli gorunen bir liste degil.
 *   - Tam cark/daire degil.
 *
 * Olmasi gereken: kapaliyken yalnizca N baglanti isareti gorunur. Isarete
 * basildiginda yaninda YARIM bir yay acilir, iki ucu saydamlasarak kaybolur.
 * Bes boyut ikonlariyla bu yayin uzerinde TASINIR; kullanici yayi mouse,
 * tekerlek, dokunma veya klavyeyle dondurur. Secim noktasina yaklasan oge
 * buyur, uclara yaklasanlar solar. Oge secim noktasina oturunca kisa bir
 * snap/confirm hali olusur, ardindan yay ve ogeler TAMAMEN kaybolur ve
 * secilen boyutun gercek islevsel paneli acilir. N isareti panelin uzerinde
 * erisilebilir kalir; tekrar basildiginda yarim secici yeniden acilir.
 *
 * Erisilebilirlik (spec 4.4/9 ve 8.3): ayni islev klavye ve dugmelerle
 * tamamlanabilir. Ogeler gercek <button>'dir, ok tuslari yayi dondurur,
 * Enter/Space secer, Escape kapatir ve odagi tetikleyiciye geri verir.
 * prefers-reduced-motion'da acilma, donme ve parcacik hareketi kalkar;
 * yerine sade bir state degisimi kalir.
 */

interface Dimension {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  href: string;
}

/** Spec 4.4/3'teki sira: Ne, Nerede, Ne zaman, Nasil, Neden. */
const DIMENSIONS: Dimension[] = [
  { id: 'ne', label: 'Ne', hint: 'Konular ve içerik', icon: 'search', href: '/explore' },
  { id: 'nerede', label: 'Nerede', hint: 'Harita', icon: 'mapPin', href: '/explore/map' },
  { id: 'nezaman', label: 'Ne zaman', hint: 'Zaman', icon: 'calendar', href: '/explore/time' },
  { id: 'nasil', label: 'Nasıl', hint: 'Kaynaklar', icon: 'book', href: '/explore/how' },
  { id: 'neden', label: 'Neden', hint: 'Motivasyon', icon: 'spark', href: '/explore/why' },
];

/** Yay yaricapi (px) ve yarim yayin acikligi (derece). Yarim yay: 180. */
const RADIUS = 104;
const ARC_SPAN = 180;
/**
 * Ogeler arasi acisal mesafe.
 *
 * ARC_SPAN / (n-1) = 45 derece secilirse bes oge yarim yayi TAM doldurur ve
 * iki uctaki oge her zaman tam olarak 0 opaklikta kalir - yani hicbir zaman
 * gorunmez. Daha dar bir adim ogeleri secim noktasinin cevresinde toplar;
 * uclara dogru solma korunur ama yay acildiginda birden fazla oge okunur.
 */
const STEP = 30;
/** Secim noktasi: isaretin tam sagi. */
const SELECT_ANGLE = 0;
/** Oge dairesinin yaricapi; capa kenetlemesinde pay olarak da kullanilir. */
const ITEM_RADIUS = 22;

const HINT_STORAGE_KEY = 'nsosyal-5n-selector-hint';

export function FiveNSelector({ className = '' }: { className?: string }) {
  const router = useRouter();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  /** Yayin donme ofseti (derece). 0 iken ilk oge secim noktasindadir. */
  const [rotation, setRotation] = useState(0);
  /** Secim onaylandiginda kisa sure yanan snap hali. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  /**
   * Yayin ekrandaki capasi. Secici sol gezinmenin icinde duruyor ve o kolon
   * `overflow-y: auto` tasiyor; overflow bir kirpma baglami yarattigi icin yay
   * kolonun disina TASAMIYORDU. Bu yuzden yay bir portal ile body'ye cizilir
   * ve isaretin ekran koordinatina sabitlenir.
   */
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Yay portal ile body'ye ciziliyor; "disari tiklama" kontrolu bu yuzden hem
  // tetikleyiciyi hem yayi saymak zorunda.
  const menuRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startY: number; startRotation: number } | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  // Capayi acilista ve pencere degistiginde olc.
  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Isaret ekranin tepesinde duruyor; yayin ust yarisi viewport disina
      // tasmasin diye capa dikeyde iceri cekilir. Yay gorsel olarak isarete
      // bagli kalir ama hicbir oge erisilemez hale gelmez.
      const margin = 16;
      const limit = RADIUS + ITEM_RADIUS + margin;
      setAnchor({
        x: Math.max(limit / 2, rect.left + rect.width / 2),
        y: Math.min(Math.max(rect.top + rect.height / 2, limit), window.innerHeight - limit),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  /** Secim noktasina en yakin oge. Donme ofsetinden hesaplanir. */
  const activeIndex = clampIndex(Math.round(-rotation / STEP));
  const active = DIMENSIONS[activeIndex];

  /**
   * Odagi secim noktasindaki ogeye tasi.
   *
   * Bu yalnizca konfor degil, islevin sarti: ok tuslarini dinleyen eleman yay
   * kabidir ve odak tetikleyici dugmede kalirsa tuslar oraya hic ulasmaz -
   * ArrowDown yayi dondurmek yerine SAYFAYI kaydirir. Odak yay icinde durunca
   * hem donme hem Enter/Escape klavyeden calisir (spec 4.4/9).
   */
  useEffect(() => {
    if (!open || !anchor) return;
    document.getElementById(`${menuId}-${DIMENSIONS[activeIndex].id}`)?.focus();
  }, [open, anchor, activeIndex, menuId]);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    setConfirming(null);
    dragRef.current = null;
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      setRotation(0);
      // Spec 4.4/8: ilk kullanimda tek cumlelik ipucu gosterilebilir, ama
      // kalici UI'a donusmemelidir. Bir kez gosterip isaretliyoruz.
      try {
        if (!window.localStorage.getItem(HINT_STORAGE_KEY)) {
          setShowHint(true);
          window.localStorage.setItem(HINT_STORAGE_KEY, 'seen');
        }
      } catch {
        // Depolama kapaliysa ipucu her acilista cikar; kalici UI olmaz.
      }
      return true;
    });
  }, []);

  /** Secimi tamamla: kisa snap, sonra yay kaybolur ve panel acilir. */
  const commit = useCallback(
    (dimension: Dimension) => {
      setConfirming(dimension.id);
      setShowHint(false);
      const delay = reducedMotion ? 0 : 170;
      window.setTimeout(() => {
        setOpen(false);
        setConfirming(null);
        router.push(dimension.href);
      }, delay);
    },
    [reducedMotion, router],
  );

  // Disari tiklamada kapat.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Escape kapatir ve odagi tetikleyiciye geri verir.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  function rotateBy(steps: number) {
    setRotation((current) => {
      const next = clampIndex(Math.round(-current / STEP) + steps);
      return -next * STEP;
    });
  }

  function onWheel(event: React.WheelEvent) {
    if (!open) return;
    event.preventDefault();
    rotateBy(event.deltaY > 0 ? 1 : -1);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (!open) return;
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startRotation: rotation };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // Dikey surukleme yayi dondurur; 1 oge ~48px.
    const delta = event.clientY - drag.startY;
    const raw = drag.startRotation - (delta / 48) * STEP;
    const index = clampIndex(Math.round(-raw / STEP));
    setRotation(-index * STEP);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onMenuKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      rotateBy(1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      rotateBy(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setRotation(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setRotation(-(DIMENSIONS.length - 1) * STEP);
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label="5N boyut seçici"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl text-accent transition-colors hover:bg-bg-hover"
      >
        <FiveNMark size={38} animated={open && !reducedMotion} />
      </button>

      {open && anchor
        ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="5N boyutları"
          aria-activedescendant={`${menuId}-${active.id}`}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="fixed z-50 h-0 w-0"
          style={{ left: anchor.x, top: anchor.y, touchAction: 'none' }}
        >
          {/*
            Yay sayfa icerigin uzerinde yuzuyor. Ince bir perde hem ogelerin
            kontrastini garanti eder hem de secicinin gecici bir katman
            oldugunu gosterir. Aciklama metni degildir; sadece zemin.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-bg/50"
            style={{ left: -anchor.x, top: -anchor.y, width: '100vw', height: '100vh' }}
          />

          {/* Yay izi. Iki ucu maskeyle saydamlasir (spec 4.4/2). */}
          <svg
            aria-hidden="true"
            width={RADIUS * 2 + 60}
            height={RADIUS * 2 + 60}
            viewBox={`0 0 ${RADIUS * 2 + 60} ${RADIUS * 2 + 60}`}
            className="pointer-events-none absolute"
            style={{ left: -(RADIUS + 30), top: -(RADIUS + 30) }}
          >
            <defs>
              <linearGradient id={`${menuId}-fade`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
                <stop offset="30%" stopColor="var(--accent)" stopOpacity="0.55" />
                <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={halfArcPath(RADIUS + 30, RADIUS + 30, RADIUS)}
              fill="none"
              stroke={`url(#${menuId}-fade)`}
              strokeWidth="1.5"
              strokeDasharray="3 7"
            />
          </svg>

          {DIMENSIONS.map((dimension, index) => {
            // Oge acisi secim noktasina GOREdir: aktif oge 0 derecede durur,
            // komsulari +/-STEP'te, uclara dogru gidenler ARC_SPAN/2'de tamamen
            // solup yaydan cikar. (Onceki surumde buraya -ARC_SPAN/2 ofseti
            // giriyordu; aktif oge -90 dereceye dusuyor ve opaklik 0 oldugu icin
            // secili oge GORUNMUYORDU.)
            const angle = index * STEP + rotation;
            const distance = Math.abs(angle - SELECT_ANGLE);
            const isActive = index === activeIndex;
            const isConfirming = confirming === dimension.id;

            // Uclara yaklasan ogeler solar; secim noktasindaki buyur. Yayin
            // disina cikan oge tamamen kaybolur (ve tiklanamaz olur); yayin
            // icinde kalan hicbir oge ise okunamayacak kadar solmaz.
            const withinArc = distance <= ARC_SPAN / 2;
            const opacity = withinArc ? Math.max(0.22, 1 - distance / (ARC_SPAN / 2)) : 0;
            const scale = isActive ? 1.16 : 0.9;

            const radians = (angle * Math.PI) / 180;
            const x = Math.cos(radians) * RADIUS;
            const y = Math.sin(radians) * RADIUS;

            return (
              <button
                key={dimension.id}
                id={`${menuId}-${dimension.id}`}
                type="button"
                role="menuitem"
                tabIndex={isActive ? 0 : -1}
                onClick={() => commit(dimension)}
                onFocus={() => setRotation(-index * STEP)}
                aria-label={`${dimension.label} — ${dimension.hint}`}
                className="absolute flex min-h-11 min-w-11 items-center justify-center rounded-full border bg-bg-raised text-fg shadow-pop outline-offset-2"
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  // Tamamen solmus oge tiklanamaz olmali.
                  pointerEvents: opacity < 0.2 ? 'none' : 'auto',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  borderWidth: isActive ? 2 : 1,
                  color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                  boxShadow: isConfirming ? '0 0 0 6px var(--accent-soft)' : undefined,
                  transition: reducedMotion
                    ? 'none'
                    : 'transform 150ms ease, opacity 150ms ease, box-shadow 120ms ease',
                }}
              >
                <Icon name={dimension.icon} size={20} />
              </button>
            );
          })}

          {/*
            Secim noktasindaki ogenin adi. Surekli gorunen bir liste degil:
            yalnizca tek bir etiket, yalnizca secici acikken (spec 4.4/5).
          */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute whitespace-nowrap rounded-full bg-bg-raised px-3 py-1.5 text-sm font-semibold text-accent ring-1 ring-[var(--accent-line)]"
            style={{ left: RADIUS + ITEM_RADIUS + 12, top: -16 }}
          >
            {active.label}
            <span className="ml-1.5 font-normal text-fg-subtle">{active.hint}</span>
          </p>

          {showHint ? (
            <p
              className="pointer-events-none absolute w-56 whitespace-normal rounded-xl bg-bg-raised px-3 py-2 text-xs text-fg-muted shadow-pop ring-1 ring-[var(--border)]"
              style={{ left: RADIUS + ITEM_RADIUS + 12, top: 34 }}
            >
              Yayı çevir, boyutu seç.
            </p>
          ) : null}
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function clampIndex(index: number): number {
  return Math.min(DIMENSIONS.length - 1, Math.max(0, index));
}

/**
 * Merkezi (cx, cy) olan, yukaridan asagiya saga bakan YARIM yay.
 * Tam daire degil: -90 dereceden +90 dereceye.
 */
function halfArcPath(cx: number, cy: number, r: number): string {
  const startX = cx + r * Math.cos((-90 * Math.PI) / 180);
  const startY = cy + r * Math.sin((-90 * Math.PI) / 180);
  const endX = cx + r * Math.cos((90 * Math.PI) / 180);
  const endY = cy + r * Math.sin((90 * Math.PI) / 180);
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}
