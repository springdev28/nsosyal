/** Proje formunun konu, topluluk ve oturum baglamini sunucuda hazirlar. */
import type { Metadata } from 'next';
import Link from 'next/link';

import { SectionHeader, Icon } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { locationLabel } from '@/lib/geo';

import { ProjectForm } from './ProjectForm';

export const metadata: Metadata = { title: 'Proje oluştur' };

export default async function CreateProjectPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const store = getStore();
  const communities = store
    .getMemberCommunityIds(viewer.id)
    .map((id) => store.getCommunity(id))
    .filter((community): community is NonNullable<typeof community> => Boolean(community))
    .map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      emoji: community.emoji,
      kind: community.kind,
    }));

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/create" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />Oluştur
        </Link>
      </p>

      <SectionHeader
        as="h1"
        title="Proje oluştur"
        description="Proje sayfası statik bir portfolyo değil; zamanla yaşayan bir üretim kaydıdır."
      />

      <ProjectForm
        topics={store.getTopics()}
        communities={communities}
        hasLocation={Boolean(viewer.provinceCode)}
        locationLabel={locationLabel(viewer.provinceCode, viewer.districtCode)}
      />
    </div>
  );
}
