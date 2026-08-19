/**
 * Kapak gorseli yerine gecen gradyan doku.
 *
 * Gercek fotograf tasimayan varliklar (topluluk, proje, etkinlik) icin sabit
 * bir gorsel kimlik uretir: varligin sluglarindan turetilen bir gradyan ve
 * uzeri hafif bir izgara. Boylece kartlar "emoji yapistirilmis metin" gibi
 * degil, kapak gorseli olan gercek kartlar gibi durur.
 */

const PALETTES: Array<[string, string]> = [
  ['#35d6ee', '#3d9bff'],
  ['#a78bfa', '#4f7dff'],
  ['#4ade80', '#16bfdc'],
  ['#fb7185', '#a855f7'],
  ['#fbbf24', '#fb7185'],
  ['#3d9bff', '#a78bfa'],
  ['#16bfdc', '#4ade80'],
  ['#f97316', '#fbbf24'],
];

function hashOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

export function coverGradient(seed: string): string {
  const [from, to] = PALETTES[hashOf(seed) % PALETTES.length];
  const angle = 120 + (hashOf(seed) % 6) * 12;
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

export function CoverTile({
  seed,
  glyph,
  height = 108,
  className = '',
  rounded = 'top',
}: {
  seed: string;
  /** Kapak uzerinde buyuk gosterilen sembol. */
  glyph: string;
  height?: number;
  className?: string;
  rounded?: 'top' | 'all' | 'none';
}) {
  const radius =
    rounded === 'top' ? '1rem 1rem 0 0' : rounded === 'all' ? '1rem' : '0';

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ height, borderRadius: radius, backgroundImage: coverGradient(seed) }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <span
        className="relative select-none"
        style={{ fontSize: height * 0.42, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.35))' }}
      >
        {glyph}
      </span>
    </div>
  );
}

/** Kucuk kare rozet - liste satirlarinda kapak yerine kullanilir. */
export function CoverBadge({
  seed,
  glyph,
  size = 44,
}: {
  seed: string;
  glyph: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundImage: coverGradient(seed),
        fontSize: size * 0.45,
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.15)',
      }}
    >
      {glyph}
    </span>
  );
}
