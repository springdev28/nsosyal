'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FiveNMark } from '@/components/brand/FiveNMark';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { Profile } from '@/types/domain';

/**
 * Sol ana gezinme.
 *
 * nsosyal.com yerlesimi: ikon + etiket satirlari, aktif ogede dolgulu hap ve
 * dolu ikon, en altta camgobegi -> mavi gradyan "Yeni Gonderi" hap dugmesi ve
 * tema anahtari.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Alt navigasyonda gosterilsin mi? Mobilde yalnizca bes ogeye yer var. */
  mobile: boolean;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/feed',
    label: 'Ana Sayfa',
    icon: 'home',
    mobile: true,
    match: (p) => p === '/feed' || p.startsWith('/video') || p.startsWith('/posts'),
  },
  {
    href: '/notifications',
    label: 'Bildirimler',
    icon: 'bell',
    mobile: false,
    match: (p) => p.startsWith('/notifications'),
  },
  {
    href: '/explore',
    label: 'Keşfet',
    icon: 'compass',
    mobile: true,
    match: (p) => p.startsWith('/explore'),
  },
  {
    href: '/communities',
    label: 'Topluluklar',
    icon: 'users',
    mobile: true,
    match: (p) => p.startsWith('/communities'),
  },
  {
    href: '/projects',
    label: 'Projeler',
    icon: 'beaker',
    mobile: false,
    match: (p) => p.startsWith('/projects'),
  },
  {
    href: '/newspaper',
    label: 'nGazete',
    icon: 'newspaper',
    mobile: true,
    match: (p) => p.startsWith('/newspaper'),
  },
  {
    href: '/settings',
    label: 'Ayarlar',
    icon: 'settings',
    mobile: false,
    match: (p) => p.startsWith('/settings'),
  },
];

export function MainNav({
  viewer,
  unreadCount,
  hasNewIssue,
}: {
  viewer: Profile | null;
  unreadCount: number;
  hasNewIssue: boolean;
}) {
  const pathname = usePathname();
  const canModerate = viewer?.role === 'moderator' || viewer?.role === 'admin';

  const items: NavItem[] = [
    ...NAV_ITEMS.slice(0, 6),
    // Spec 4.3 ana gezinmede Profil'i alti bolumden biri olarak sayiyor;
    // profile yalnizca sag paneldeki avatardan ulasilmasi eksikti.
    {
      href: viewer ? `/profile/${viewer.username}` : '/login',
      label: 'Profil',
      icon: 'users',
      mobile: true,
      match: (p) => p.startsWith('/profile') && !p.includes('kaydedilenler'),
    },
    {
      href: viewer ? `/profile/${viewer.username}?tab=kaydedilenler` : '/feed',
      label: 'Kaydedilenler',
      icon: 'bookmark',
      mobile: false,
      match: (p) => p.startsWith('/profile') && p.includes('kaydedilenler'),
    },
    NAV_ITEMS[6],
    ...(canModerate
      ? [
          {
            href: '/admin',
            label: 'Yönetim',
            icon: 'shield' as IconName,
            mobile: false,
            match: (p: string) => p.startsWith('/admin'),
          },
        ]
      : []),
    {
      href: '/about',
      label: 'Hakkında',
      icon: 'info',
      mobile: false,
      match: (p) => p.startsWith('/about'),
    },
  ];

  return (
    <nav aria-label="Ana gezinme" className="hidden w-[236px] shrink-0 lg:block xl:w-[268px]">
      <div className="rail flex flex-col gap-1 py-3 pr-2">
        {/* Gezinmede yalnizca N isareti durur; kelime markasi yoktur. */}
        <Link
          href="/feed"
          aria-label="nSosyal ana sayfa"
          className="mb-3 inline-flex w-fit rounded-xl px-2 py-2"
        >
          <FiveNMark size={44} animated />
        </Link>

        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.match(pathname);
            const badge =
              item.href === '/notifications' ? unreadCount : item.href === '/newspaper' && hasNewIssue ? -1 : 0;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex min-h-12 items-center gap-3.5 rounded-2xl px-3.5 text-[0.98rem] transition-colors ${
                    active ? 'bg-accent-soft font-bold text-accent' : 'text-fg-muted hover:bg-bg-hover hover:text-fg'
                  }`}
                >
                  <span className="relative flex">
                    <Icon name={item.icon} size={22} filled={active} strokeWidth={1.9} />
                    {badge > 0 ? (
                      <span className="absolute -right-2 -top-1.5 min-w-[1.05rem] rounded-full bg-accent px-1 text-center text-[0.62rem] font-bold leading-[1.05rem] text-accent-fg">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                    {badge === -1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-accent"
                      />
                    ) : null}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {badge > 0 ? <span className="sr-only">{badge} okunmamış</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/create"
          className="btn-gradient mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-[0.95rem]"
        >
          <Icon name="plus" size={18} strokeWidth={2.4} />
          Yeni Gönderi
        </Link>

        <div className="mt-3 border-t border-line pt-3">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

/**
 * Acik/koyu tema anahtari.
 *
 * Tercih localStorage'da tutulur ve <html data-theme> uzerinden uygulanir.
 * Secim yapilmadiginda sistem tercihi gecerlidir.
 */
function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      window.localStorage.setItem('nsosyal-theme', next);
    } catch {
      // Depolama kapaliysa tercih yalnizca bu oturum icin gecerli olur.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-[0.95rem] text-fg-muted transition-colors hover:bg-bg-hover hover:text-fg"
    >
      <Icon name="globe" size={20} />
      <span>Görünüm</span>
      <span className="ml-auto rounded-full bg-bg-sunken px-2 py-1 text-[0.7rem] font-semibold ring-1 ring-[var(--border)]">
        Aç / Koyu
      </span>
    </button>
  );
}

export function MobileNav({
  hasNewIssue,
  viewer,
}: {
  hasNewIssue: boolean;
  viewer: Profile | null;
}) {
  const pathname = usePathname();
  // Spec 4.3'teki alti ana bolum: Ana Akis, Kesfet, Olustur, Topluluklar,
  // nGazete, Profil.
  const items = [
    NAV_ITEMS[0],
    NAV_ITEMS[2],
    { href: '/create', label: 'Oluştur', icon: 'plus' as IconName, mobile: true, match: (p: string) => p.startsWith('/create') },
    NAV_ITEMS[3],
    NAV_ITEMS[5],
    {
      href: viewer ? `/profile/${viewer.username}` : '/login',
      label: 'Profil',
      icon: 'users' as IconName,
      mobile: true,
      match: (p: string) => p.startsWith('/profile'),
    },
  ];

  return (
    <nav
      aria-label="Ana gezinme"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl">
        {items.map((item) => {
          const active = item.match(pathname);
          const isCreate = item.href === '/create';
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.65rem] ${
                  active ? 'font-semibold text-accent' : 'text-fg-subtle'
                }`}
              >
                {isCreate ? (
                  <span className="btn-gradient flex h-8 w-11 items-center justify-center rounded-full">
                    <Icon name="plus" size={18} strokeWidth={2.4} />
                  </span>
                ) : (
                  <Icon name={item.icon} size={21} filled={active} />
                )}
                {item.label}
                {item.href === '/newspaper' && hasNewIssue ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-[24%] top-2 h-1.5 w-1.5 rounded-full bg-accent"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
