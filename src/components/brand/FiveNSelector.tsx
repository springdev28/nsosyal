'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * 5N boyut secici (PROJECT_SPEC 4.4 / 17.18-4).
 *
 * Isim neden "5N", urun adi "nSosyal 5N1K" iken: 1K yani KIM, bir kesif paneli
 * degil sosyal kimlik katmanidir (spec 4.1) ve profil yuzeyinde yasar. Spec
 * 4.4/3 yayin uzerinde tasinacak ogeleri tek tek sayiyor ve bes tane: Ne,
 * Nerede, Ne zaman, Nasil, Neden. Bu yuzden secici bes oge tasir ve adi da
 * bunu soyler; baglam MODELININ tamami 5N1K'dir, secicinin tasidigi 5N'dir.
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

/**
 * Yay olculeri, tasarim dosyasindaki "5N Selector" bileseninden alindi
 * (QiXXYwqSFvcx2N2hHLw8DP, 18:186). Bilesende aktif oge secim noktasinda,
 * komsulari +/-54 derecede, uzaktakiler +/-102 derecede duruyor; yaricap
 * ~139px. Buradaki degerler o yerlesimi yeniden uretir.
 */
const RADIUS = 140;
const ARC_SPAN = 180;
/** Ogeler arasi acisal mesafe (tasarimda ~52 derece). */
const STEP = 52;

/**
 * Oge kademeleri. Tasarim ogeleri surekli bir formulle degil, secim
 * noktasindan kac adim uzakta olduklarina gore uc kademede gosteriyor:
 * aktif 48px/tam opak, komsu 34px/%50, uzak 28px/%12.
 */
const TIERS = [
  { size: 48, icon: 28, opacity: 1, border: 2 },
  { size: 34, icon: 20, opacity: 0.5, border: 1 },
  { size: 28, icon: 14, opacity: 0.12, border: 1 },
] as const;

/** Tasarimdaki nSosyal/Glow/SelectorActive efekti. */
const ACTIVE_GLOW = '0 0 16px 0 rgba(167,139,250,0.38)';
/** Tasarimdaki nSosyal/Glow/Brand efekti (N tetikleyicisi). */
const TRIGGER_GLOW = '0 0 36px 0 rgba(61,155,255,0.28), 0 0 18px 0 rgba(53,214,238,0.32)';
/** Oge dairesinin yaricapi; capa kenetlemesinde pay olarak da kullanilir. */
const ITEM_RADIUS = 24;

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
  const [anchor, setAnchor] = useState<{ x: number; y: number; radius: number } | null>(null);

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
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Yay ISARETIN YANINDA acilir (spec 4.4/2), yani capa isaretten
      // kaydirilamaz. Isaret ekranin tepesine yakinsa capayi tasimak yerine
      // yaricapi kisaltiyoruz: yay isarete bagli kalir, hicbir oge de
      // viewport disina dusmez.
      const room = Math.min(cy, window.innerHeight - cy) - ITEM_RADIUS - 12;
      setAnchor({ x: cx, y: cy, radius: Math.max(72, Math.min(RADIUS, room)) });
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
        style={open ? { boxShadow: TRIGGER_GLOW } : undefined}
      >
        <FiveNMark size={44} animated={open && !reducedMotion} />
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
          {/* Yay izi. Iki ucu maskeyle saydamlasir (spec 4.4/2). */}
          <svg
            aria-hidden="true"
            width={anchor.radius * 2 + 60}
            height={anchor.radius * 2 + 60}
            viewBox={`0 0 ${anchor.radius * 2 + 60} ${anchor.radius * 2 + 60}`}
            className="pointer-events-none absolute"
            style={{ left: -(anchor.radius + 30), top: -(anchor.radius + 30) }}
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
              d={halfArcPath(anchor.radius + 30, anchor.radius + 30, anchor.radius)}
              fill="none"
              stroke={`url(#${menuId}-fade)`}
              strokeWidth="1.5"
              strokeDasharray="3 7"
            />
          </svg>

          {DIMENSIONS.map((dimension, index) => {
            // Oge acisi secim noktasina GOREdir: aktif oge 0 derecede durur,
            // komsulari +/-STEP'te, uzaktakiler +/-2*STEP'te.
            const steps = index - activeIndex;
            const angle = steps * STEP;
            const tier = TIERS[Math.min(TIERS.length - 1, Math.abs(steps))];
            const isActive = steps === 0;
            const isConfirming = confirming === dimension.id;

            const radians = (angle * Math.PI) / 180;
            const x = Math.cos(radians) * anchor.radius;
            const y = Math.sin(radians) * anchor.radius;

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
                className="absolute flex items-center justify-center rounded-full border-solid bg-bg-raised outline-offset-2"
                style={{
                  left: x,
                  top: y,
                  width: tier.size,
                  height: tier.size,
                  transform: 'translate(-50%, -50%)',
                  opacity: tier.opacity,
                  // Tasarimda uzak kademe %12 opaklikta; okunamayacak kadar
                  // soluk olan bir hedefi tiklanabilir birakmiyoruz.
                  pointerEvents: tier.opacity < 0.2 ? 'none' : 'auto',
                  borderWidth: tier.border,
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  boxShadow: isActive || isConfirming ? ACTIVE_GLOW : undefined,
                  transition: reducedMotion
                    ? 'none'
                    : 'left 180ms ease, top 180ms ease, width 180ms ease, height 180ms ease, opacity 180ms ease',
                }}
              >
                <Icon name={dimension.icon} size={tier.icon} />
              </button>
            );
          })}

          {/* Hizalama isareti: secim noktasini gosteren kisa cizgi. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-[3px] w-6 rounded-sm bg-accent"
            style={{
              left: anchor.radius + ITEM_RADIUS + 14,
              top: -1.5,
              boxShadow: ACTIVE_GLOW,
            }}
          />

          {/*
            Secim noktasindaki ogenin adi. Surekli gorunen bir liste degil:
            yalnizca tek bir etiket, yalnizca secici acikken (spec 4.4/5).
          */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute whitespace-nowrap text-[16px] font-semibold text-accent"
            style={{ left: anchor.radius + ITEM_RADIUS + 14, top: 22 }}
          >
            {active.label}
          </p>

          {showHint ? (
            <p
              className="pointer-events-none absolute w-56 whitespace-normal rounded-xl bg-bg-raised px-3 py-2 text-xs text-fg-muted shadow-pop ring-1 ring-[var(--border)]"
              style={{ left: anchor.radius + ITEM_RADIUS + 14, top: 54 }}
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
  const half = ARC_SPAN / 2;
  const startX = cx + r * Math.cos((-half * Math.PI) / 180);
  const startY = cy + r * Math.sin((-half * Math.PI) / 180);
  const endX = cx + r * Math.cos((half * Math.PI) / 180);
  const endY = cy + r * Math.sin((half * Math.PI) / 180);
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}
