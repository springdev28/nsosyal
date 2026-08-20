'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * 5N boyut secici (PROJECT_SPEC 4.4 / 17.18-4).
 *
 * Yapisi: sol kenara yaslanmis DOLU bir yarim disk paneli. Boyutlar bu panelin
 * yayi uzerinde yuvarlak dugmeler olarak durur, merkezde animasyonlu N baglanti
 * isareti bulunur. Ayni anda hepsi gorunmez: uclara yaklasan ogeler solar ve
 * panelin disina cikar, kullanici yayi cevirerek digerlerini getirir.
 *
 * Spec 4.4 bunu zaten tarif ediyordu:
 *   2. "tam daire degil, YARIM bir yay acilir; yayin iki ucu giderek
 *       saydamlasir ve viewport icinde kaybolur"
 *   3. "secenekler ikonlarla bu yay uzerinde TASINIR"
 *   4. "kullanici mouse, touch veya trackpad hareketiyle yayi dondurur"
 *   5. "secim noktasina denk geldiginde kisa bir snap/confirm state'i olusur"
 *   6. "secim tamamlandiginda yay ve secenekler TAMAMEN kaybolur"
 *   7. "N isareti panel uzerinde erisilebilir kalir"
 *
 * Bu bilesen UC KEZ yazildi. Onceki iki denemenin neden ekranda coktugu ve
 * bu geometrinin neden secildigi docs/decisions/0012'de duruyor; oraya
 * bakmadan buradaki sabitleri degistirmeyin. Ozeti: panel isaretin yaslandigi
 * DUVARA oturur (viewport kenarina degil), zemin OPAKTIR ve gobek isareti
 * duvara yaslanir - ortalanirsa yarisi ekran disinda kalir.
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
  { id: 'ne', label: 'Ne', hint: 'Konular', icon: 'search', href: '/explore' },
  { id: 'nerede', label: 'Nerede', hint: 'Harita', icon: 'mapPin', href: '/explore/map' },
  { id: 'nezaman', label: 'Ne zaman', hint: 'Zaman', icon: 'calendar', href: '/explore/time' },
  { id: 'nasil', label: 'Nasıl', hint: 'Kaynaklar', icon: 'book', href: '/explore/how' },
  { id: 'neden', label: 'Neden', hint: 'Motivasyon', icon: 'spark', href: '/explore/why' },
];

/** Panelin yaricapi: yarim disk sol kenara yaslanir. */
const PANEL_R = 188;
/** Ogelerin uzerinde durdugu yorunge. */
const ORBIT_R = 128;
/** Oge dugmesinin capi. Dokunma hedefi icin 44px'in uzerinde. */
const ITEM_D = 56;
/**
 * Ogeler arasi acisal mesafe.
 *
 * Dizi KAPALIDIR: son ogeden sonra yeniden ilki gelir, yani yayin bir ucu
 * yoktur ve "Ne" secili iken ustunde bosluk kalmaz. Aralik 360/5 = 72
 * olsaydi komsu ogeler solma penceresinin kenarina dusup hayalet gibi
 * gorunurdu; 40 derece hem bes yuvayi da doldurur hem de ortadaki uc ogeyi
 * okunakli birakir.
 */
const STEP = 40;
/**
 * Gorunur pencere. Bu acinin otesindeki oge tamamen kaybolur; oncesinde
 * kademeli olarak solar - spec'in "uclar saydamlasir" kurali. Pencere
 * +-90 derecedir: yarim daire gorunur, geri kalani yayin arkasindadir.
 */
const FADE_FROM = 34;
const FADE_TO = 90;

/** Gobek dugmesinin capi. Yayin duz kenarina yaslanir, kirpilmaz. */
const HUB_D = 72;

const BOX = PANEL_R * 2;
const CX = 0;
const CY = PANEL_R;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

