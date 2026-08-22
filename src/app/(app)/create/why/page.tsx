/** Neden hikayesi formuna baglanabilir proje ve konu seceneklerini saglar. */
import type { Metadata } from 'next';
import Link from 'next/link';

import { SectionHeader, Icon } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';

import { WhyForm } from './WhyForm';

export const metadata: Metadata = { title: 'Neden hikâyesi yaz' };

export default async function CreateWhyPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const store = getStore();
  // Yalnizca kullanicinin kendi projelerine baglanabilir.
  const projects = store.listProjects().filter((project) => {
    const record = store.getProjectBySlug(project.slug);
    return record?.ownerId === viewer.id;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/create" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />Oluştur
        </Link>
      </p>

      <SectionHeader
        as="h1"
        title="Neden hikâyesi yaz"
        description="Seni bu işe, projeye, alana veya başarıya ne götürdü?"
      />

      <WhyForm
        topics={store.getTopics()}
        projects={projects}
        hasLocation={Boolean(viewer.provinceCode)}
        locationLabel={locationLabel(viewer.provinceCode, viewer.districtCode)}
      />
    </div>
  );
}
