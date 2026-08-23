'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useReducedMotion } from '@/lib/browser-preferences';

/**
 * Interactive half-arc for the five discovery routes. Mouse, touch, trackpad,
 * and keyboard all update one active index; committing navigates with Next's
 * router and closes the arc. Geometry rationale lives in decision 0012.
 */

interface Dimension {
  id: string;
  label: string;
  icon: IconName;
  href: string;
}

/** Product order: What, Where, When, How, Why. */
const DIMENSIONS: Dimension[] = [
  { id: 'ne', label: 'Ne', icon: 'search', href: '/explore' },
  { id: 'nerede', label: 'Nerede', icon: 'mapPin', href: '/explore/map' },
  { id: 'nezaman', label: 'Ne zaman', icon: 'calendar', href: '/explore/time' },
  { id: 'nasil', label: 'Nasıl', icon: 'book', href: '/explore/how' },
  { id: 'neden', label: 'Neden', icon: 'spark', href: '/explore/why' },
];

/** Radius of the half-disk anchored to the content edge. */
const PANEL_R = 188;
/** Radius followed by dimension buttons. */
const ORBIT_R = 128;
/** Button diameter, deliberately above the 44px touch target. */
const ITEM_D = 56;
/** Closed-loop spacing that keeps the three central choices readable. */
const STEP = 40;
/** Fade window: choices disappear at the two ends of the half arc. */
const FADE_FROM = 34;
const FADE_TO = 90;

/** Hub diameter; it rests inside the straight edge instead of being clipped. */
const HUB_D = 72;

const BOX = PANEL_R * 2;
const CX = 0;
const CY = PANEL_R;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

/** Visible orbit segment between the two fading ends. */
const TRACK_PATH = (() => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x = (deg: number) => (CX + ORBIT_R * Math.cos(rad(deg))).toFixed(2);
  const y = (deg: number) => (CY + ORBIT_R * Math.sin(rad(deg))).toFixed(2);
  const end = FADE_TO - 0.01; // Exactly 90 degrees produces a degenerate SVG arc.
  return `M ${x(-end)} ${y(-end)} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${x(end)} ${y(end)}`;
})();

/** Returns the shortest signed distance around the closed dimension loop. */
function offsetAngle(index: number, activeIndex: number): number {
  const n = DIMENSIONS.length;
  let steps = (((index - activeIndex) % n) + n) % n;
  if (steps > n / 2) steps -= n;
  return steps * STEP;
}

/** Converts angle to opacity: 1 at the center and 0 outside the arc. */
function fadeFor(angle: number): number {
  const d = Math.abs(angle);
  if (d <= FADE_FROM) return 1;
  if (d >= FADE_TO) return 0;
  return 1 - (d - FADE_FROM) / (FADE_TO - FADE_FROM);
}

