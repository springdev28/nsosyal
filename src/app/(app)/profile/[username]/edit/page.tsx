/** Profil duzenlemeyi yalnizca hesap sahibine acar ve mevcut form degerlerini yukler. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Icon, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';

import { ProfileEditForm } from './ProfileEditForm';

export const metadata: Metadata = { title: 'Profili düzenle' };

export default async function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const viewer = await getViewer();
  if (!viewer || viewer.username !== username) notFound();

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Profili düzenle"
        description="Fotoğrafını, kapağını ve profilinde görünen bilgileri yönet."
        action={<Link href={`/profile/${viewer.username}`} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-fg-muted hover:bg-bg-hover"><Icon name="arrowLeft" size={16} />Profile dön</Link>}
      />
      <ProfileEditForm profile={viewer} />
    </div>
  );
}
