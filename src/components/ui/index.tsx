import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/Icon';
import type { ContextChip, ProfileSummary } from '@/types/view';

export { Icon };
export type { IconName };

/* -------------------------------------------------------------------------
   Temel arayuz bilesenleri.

   Gorsel dil nsosyal.com'dan alinmistir: koyu yuzeyler, 16px yuvarlak kartlar,
   tam yuvarlak (pill) dugmeler, canli mavi vurgu ve camgobegi -> mavi gradyan
   birincil eylem. Emoji yerine tutarli SVG ikon seti kullanilir.
------------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  as: Tag = 'div',
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
  id?: string;
}) {
  return (
    <Tag id={id} className={`card ${className}`}>
      {children}
    </Tag>
  );
}

/** Ad ve soyaddan iki harflik bas harf. Turkce buyuk harf kurallarina uyar. */
function initialsOf(name: string): string {
  const parts = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${second}`.toLocaleUpperCase('tr-TR');
}

/**
 * Profil avatari.
 *
 * Prototipte gercek fotograf yok; her hesap icin kendi tonundan turetilen
 * gradyan bir daire ve bas harfler kullaniyoruz. Emoji avatardan farkli olarak
 * her platformda ayni gorunur ve gercek bir urun gibi durur.
 */
export function Avatar({
  profile,
  size = 40,
  ring = false,
}: {
  profile: Pick<ProfileSummary, 'avatarTone' | 'displayName' | 'kind'>;
  size?: number;
  /** Hikaye/one cikan halkasi. */
  ring?: boolean;
}) {
  const initials = initialsOf(profile.displayName);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${
        ring ? 'outline outline-2 outline-offset-2 outline-accent' : ''
      }`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        letterSpacing: '0.01em',
        backgroundImage: `linear-gradient(140deg, ${profile.avatarTone}, color-mix(in srgb, ${profile.avatarTone} 45%, #0a0f1a))`,
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.12)',
        // Kurum hesaplari hafif yuvarlatilmis kare ile ayrilir.
        borderRadius: profile.kind === 'organization' ? size * 0.28 : '9999px',
      }}
    >
      {initials}
    </span>
  );
}

