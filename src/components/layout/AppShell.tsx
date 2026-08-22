/**
 * Oturum acmis rotalarin masaustu kolonlarini ve mobil gezinme kabugunu kurar.
 * Sayfalar yalnizca merkez icerigi verir; ortak arama, gundem ve tema davranisi
 * burada tek yerde kalir.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Avatar, Icon } from '@/components/ui';
import type { Profile } from '@/types/domain';

import { MainNav, MobileNav } from './Nav';

export interface TrendingTopic {
  slug: string;
  name: string;
  postCount: number;
}

/**
 * Uygulama kabugu.
 *
 * nsosyal.com yerlesimi: sol gezinme, merkez icerik kolonu, sag panel (arama +
 * Populer). Mobilde sag panel gizlenir, gezinme alta iner (PROJECT_SPEC 8.2).
 */
export function AppShell({
  viewer,
  unreadCount,
  hasNewIssue,
  trending,
  children,
}: {
  viewer: Profile | null;
  unreadCount: number;
  hasNewIssue: boolean;
  trending: TrendingTopic[];
  children: ReactNode;
}) {
  return (
    <div className="app-shell min-h-dvh">
      <a href="#main" className="skip-link">
        İçeriğe atla
      </a>

      <MobileTopBar viewer={viewer} unreadCount={unreadCount} />

      <div className="mx-auto flex w-full max-w-[1420px] gap-5 px-3 pb-24 lg:px-6 lg:pb-6 xl:gap-8">
        <MainNav viewer={viewer} unreadCount={unreadCount} hasNewIssue={hasNewIssue} />

        <main
          id="main"
          className="app-main min-w-0 flex-1 py-3 lg:max-w-[744px] lg:border-x lg:px-4"
        >
          {children}
        </main>

        <aside className="hidden w-[320px] shrink-0 xl:block" aria-label="Arama ve gündem">
          <div className="rail space-y-4 py-3">
            <div className="flex items-center gap-2">
              <SearchBox />
              {viewer ? (
                <Link
                  href={`/profile/${viewer.username}`}
                  prefetch
                  className="shrink-0 rounded-full"
                  aria-label={`${viewer.displayName} profili`}
                >
                  <Avatar profile={viewer} size={40} />
                </Link>
              ) : null}
            </div>

            <TrendingCard trending={trending} />

            <p className="px-1 text-xs text-fg-subtle">
              Sentetik demo verisi ·{' '}
              <Link href="/about" className="underline hover:text-fg-muted">
                Hakkında
              </Link>
            </p>
          </div>
        </aside>
      </div>

      <MobileNav hasNewIssue={hasNewIssue} viewer={viewer} />
    </div>
  );
}

function SearchBox() {
  return (
    <form action="/explore" method="get" role="search" className="min-w-0 flex-1 px-0.5">
      <label htmlFor="global-search" className="sr-only">
        Ara
      </label>
      <div className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--accent-line)] bg-bg-raised px-4 focus-within:border-accent focus-within:ring-1 focus-within:ring-inset focus-within:ring-accent">
        <Icon name="search" size={17} className="shrink-0 text-fg-subtle" />
        <input
          id="global-search"
          name="q"
          type="search"
          placeholder="Arama yap"
          className="w-full min-w-0 bg-transparent py-2 outline-none"
        />
      </div>
    </form>
  );
}

function TrendingCard({ trending }: { trending: TrendingTopic[] }) {
  return (
    <section className="card p-4" aria-labelledby="trending-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="trending-heading" className="text-[1.05rem] font-bold">
          Popüler
        </h2>
        <Link
          href="/explore"
          prefetch
          className="inline-flex items-center gap-0.5 text-xs text-fg-muted hover:text-fg"
        >
          Tümünü gör
          <Icon name="chevronRight" size={14} />
        </Link>
      </div>

      <ul className="space-y-1">
        {trending.map((topic) => (
          <li key={topic.slug}>
            <Link
              href={`/explore?topic=${topic.slug}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-bg-hover"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-bold text-accent"
              >
                #
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.95rem] font-semibold">{topic.name}</span>
                <span className="block text-xs text-fg-subtle">
                  {topic.postCount.toLocaleString('tr-TR')} gönderi
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Mobil ust bar: logo, arama ve profil. Masaustunde gizli. */
function MobileTopBar({ viewer, unreadCount }: { viewer: Profile | null; unreadCount: number }) {
  return (
    <header className="app-topbar sticky top-0 z-30 border-b border-line bg-bg/88 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <Link href="/feed" aria-label="nSosyal ana sayfa" className="flex items-center">
          <FiveNMark size={34} animated />
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/explore"
            aria-label="Ara"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-hover"
          >
            <Icon name="search" size={20} />
          </Link>

          <Link
            href="/notifications"
            prefetch
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-hover"
          >
            <Icon name="bell" size={20} />
            <span className="sr-only">
              Bildirimler{unreadCount > 0 ? `, ${unreadCount} okunmamış` : ''}
            </span>
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 min-w-[1rem] rounded-full bg-accent px-1 text-center text-[0.6rem] font-bold leading-4 text-accent-fg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>

          {viewer ? (
            <Link href={`/profile/${viewer.username}`} prefetch aria-label="Profilim" className="ml-1">
              <Avatar profile={viewer} size={34} />
            </Link>
          ) : (
            <Link href="/login" className="btn-gradient rounded-full px-4 py-2 text-sm">
              Giriş
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
