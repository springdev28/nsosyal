import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui';
import { canModerate, getViewer } from '@/lib/auth/session';

/**
 * Yonetim alani erisim kontrolu.
 *
 * Rota korumasi sunucuda yapilir: navigasyonda baglantiyi gizlemek tek basina
 * bir guvenlik onlemi degildir (PROJECT_SPEC 11.3 "Admin rotalari rol kontrolu
 * olmadan acilmaz").
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!canModerate(viewer)) redirect('/feed');

  const isAdminUser = viewer?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Yönetim</h1>
        <Badge tone="accent">{isAdminUser ? 'Yönetici' : 'Moderatör'}</Badge>
      </div>

      <nav aria-label="Yönetim bölümleri">
        <ul className="flex flex-wrap gap-1.5 border-b border-line pb-2">
          <li>
            <Link
              href="/admin/moderation"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-fg-muted hover:bg-bg-sunken"
            >
              Topluluk başvuruları
            </Link>
          </li>
          <li>
            <Link
              href="/admin/reports"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-fg-muted hover:bg-bg-sunken"
            >
              Raporlar
            </Link>
          </li>
          <li>
            <Link
              href="/admin/newspaper"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-fg-muted hover:bg-bg-sunken"
            >
              Gazete ve ilanlar
            </Link>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  );
}
