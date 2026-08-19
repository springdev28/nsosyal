import type { Metadata } from 'next';
import Link from 'next/link';

import { signOut } from '@/actions/auth';
import { Card, SectionHeader } from '@/components/ui';
import { getViewer, prefersReducedMotion } from '@/lib/auth/session';
import { DISTRICT_DATA_PROVINCES, DISTRICTS, PROVINCES } from '@/lib/geo';

import { SettingsForm } from './SettingsForm';

export const metadata: Metadata = { title: 'Ayarlar' };

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const reducedMotion = await prefersReducedMotion();

  return (
    <div className="space-y-4">
      <SectionHeader as="h1" title="Ayarlar" description="Gizlilik, konum, erişilebilirlik ve akış tercihleri." />

      <SettingsForm
        provinces={[...PROVINCES]}
        districts={[...DISTRICTS]}
        districtDataProvinces={DISTRICT_DATA_PROVINCES}
        initial={{
          bio: viewer.bio,
          intentMode: viewer.intentMode,
          goalKeys: viewer.goalKeys,
          locationVisibility: viewer.locationVisibility,
          provinceCode: viewer.provinceCode,
          districtCode: viewer.districtCode,
          reducedMotion,
        }}
      />

      <Card className="p-4">
        <h2 className="text-lg font-semibold">Oturum</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Demo hesabından çıkarsan giriş ekranına dönersin ve başka bir rolü deneyebilirsin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-xl border border-danger/40 bg-danger-soft px-4 text-sm font-semibold text-danger"
            >
              Çıkış yap
            </button>
          </form>
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
          >
            Proje hakkında
          </Link>
        </div>
      </Card>
    </div>
  );
}
