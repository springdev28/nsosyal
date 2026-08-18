import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import type { ContextChip, ProfileSummary } from '@/types/view';

/* -------------------------------------------------------------------------
   Temel arayuz bilesenleri.
   Tanidik sosyal medya kaliplarini koruyoruz; ozgunluk bilgi mimarisinde
   (PROJECT_SPEC 8.1). Her bilesen klavye ile kullanilabilir ve renk tek basina
   durum iletmez.
------------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}) {
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

export function Avatar({
  profile,
  size = 40,
}: {
  profile: Pick<ProfileSummary, 'avatarEmoji' | 'avatarTone' | 'displayName'>;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full border"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `color-mix(in srgb, ${profile.avatarTone} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${profile.avatarTone} 45%, transparent)`,
      }}
    >
      {profile.avatarEmoji}
    </span>
  );
}

export function VerifiedMark({ kind }: { kind: ProfileSummary['kind'] }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-accent"
      title={kind === 'organization' ? 'Doğrulanmış kurum hesabı' : 'Doğrulanmış hesap'}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
        <path d="M8 0.8l1.9 1.4 2.3-.2.7 2.2 1.9 1.3-1 2.1 1 2.1-1.9 1.3-.7 2.2-2.3-.2L8 15.2l-1.9-1.4-2.3.2-.7-2.2L1.2 10.5l1-2.1-1-2.1 1.9-1.3.7-2.2 2.3.2L8 .8zm3.2 4.9l-4 4-1.9-1.9-1.1 1.1 3 3 5.1-5.1-1.1-1.1z" />
      </svg>
      Doğrulanmış
    </span>
  );
}

/** Tum seed hesaplari sentetiktir; juri gercek kisi sanmasin diye acikca isaretlenir. */
export function DemoBadge() {
  return (
    <span className="rounded-full border border-dashed border-line-strong px-1.5 py-0.5 text-[0.65rem] font-medium text-fg-subtle">
      Demo
    </span>
  );
}

const DIMENSION_STYLE: Record<ContextChip['dimension'], { color: string; label: string }> = {
  ne: { color: 'var(--color-dim-ne)', label: 'Ne' },
  nerede: { color: 'var(--color-dim-nerede)', label: 'Nerede' },
  nezaman: { color: 'var(--color-dim-nezaman)', label: 'Ne zaman' },
  nasil: { color: 'var(--color-dim-nasil)', label: 'Nasıl' },
  neden: { color: 'var(--color-dim-neden)', label: 'Neden' },
  kim: { color: 'var(--color-dim-kim)', label: 'Kim' },
};

/**
 * 5N baglam chipi. Boyut rengi yalnizca destekleyici bir ipucudur; ekran
 * okuyucu icin boyut adi metin olarak da verilir.
 */
export function DimensionChip({ chip }: { chip: ContextChip }) {
  const style = DIMENSION_STYLE[chip.dimension];
  const content = (
    <>
      <span aria-hidden="true">{chip.icon}</span>
      <span className="sr-only">{style.label}: </span>
      <span>{chip.label}</span>
    </>
  );

  const className =
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors';
  const inlineStyle = {
    borderColor: `color-mix(in srgb, ${style.color} 40%, transparent)`,
    color: style.color,
    background: `color-mix(in srgb, ${style.color} 10%, transparent)`,
  };

  if (!chip.href) {
    return (
      <span className={className} style={inlineStyle}>
        {content}
      </span>
    );
  }

  return (
    <Link href={chip.href} className={`${className} hover:underline`} style={inlineStyle}>
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
  icon?: ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line text-fg-muted bg-bg-sunken',
    accent: 'border-accent/40 text-accent bg-accent-soft',
    success: 'border-success/40 text-success bg-success-soft',
    warning: 'border-warning/40 text-warning bg-warning-soft',
    danger: 'border-danger/40 text-danger bg-danger-soft',
    // Sponsorlu etiketi kasitli olarak yuksek kontrastli ve ayirt edici.
    sponsored: 'border-signal-600 text-signal-800 bg-signal-100 dark:text-signal-100 dark:bg-signal-900',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_TONES: Record<ButtonTone, string> = {
  primary: 'bg-accent text-accent-fg border-transparent hover:opacity-90',
  secondary: 'bg-bg-raised text-fg border-line-strong hover:bg-bg-sunken',
  ghost: 'bg-transparent text-fg-muted border-transparent hover:bg-bg-sunken',
  danger: 'bg-danger-soft text-danger border-danger/40 hover:bg-danger/10',
};

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export function Button({
  tone = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { tone?: ButtonTone }) {
  return <button {...props} className={`${BUTTON_BASE} ${BUTTON_TONES[tone]} ${className}`} />;
}

export function ButtonLink({
  tone = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return <Link {...props} className={`${BUTTON_BASE} ${BUTTON_TONES[tone]} ${className}`} />;
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
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <Tag className={Tag === 'h1' ? 'text-2xl font-bold' : 'text-lg font-semibold'}>{title}</Tag>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Bos durum karti. PROJECT_SPEC 8.4 her bos durumun ne yapilacagini
 * soylemesini istiyor; bu yuzden aksiyon alani zorunlu degil ama tesvik edilir.
 */
export function EmptyState({
  icon = '🫥',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-fg-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function InfoNote({ children, icon = 'ℹ️' }: { children: ReactNode; icon?: string }) {
  return (
    <p className="flex gap-2 rounded-lg border border-line bg-bg-sunken px-3 py-2 text-sm text-fg-muted">
      <span aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-bg-sunken px-3 py-2">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

/** Yatay kaydirilabilir filtre serisi. Mobilde tasar, klavye ile gezilebilir. */
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
      className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
        active
          ? 'border-accent bg-accent text-accent-fg font-semibold'
          : 'border-line bg-bg-raised text-fg-muted hover:border-line-strong'
      }`}
    >
      {/* Aktiflik yalnizca renkle degil, isaretle de belirtilir. */}
      {active ? <span aria-hidden="true">✓</span> : null}
      {children}
    </Link>
  );
}
