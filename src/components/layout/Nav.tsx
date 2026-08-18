'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Profile } from '@/types/domain';

/**
 * Ana gezinme (PROJECT_SPEC 4.3).
 * nGazete kasitli olarak ayirt edilebilir bir dugme; yeni sayi varsa rozet tasir.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Alt navigasyonda gosterilsin mi? Mobilde yalnizca 5 ogeye yer var. */
  mobile: boolean;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/feed',
    label: 'Ana Akış',
    icon: '🏠',
    mobile: true,
    match: (p) => p === '/feed' || p.startsWith('/video'),
  },
  {
    href: '/explore',
    label: 'Keşfet',
    icon: '🧭',
    mobile: true,
    match: (p) => p.startsWith('/explore'),
  },
  {
    href: '/create',
    label: 'Oluştur',
    icon: '➕',
    mobile: true,
    match: (p) => p.startsWith('/create'),
  },
  {
    href: '/communities',
    label: 'Topluluklar',
    icon: '👥',
    mobile: true,
    match: (p) => p.startsWith('/communities'),
  },
  {
    href: '/newspaper',
    label: 'nGazete',
    icon: '📰',
    mobile: true,
    match: (p) => p.startsWith('/newspaper'),
  },
  {
    href: '/projects',
    label: 'Projeler',
    icon: '🧪',
    mobile: false,
    match: (p) => p.startsWith('/projects'),
  },
  {
    href: '/notifications',
    label: 'Bildirimler',
    icon: '🔔',
    mobile: false,
    match: (p) => p.startsWith('/notifications'),
  },
  {
    href: '/settings',
    label: 'Ayarlar',
    icon: '⚙️',
    mobile: false,
    match: (p) => p.startsWith('/settings'),
  },
];

export function MainNav({ hasNewIssue, viewer }: { hasNewIssue: boolean; viewer: Profile | null }) {
  const pathname = usePathname();
  const canModerate = viewer?.role === 'moderator' || viewer?.role === 'admin';

  return (
    <nav aria-label="Ana gezinme" className="hidden w-[212px] shrink-0 py-1 md:block lg:w-[240px]">
      <ul className="sticky top-[4.5rem] space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink item={item} active={item.match(pathname)} badge={item.href === '/newspaper' && hasNewIssue} />
          </li>
        ))}
        {canModerate ? (
          <li>
            <NavLink
              item={{
                href: '/admin',
                label: 'Yönetim',
                icon: '🛡️',
                mobile: false,
                match: (p) => p.startsWith('/admin'),
              }}
              active={pathname.startsWith('/admin')}
              badge={false}
            />
          </li>
        ) : null}
        <li>
          <NavLink
            item={{
              href: '/about',
              label: 'Hakkında',
              icon: 'ℹ️',
              mobile: false,
              match: (p) => p.startsWith('/about'),
            }}
            active={pathname.startsWith('/about')}
            badge={false}
          />
        </li>
      </ul>
    </nav>
  );
}

function NavLink({ item, active, badge }: { item: NavItem; active: boolean; badge: boolean }) {
  const isNewspaper = item.href === '/newspaper';
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors ${
        active ? 'bg-accent-soft font-semibold text-accent' : 'text-fg-muted hover:bg-bg-sunken'
      } ${isNewspaper ? 'border border-signal-300/60' : ''}`}
    >
      <span aria-hidden="true" className="text-lg">
        {item.icon}
      </span>
      <span>{item.label}</span>
      {badge ? (
        <span className="ml-auto rounded-full bg-signal-500 px-1.5 text-[0.65rem] font-bold text-white">
          Yeni
        </span>
      ) : null}
    </Link>
  );
}

export function MobileNav({ hasNewIssue }: { hasNewIssue: boolean }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav
      aria-label="Ana gezinme"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised/97 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.68rem] ${
                  active ? 'font-semibold text-accent' : 'text-fg-subtle'
                }`}
              >
                <span aria-hidden="true" className="text-lg">
                  {item.icon}
                </span>
                {item.label}
                {active ? (
                  <span aria-hidden="true" className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent" />
                ) : null}
                {item.href === '/newspaper' && hasNewIssue ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-signal-500"
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