/** Gorunur pencerenin iki ucu arasindaki yorunge yayi. */
const TRACK_PATH = (() => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x = (deg: number) => (CX + ORBIT_R * Math.cos(rad(deg))).toFixed(2);
  const y = (deg: number) => (CY + ORBIT_R * Math.sin(rad(deg))).toFixed(2);
  const end = FADE_TO - 0.01; // tam 90 derece cizimde dejenere yay uretir
  return `M ${x(-end)} ${y(-end)} A ${ORBIT_R} ${ORBIT_R} 0 0 1 ${x(end)} ${y(end)}`;
})();

/**
 * Bir ogenin secim noktasina gore ISARETLI dairesel mesafesi.
 *
 * Dizi kapali oldugu icin dogrudan `(index - activeIndex) * STEP` yanlistir:
 * bes ogelik bir halkada 4. oge, 0. ogenin 288 derece ilerisi degil 72
 * derece GERISIDIR. Bu duzeltme olmadan yay bir uca dayaniyor ve aktif oge
 * dizinin basindayken ustunde kocaman bir bosluk kaliyordu.
 */
function offsetAngle(index: number, activeIndex: number): number {
  const n = DIMENSIONS.length;
  let steps = (((index - activeIndex) % n) + n) % n;
  if (steps > n / 2) steps -= n;
  return steps * STEP;
}

