import type { SVGProps } from 'react';

/**
 * Uygulama ikon seti.
 *
 * Emoji yerine tutarli, hizalanabilir ve renk devralan SVG ikonlar kullaniyoruz:
 * emoji her isletim sisteminde farkli cizilir, boyutu ve optik agirligi kontrol
 * edilemez, arayuzun tonunu istemeden "gundelik" yapar.
 *
 * Hepsi 24x24 kutuda, 1.75 kalinlikta cizgi; currentColor devralir.
 * Ikonlar dekoratiftir: erisilebilir isim her zaman yanindaki metinden gelir,
 * ikon tek basina kullanildiginda cagiran bilesen sr-only metin ekler.
 */

export type IconName =
  | 'home'
  | 'compass'
  | 'plus'
  | 'users'
  | 'newspaper'
  | 'beaker'
  | 'bell'
  | 'settings'
  | 'info'
  | 'shield'
  | 'heart'
  | 'message'
  | 'repeat'
  | 'bookmark'
  | 'mapPin'
  | 'calendar'
  | 'clock'
  | 'spark'
  | 'route'
  | 'tag'
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'arrowRight'
  | 'arrowLeft'
  | 'search'
  | 'play'
  | 'video'
  | 'image'
  | 'verified'
  | 'lock'
  | 'flag'
  | 'sparkles'
  | 'globe'
  | 'building'
  | 'seedling'
  | 'text'
  | 'question'
  | 'megaphone'
  | 'book';

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="9" r="3.2" />
      <path d="M3.5 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8" />
      <path d="M16 6.6a3 3 0 0 1 0 5.6" />
      <path d="M17.6 14.9c1.9.5 3.2 1.8 3.2 4" />
    </>
  ),
  newspaper: (
    <>
      <path d="M4.5 5.5h12v14h-12z" />
      <path d="M16.5 9h3v8.5a2 2 0 0 1-2 2h-1" />
      <path d="M7 9h7M7 12h7M7 15h4" />
    </>
  ),
  beaker: (
    <>
      <path d="M9.5 3.5v6L5 18a2 2 0 0 0 1.8 2.9h10.4A2 2 0 0 0 19 18l-4.5-8.5v-6" />
      <path d="M8.5 3.5h7" />
      <path d="M7.2 14h9.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10" />
      <path d="M10.3 18.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.4 14.5a1.4 1.4 0 0 0 .3 1.6l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-1.6-.3 1.4 1.4 0 0 0-.9 1.3v.2a1.7 1.7 0 1 1-3.4 0v-.1a1.4 1.4 0 0 0-.9-1.3 1.4 1.4 0 0 0-1.6.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0 .3-1.6 1.4 1.4 0 0 0-1.3-.9h-.2a1.7 1.7 0 1 1 0-3.4h.1a1.4 1.4 0 0 0 1.3-.9 1.4 1.4 0 0 0-.3-1.6l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 1.6.3h.1a1.4 1.4 0 0 0 .9-1.3v-.2a1.7 1.7 0 1 1 3.4 0v.1a1.4 1.4 0 0 0 .9 1.3 1.4 1.4 0 0 0 1.6-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0-.3 1.6v.1a1.4 1.4 0 0 0 1.3.9h.2a1.7 1.7 0 1 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.9" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 7.8h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5.5 6v5.5c0 4 2.8 7.5 6.5 9 3.7-1.5 6.5-5 6.5-9V6z" />
      <path d="m9.3 12 1.9 1.9 3.5-3.6" />
    </>
  ),
  heart: (
    <>
      <path d="M12 19.5s-6.8-4.1-8.2-8A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 8.2 3.9c-1.4 3.9-8.2 8-8.2 8" />
    </>
  ),
  message: (
    <>
      <path d="M20 12.2c0 3.7-3.6 6.6-8 6.6a9.6 9.6 0 0 1-2.6-.35L4.5 20l1.2-3.2A6.3 6.3 0 0 1 4 12.2c0-3.6 3.6-6.6 8-6.6s8 3 8 6.6" />
    </>
  ),
  repeat: (
    <>
      <path d="M4.5 9.5V8a2.5 2.5 0 0 1 2.5-2.5h10L14.5 3" />
      <path d="M19.5 14.5V16a2.5 2.5 0 0 1-2.5 2.5H7L9.5 21" />
    </>
  ),
  bookmark: (
    <>
      <path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s6.5-5.7 6.5-10.3A6.5 6.5 0 0 0 5.5 10.7C5.5 15.3 12 21 12 21" />
      <circle cx="12" cy="10.5" r="2.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5c0 4-1.6 6-4.5 7 2.9 1 4.5 3 4.5 7 0-4 1.6-6 4.5-7-2.9-1-4.5-3-4.5-7Z" />
      <path d="M18.5 15.5c0 1.6-.7 2.4-2 2.8 1.3.4 2 1.2 2 2.7 0-1.5.7-2.3 2-2.7-1.3-.4-2-1.2-2-2.8Z" />
    </>
  ),
  route: (
    <>
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 6.5h5A3.5 3.5 0 0 1 14 13.5h-4a3.5 3.5 0 0 0 0 7h5" />
    </>
  ),
  tag: (
    <>
      <path d="M4.5 11.4V5.5a1 1 0 0 1 1-1h5.9a1 1 0 0 1 .7.3l7 7a1 1 0 0 1 0 1.4l-5.9 5.9a1 1 0 0 1-1.4 0l-7-7a1 1 0 0 1-.3-.7Z" />
      <path d="M8.3 8.3h.01" />
    </>
  ),
  check: (
    <>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19.5 12h-15M10.5 18l-6-6 6-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  play: (
    <>
      <path d="M8.5 5.6 18 12l-9.5 6.4z" />
    </>
  ),
  video: (
    <>
      <rect x="3.5" y="6" width="12" height="12" rx="2.2" />
      <path d="m15.5 10.5 5-2.6v8.2l-5-2.6z" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2.2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.5L13 16l2.5-2.5L19 17" />
    </>
  ),
  verified: (
    <>
      <path d="m12 3.6 2.2 1.6 2.7-.2.8 2.6 2.2 1.5-1.2 2.4 1.2 2.4-2.2 1.5-.8 2.6-2.7-.2L12 20.4l-2.2-1.6-2.7.2-.8-2.6-2.2-1.5 1.2-2.4-1.2-2.4 2.2-1.5.8-2.6 2.7.2z" />
      <path d="m9.6 12.1 1.7 1.7 3.4-3.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4.5" />
      <path d="M6 5.2c3.5-1.6 6.5 1.6 10 0v8c-3.5 1.6-6.5-1.6-10 0z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 4.5 12.4 8 16 9.4l-3.6 1.4L11 14.3 9.6 10.8 6 9.4 9.6 8z" />
      <path d="M17.5 14.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  building: (
    <>
      <path d="M5 20V6.2a1 1 0 0 1 .7-1l7-2.1a1 1 0 0 1 1.3 1V20" />
      <path d="M14 9.5h4.3a1 1 0 0 1 1 1V20" />
      <path d="M3.5 20h17M8.4 8h2.6M8.4 11.5h2.6M8.4 15h2.6" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13C12 9.5 9.5 7 6 7c0 3.5 2.5 6 6 6Z" />
      <path d="M12 13c0-3 2-5.5 5.5-5.5C17.5 10.5 15 13 12 13Z" />
    </>
  ),
  text: (
    <>
      <path d="M5 6.5h14M5 12h14M5 17.5h9" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.7 9.4A2.4 2.4 0 0 1 14.4 10c0 1.6-2.4 2.1-2.4 3.6" />
      <path d="M12 16.6h.01" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H8l7 4V5l-7 4H5.5A1.5 1.5 0 0 0 4 10.5Z" />
      <path d="M18 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M8 15v4.5" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.2A2 2 0 0 1 7 3.5h11v14H7a2 2 0 0 0-2 2z" />
      <path d="M5 17.5v1a2 2 0 0 0 2 2h11" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Ikon tek basina anlam tasiyorsa erisilebilir isim ver; degilse bos birak. */
  label?: string;
  strokeWidth?: number;
  filled?: boolean;
}

export function Icon({ name, size = 20, label, strokeWidth = 1.75, filled = false, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
