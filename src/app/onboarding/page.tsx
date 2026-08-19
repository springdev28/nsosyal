import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { DISTRICT_DATA_PROVINCES, DISTRICTS, PROVINCES } from '@/lib/geo';

import { OnboardingForm } from './OnboardingForm';

export const metadata: Metadata = { title: 'Başlangıç' };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Hoş geldin</h1>
        <p className="mt-1 text-fg-muted">
          Beş kısa adım. Hiçbiri zorunlu bilgi istemiyor; konum tamamen sana bağlı.
        </p>
      </header>

      <OnboardingForm
        topics={getStore().getTopics()}
        provinces={[...PROVINCES]}
        districts={[...DISTRICTS]}
        districtDataProvinces={DISTRICT_DATA_PROVINCES}
        defaultUsername={viewer.username}
        defaultBio={viewer.bio}
      />
    </div>
  );
}