export function FiveNSelector({ className = '' }: { className?: string }) {
  const router = useRouter();
  const menuId = useId();

  const [open, setOpen] = useState(false);
  /** The active item always occupies the zero-degree selection point. */
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; y: number; from: number } | null>(null);
  /** Prevents the synthetic click after a drag from committing a route. */
  const draggedRef = useRef(false);
  const wheelRef = useRef(0);

  const active = DIMENSIONS[activeIndex];

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Anchor to the Explore content edge rather than the viewport edge, so
      // the arc stays attached to its trigger and clear of global navigation.
      setAnchor({
        // Clamp the straight edge so the half-disk cannot leave a narrow viewport.
        x: Math.min(Math.max(0, rect.left), Math.max(0, window.innerWidth - PANEL_R)),
        y: Math.min(
          Math.max(rect.top + rect.height / 2, PANEL_R + 8),
          window.innerHeight - PANEL_R - 8,
        ),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  // Lock background scrolling while pointer gestures operate the fixed arc.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    setConfirming(null);
    dragRef.current = null;
    // Discard an unfinished wheel gesture between openings.
    wheelRef.current = 0;
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    setOpen((was) => {
      if (was) return false;
      setActiveIndex(0);
      wheelRef.current = 0;
      return true;
    });
  }, []);

  const commit = useCallback(
    /** Gives a non-active choice enough time to snap into place before closing. */
    (dimension: Dimension, snapping = false) => {
      setConfirming(dimension.id);
      window.setTimeout(
        () => {
          setOpen(false);
          setConfirming(null);
          router.push(dimension.href);
        },
        reducedMotion ? 0 : snapping ? 280 : 170,
      );
    },
    [reducedMotion, router],
  );

  useEffect(() => {
    if (!open || !anchor) return;
    document.getElementById(`${menuId}-${DIMENSIONS[activeIndex].id}`)?.focus();
  }, [open, anchor, activeIndex, menuId]);

  useEffect(() => {
    if (!open) return;
    // FiveNSelector sends this route to Next's router before confirmation.
    // This keeps a fast keyboard selection from waiting for the next page.
    router.prefetch(DIMENSIONS[activeIndex].href);
  }, [activeIndex, open, router]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  /** Wraps in either direction through the closed dimension list. */
  const move = useCallback((steps: number) => {
    setActiveIndex((i) => {
      const n = DIMENSIONS.length;
      return (((i + steps) % n) + n) % n;
    });
  }, []);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    // Trackpads emit many small events, so accumulated movement advances one step.
    wheelRef.current += e.deltaY;
    if (Math.abs(wheelRef.current) < 40) return;
    move(wheelRef.current > 0 ? 1 : -1);
    wheelRef.current = 0;
  }

  function onPointerDown(e: React.PointerEvent) {
    draggedRef.current = false;
    dragRef.current = { id: e.pointerId, y: e.clientY, from: activeIndex };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const deltaY = e.clientY - d.y;
    // Ignore ordinary mouse jitter so a click is not mistaken for a drag.
    if (Math.abs(deltaY) < 18) return;
    draggedRef.current = true;
    // About 64px of vertical movement advances one item and wraps at the ends.
    const steps = Math.round(deltaY / 64);
    const n = DIMENSIONS.length;
    setActiveIndex((((d.from + steps) % n) + n) % n);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onKeyDownMenu(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(DIMENSIONS.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(DIMENSIONS[activeIndex]);
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
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl transition-colors hover:bg-bg-hover"
      >
        <FiveNMark size={44} animated={!reducedMotion} />
      </button>

      {open && anchor
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                onPointerDown={() => close(false)}
                className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-[2px]"
              />

              {/* Gesture surface stays untyped; only the child button container owns menu semantics. */}
              <div
                onKeyDown={onKeyDownMenu}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="fixed z-50"
                style={{
                  // The straight edge stays aligned with the trigger while the arc opens right.
                  left: anchor.x,
                  top: anchor.y - PANEL_R,
                  width: PANEL_R,
                  height: BOX,
                  touchAction: 'none',
                }}
              >
                {/* Opaque half-disk that visually contains the rotating choices. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-bg-raised shadow-pop ring-1 ring-[var(--border-strong)]"
                  style={{
                    // An opaque surface keeps the arc distinguishable from the page.
                    boxShadow: 'inset -1px 0 0 0 var(--accent-line)',
                    borderTopRightRadius: PANEL_R,
                    borderBottomRightRadius: PANEL_R,
                    animation: reducedMotion
                      ? undefined
                      : 'ns-arc-in 200ms cubic-bezier(.2,.8,.3,1)',
                    transformOrigin: 'left center',
                  }}
                />

                {/* The orbit cue fades with the choices instead of drawing a closed semicircle. */}
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  width={PANEL_R}
                  height={BOX}
                  viewBox={`0 0 ${PANEL_R} ${BOX}`}
                  fill="none"
                >
                  <defs>
                    <linearGradient id={`${menuId}-track`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
                      <stop offset="30%" stopColor="var(--accent)" stopOpacity="0.55" />
                      <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={TRACK_PATH}
                    stroke={`url(#${menuId}-track)`}
                    strokeWidth={1.5}
                    strokeDasharray="2 8"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Small notch marking the commit point. */}
                <span
                  aria-hidden="true"
                  className="absolute h-9 w-1 -translate-y-1/2 rounded-full bg-accent"
                  style={{ left: ORBIT_R + ITEM_D / 2 + 8, top: CY }}
                />

                <div
                  id={menuId}
                  role="menu"
                  aria-label="5N boyutları"
                  aria-activedescendant={`${menuId}-${active.id}`}
                  tabIndex={-1}
                  className="absolute inset-0"
                >
                  {DIMENSIONS.map((dimension, index) => {
                    const angle = offsetAngle(index, activeIndex);
                    const opacity = fadeFor(angle);
                    const pos = polar(angle, ORBIT_R);
                    const isActive = index === activeIndex;
                    const isConfirming = confirming === dimension.id;
                    const scale = isActive ? 1 : 0.82;

                    return (
                      <button
                        key={dimension.id}
                        id={`${menuId}-${dimension.id}`}
                        type="button"
                        role="menuitem"
                        tabIndex={isActive ? 0 : -1}
                        aria-label={dimension.label}
                        onClick={() => {
                          // Ignore the click synthesized after a completed drag.
                          if (draggedRef.current) {
                            draggedRef.current = false;
                            return;
                          }
                          // A visible choice snaps to the commit point and then navigates.
                          if (!isActive) setActiveIndex(index);
                          commit(dimension, !isActive);
                        }}
                        className="absolute flex flex-col items-center justify-center rounded-full outline-offset-2"
                        style={{
                          left: pos.x,
                          top: pos.y,
                          width: ITEM_D,
                          height: ITEM_D,
                          transform: `translate(-50%, -50%) scale(${scale})`,
                          opacity,
                          // Off-arc items remain in the menu for assistive technology;
                          // only their paint and pointer target disappear.
                          pointerEvents: opacity <= 0 ? 'none' : undefined,
                          background: isActive ? 'var(--accent)' : 'var(--bg-sunken)',
                          color: isActive ? 'var(--accent-fg)' : 'var(--fg)',
                          boxShadow: isConfirming
                            ? '0 0 0 6px var(--accent-soft)'
                            : isActive
                              ? '0 6px 18px -6px var(--accent)'
                              : '0 1px 2px 0 rgb(0 0 0 / 0.28)',
                          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-strong)'}`,
                          transition: reducedMotion
                            ? 'none'
                            : 'left 180ms ease, top 180ms ease, opacity 180ms ease, transform 180ms ease, background 140ms ease',
                        }}
                      >
                        <Icon name={dimension.icon} size={20} />
                      </button>
                    );
                  })}
                </div>

                {/* Visible label for the choice currently at the commit point. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap rounded-full bg-bg-raised px-3.5 py-2 shadow-pop ring-1 ring-[var(--border-strong)]"
                  style={{ left: ORBIT_R + ITEM_D / 2 + 20, top: CY }}
                >
                  <span className="text-sm font-bold text-accent">{active.label}</span>
                </span>

                {/* The persistent N hub rests inside the straight edge so it cannot be clipped. */}
                <button
                  type="button"
                  onClick={() => close(true)}
                  aria-label="Seçiciyi kapat"
                  className="absolute flex -translate-y-1/2 items-center justify-center rounded-full bg-bg-sunken ring-1 ring-[var(--border-strong)] transition-colors hover:bg-bg-hover"
                  style={{ left: 0, top: CY, width: HUB_D, height: HUB_D }}
                >
                  <FiveNMark size={40} animated={!reducedMotion} />
                </button>

              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
