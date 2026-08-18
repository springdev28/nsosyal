import Link from 'next/link';
import type { ReactNode } from 'react';

import { Avatar } from '@/components/ui';
import type { Profile } from '@/types/domain';

import { MainNav, MobileNav, NAV_ITEMS } from './Nav';

/**
 * Uygulama kabugu (PROJECT_SPEC 8.2).
 *
 * Mobil (<768px): ust baslik + alt navigasyon, tam genislik icerik.
 * Tablet/masaustu: sol ana navigasyon, merkez icerik, istege bagli sag panel.
 */
export function AppShell({
  viewer,
  unreadCount,
  hasNewIssue,
  children,
  aside,
}: {
  viewer: Profile | null;
  unreadCount: number;
  hasNewIssue: boolean;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="skip-link">
        İçeriğe atla
      </a>

      <TopBar viewer={viewer} unreadCount={unreadCount} />

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-3 pb-24 pt-3 md:px-5 md:pb-6 lg:gap-8">
        <MainNav hasNewIssue={hasNewIssue} viewer={viewer} />

        <main id="main" className="min-w-0 flex-1 py-1">
          {children}
        </main>

        {aside ? (
          <aside className="hidden w-[320px] shrink-0 py-1 xl:block" aria-label="Bağlam paneli">
            <div className="sticky top-[4.5rem] space-y-4">{aside}</div>
          </aside>
        ) : null}
      </div>

      <MobileNav hasNewIssue={hasNewIssue} />
    </div>
  );
}

function TopBar({ viewer, unreadCount }: { viewer: Profile | null; unreadCount: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg-raised/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-3 py-2.5 md:px-5">
        <Link href="/feed" className="flex items-center gap-2 font-bold tracking-tight">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg"
          >
            5N
          </span>
          <span className="hidden sm:inline">
            nSosyal <span className="text-accent">5N</span>
          </span>
        </Link>

        <p className="hidden truncate rounded-full border border-dashed border-line-strong px-2 py-0.5 text-xs text-fg-subtle lg:block">
          Yarışma prototipi · tüm içerik sentetik demo verisidir
        </p>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/notifications"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-bg-sunken"
          >
            <span aria-hidden="true" className="text-lg">
              🔔
            </span>
            <span className="sr-only">
              Bildirimler{unreadCount > 0 ? `, ${unreadCount} okunmamış` : ''}
            </span>
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-danger px-1 text-[0.65rem] font-bold leading-4 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>

          {viewer ? (
            <Link
              href={`/profile/${viewer.username}`}
              className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-bg-sunken"
            >
              <Avatar profile={viewer} size={32} />
              <span className="hidden text-sm font-medium sm:inline">{viewer.displayName.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
            >
              Giriş yap
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