/** Uclara dogru solma. 1 = tam gorunur, 0 = yayin disinda. */
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
  /** Kac adim dondugumuz. Aktif oge her zaman 0 derecede (secim noktasi). */
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; y: number; from: number } | null>(null);
  /**
   * Suruklemeyle biten bir jest, parmagin kalktigi ogenin uzerinde bir `click`
   * de uretir. Bu bayrak olmadan "yayi cevirdim" hareketi istenmeyen bir
   * secime, yani sayfa degisikligine donuyordu.
   */
  const draggedRef = useRef(false);
  const wheelRef = useRef(0);

  const active = DIMENSIONS[activeIndex];

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(q.matches);
    apply();
    q.addEventListener('change', apply);
    return () => q.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Yarim diskin duz kenari isaretin yaslandigi duvardir: Kesfet
      // kolonunun sol kenari. Onceki surum paneli viewport'un 0'ina
      // koyuyordu; panel o zaman isaretten koparak uygulamanin sol gezinme
      // kolonunun uzerine biniyordu.
      setAnchor({
        // Dar bir yerlesimde duvar saga fazla kacarsa panel viewport'u asardi;
        // duz kenar en fazla panel genisligi kadar iceride durabilir.
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

  // Secici acikken arka plan kaymasin; panel isarete sabitli.
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
    // Yarim kalmis tekerlek birikimi bir sonraki acilisa tasinmasin.
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
    /**
     * @param snapping Oge secim noktasinda DEGILDI: once oraya kayar. Yolu
     *   gorunsun diye onay bekleme suresi biraz uzar; yoksa panel oge daha
     *   yerine varmadan kapanir ve hareket "atlamis" gibi gorunur.
     */
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
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  /** Sonsuz donus: dizinin sonundan sonra yeniden basi gelir. */
  const move = useCallback((steps: number) => {
    setActiveIndex((i) => {
      const n = DIMENSIONS.length;
      return (((i + steps) % n) + n) % n;
    });
  }, []);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    // Trackpad'de tek jest cok sayida olay uretir; esik koyup adim adim ceviriyoruz.
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
    if (d && d.id === e.pointerId && Math.abs(e.clientY - d.y) > 6) draggedRef.current = true;
    if (!d || d.id !== e.pointerId) return;
    // Dikey surukleme yayi cevirir: ~64px bir oge. Sinir yok, yay sarar.
    const steps = Math.round((e.clientY - d.y) / 64);
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

              {/*
                Konumlandirici + jest yuzeyi. `role="menu"` BURADA DEGIL:
                bir menu yalnizca menuitem tasiyabilir, oysa bu kutuda panel
                zemini, yorunge izi, okunan etiket ve gobek dugmesi de var.
                Rolu buraya koymak axe'in `aria-required-children` kuralini
                kritik seviyede ihlal ediyordu ("Element has children which
                are not allowed: button[aria-label]") - yani ekran okuyucuda
                menu yapisi bozuluyordu. Rol asagida yalnizca ogeleri saran
                kutuya verildi; klavye ve isaretleme olaylari zaten buraya
                kabarir.
              */}
              <div
                onKeyDown={onKeyDownMenu}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="fixed z-50"
                style={{
                  // Duz kenar duvara, yay saga acilir; dikeyde isaretin
                  // hizasinda kalir.
                  left: anchor.x,
                  top: anchor.y - PANEL_R,
                  width: PANEL_R,
                  height: BOX,
                  touchAction: 'none',
                }}
              >
                {/* Dolu yarim disk paneli. Ogeler bunun icinde kalir. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-bg-raised shadow-pop ring-1 ring-[var(--border-strong)]"
                  style={{
                    // Panel opak. Onceki surum sayfaya karisan bir gradyandi:
                    // koyu temada disk zeminden ayirt edilemiyordu, dolayisiyla
                    // "yay" diye bir sey algilanmiyordu.
                    boxShadow: 'inset -1px 0 0 0 var(--accent-line)',
                    borderTopRightRadius: PANEL_R,
                    borderBottomRightRadius: PANEL_R,
                    animation: reducedMotion
                      ? undefined
                      : 'ns-arc-in 200ms cubic-bezier(.2,.8,.3,1)',
                    transformOrigin: 'left center',
                  }}
                />

                {/*
                  Yorunge izi. Kullanicinin "bu sey doner" oldugunu gormesi
                  icin ray cizilir, ama TAM yarim daire cizilmez: iz de
                  ogelerle ayni pencerede yasar ve uclarinda saydamlasir
                  (spec 4.4/2). Sabit bir yarim halka cizmek "uclar kaybolur"
                  kuralini gorsel olarak yalanlardi.
                */}
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

                {/* Secim noktasi isareti: yayin sagindaki kucuk kertik. */}
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
                        aria-label={`${dimension.label} — ${dimension.hint}`}
                        onClick={() => {
                          // Cevirme jestinin kuyrugundaki tiklama secim degildir.
                          if (draggedRef.current) {
                            draggedRef.current = false;
                            return;
                          }
                          // Yaydaki HERHANGI bir ogeye dokunmak onu once secim
                          // noktasina getirir, sonra onaylar. Onceki davranis
                          // ilk dokunusu yalnizca donduruyordu: kullanici
                          // gordugu secenege basiyor ve hicbir sey olmuyordu -
                          // "duzgun secemiyorum" sikayetinin kaynagi buydu.
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
                          // Pencerenin disina cikan oge DOM'da kalir: menu
                          // semantigi bes boyutu da saymali ve ekran okuyucu
                          // listenin tamamini gorebilmeli. Yalnizca boyasi ve
                          // isaretleme hedefi kalkar; boylece girip cikarken
                          // yumusak solar, aniden belirmez.
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

                {/* Aktif boyutun adi: yayin disinda, panelin sag ustunde. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap rounded-full bg-bg-raised px-3.5 py-2 shadow-pop ring-1 ring-[var(--border-strong)]"
                  style={{ left: ORBIT_R + ITEM_D / 2 + 20, top: CY }}
                >
                  <span className="text-sm font-bold text-accent">{active.label}</span>
                  <span className="ml-1.5 text-xs text-fg-subtle">{active.hint}</span>
                </span>

                {/*
                  Gobek: animasyonlu N isareti (spec 4.4/7 - isaret panel
                  uzerinde her zaman erisilebilir kalir). Yayin merkezi duz
                  kenardadir; isaret oraya ORTALANIRSA yarisi viewport disinda
                  kalir - onceki surumun hatasi buydu. Bunun yerine dugme
                  duvara YASLANIR: sol kenari x=0'da, isaret tamamen icerde.
                */}
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
