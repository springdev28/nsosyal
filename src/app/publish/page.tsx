import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PublicationStudio } from '@/app/(app)/publish/PublicationStudio';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

export const metadata: Metadata = { title: 'Yayın Atölyesi' };

/**
 * Yayin Atolyesi ana sosyal uygulama kabugundan bagimsizdir.
 *
 * Bu rota sol ana menuyu ve populer sag seridi bilerek kullanmaz: gazete alani
 * tasarlarken tum ekran tuval, envanter ve denetim araclarina ayrilmalidir.
 */
export default async function PublishPage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');

  const store = getStore();
  const windows = store.listPublicationWindows();
  const drafts = store.listPublicationDrafts(viewer.id);
  const owners = Object.fromEntries(
    windows
      .flatMap((window) => window.slots)
      .map((slot) => store.getProfile(slot.ownerId))
      .filter((profile) => Boolean(profile))
      .map((profile) => [
        profile!.id,
        {
          id: profile!.id,
          username: profile!.username,
          displayName: profile!.displayName,
          avatarTone: profile!.avatarTone,
          kind: profile!.kind,
          visible: profile!.publicationReservationVisible !== false,
          canMessage: (profile!.publicationMessages ?? 'everyone') === 'everyone',
        },
      ]),
  );

  return (
    <div className="app-shell min-h-dvh">
      <a href="#studio-main" className="skip-link">
        Çalışma alanına atla
      </a>
      <main id="studio-main">
        <PublicationStudio
          viewerId={viewer.id}
          windows={windows}
          initialDrafts={drafts}
          owners={owners}
          anonymousByDefault={viewer.publicationAnonymousByDefault ?? false}
          initialSubscriber={viewer.publicationSubscriber === true}
        />
      </main>
    </div>
  );
}
