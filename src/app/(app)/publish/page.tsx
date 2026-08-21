import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

import { PublicationStudio } from './PublicationStudio';

export const metadata: Metadata = { title: 'Yayın Atölyesi' };

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
    <PublicationStudio
      viewerId={viewer.id}
      windows={windows}
      initialDrafts={drafts}
      owners={owners}
      anonymousByDefault={viewer.publicationAnonymousByDefault ?? false}
    />
  );
}