/** Ust uste binen avatar dizisi - topluluk uye onizlemesi. */
export function AvatarStack({
  profiles,
  size = 28,
  max = 4,
}: {
  profiles: Array<Pick<ProfileSummary, 'avatarTone' | 'displayName' | 'kind'>>;
  size?: number;
  max?: number;
}) {
  const shown = profiles.slice(0, max);
  const rest = profiles.length - shown.length;

  return (
    <span className="flex items-center">
      {shown.map((profile, index) => (
        <span
          key={`${profile.displayName}-${index}`}
          className="rounded-full ring-2 ring-[var(--bg-raised)]"
          style={{ marginLeft: index === 0 ? 0 : -size * 0.3 }}
        >
          <Avatar profile={profile} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-bg-sunken text-[0.7rem] font-semibold text-fg-muted ring-2 ring-[var(--bg-raised)]"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

export function VerifiedMark({ kind }: { kind: ProfileSummary['kind'] }) {
  return (
    <span
      className="inline-flex text-accent"
      title={kind === 'organization' ? 'Doğrulanmış kurum hesabı' : 'Doğrulanmış hesap'}
    >
      <Icon name="verified" size={16} filled label="Doğrulanmış hesap" />
    </span>
  );
}

/** Tum seed hesaplari sentetiktir; juri gercek kisi sanmasin diye isaretlenir. */
export function DemoBadge() {
  return (
    <span className="rounded-md border border-line px-1.5 py-px text-[0.65rem] font-medium uppercase tracking-wide text-fg-subtle">
      demo
    </span>
  );
}

const DIMENSION: Record<ContextChip['dimension'], { color: string; label: string }> = {
  ne: { color: 'var(--color-dim-ne)', label: 'Ne' },
  nerede: { color: 'var(--color-dim-nerede)', label: 'Nerede' },
  nezaman: { color: 'var(--color-dim-nezaman)', label: 'Ne zaman' },
  nasil: { color: 'var(--color-dim-nasil)', label: 'Nasıl' },
  neden: { color: 'var(--color-dim-neden)', label: 'Neden' },
  kim: { color: 'var(--color-dim-kim)', label: 'Kim' },
};

/**
 * 5N baglam chipi. Renk yalnizca destekleyici ipucudur; boyut adi ekran
 * okuyucu icin metin olarak da verilir ve her chip bir ikon tasir.
 */
export function DimensionChip({ chip }: { chip: ContextChip }) {
  const style = DIMENSION[chip.dimension];
  const content = (
    <>
      <Icon name={chip.icon as IconName} size={13} />
      <span className="sr-only">{style.label}: </span>
      <span>{chip.label}</span>
    </>
  );

  const className =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium leading-none transition-colors';
  const inline = {
    color: style.color,
    background: `color-mix(in srgb, ${style.color} 12%, transparent)`,
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${style.color} 28%, transparent)`,
  };

  if (!chip.href) {
    return (
      <span className={className} style={inline}>
        {content}
      </span>
    );
  }

  return (
    <Link href={chip.href} className={`${className} hover:brightness-125`} style={inline}>
      {content}
    </Link>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'sponsored';
  icon?: IconName;
}) {
  const tones: Record<string, string> = {
    neutral: 'text-fg-muted bg-bg-sunken ring-1 ring-[var(--border)]',
    accent: 'text-accent bg-accent-soft ring-1 ring-[var(--accent-line)]',
    success: 'text-success bg-success-soft ring-1 ring-current/30',
    warning: 'text-warning bg-warning-soft ring-1 ring-current/30',
    danger: 'text-danger bg-danger-soft ring-1 ring-current/30',
    // Sponsorlu etiketi kasitli olarak yuksek kontrastli ve ayirt edici.
    sponsored: 'text-signal-900 bg-signal-300 ring-1 ring-signal-500 font-bold',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold leading-tight ${tones[tone]}`}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

type ButtonTone = 'primary' | 'gradient' | 'secondary' | 'ghost' | 'danger';

const TONES: Record<ButtonTone, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110',
  gradient: 'btn-gradient',
  secondary: 'bg-bg-raised text-fg ring-1 ring-[var(--border-strong)] hover:bg-bg-hover',
  ghost: 'bg-transparent text-fg-muted hover:bg-bg-hover',
  danger: 'bg-danger-soft text-danger ring-1 ring-current/40 hover:brightness-110',
};

const BASE =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50';

export function Button({
  tone = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { tone?: ButtonTone }) {
  return <button {...props} className={`${BASE} ${TONES[tone]} ${className}`} />;
}

export function ButtonLink({
  tone = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return <Link {...props} className={`${BASE} ${TONES[tone]} ${className}`} />;
}

/** Yalnizca ikon tasiyan yuvarlak dugme. Erisilebilir isim zorunlu. */
export function IconButton({
  icon,
  label,
  className = '',
  size = 18,
  ...props
}: ComponentProps<'button'> & { icon: IconName; label: string; size?: number }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg ${className}`}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  as: Tag = 'h2',
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Tag className={Tag === 'h1' ? 'text-[1.6rem] font-extrabold' : 'text-[1.05rem] font-bold'}>
          {title}
        </Tag>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-sunken text-fg-subtle">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger ring-1 ring-current/30"
    >
      <Icon name="info" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function InfoNote({ children, icon = 'info' }: { children: ReactNode; icon?: IconName }) {
  return (
    <p className="flex gap-2.5 rounded-xl bg-bg-sunken px-3 py-2.5 text-sm text-fg-muted ring-1 ring-[var(--border)]">
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-accent" />
      <span>{children}</span>
    </p>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-bg-sunken px-3 py-2 ring-1 ring-[var(--border)]">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

export function ChipRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="scroll-x hide-scrollbar -mx-1 px-1 pb-1" role="group" aria-label={label}>
      <div className="flex w-max gap-2">{children}</div>
    </div>
  );
}

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm transition-colors ${
        active
          ? 'bg-accent font-semibold text-accent-fg'
          : 'bg-bg-sunken text-fg-muted ring-1 ring-[var(--border)] hover:bg-bg-hover hover:text-fg'
      }`}
    >
      {/* Aktiflik yalnizca renkle degil, isaretle de belirtilir. */}
      {active ? <Icon name="check" size={13} /> : null}
      {children}
    </Link>
  );
}

/**
 * Merkez kolonun ust sekmeleri. nsosyal.com'daki "Akış / Medya" seridinin
 * karsiligi: alt cizgi vurgulu, esit genislikli baglantilar.
 */
export function TopTabs({
  tabs,
}: {
  tabs: Array<{ href: string; label: string; active: boolean }>;
}) {
  return (
    <nav className="sticky top-0 z-20 -mx-1 mb-3 border-b border-line bg-bg/85 px-1 backdrop-blur">
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={`relative flex min-h-12 items-center justify-center px-3 text-[0.95rem] transition-colors ${
                tab.active ? 'font-semibold text-accent' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {tab.label}
              {tab.active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-accent"
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
