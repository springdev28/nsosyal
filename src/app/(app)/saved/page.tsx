/** Kaydedilen gonderileri kullaniciya ozel bir koleksiyon olarak sunar. */
import type { Metadata } from 'next';

import { PostCard } from '@/components/feed/PostCard';
import { EmptyState, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

export const metadata: Metadata = { title: 'Kaydedilenler' };

/**
 * Kaydetme eylemi ana akista gecici bir ikon durumundan ibaret kalmamali.
 * Bu rota ayni DemoStore gorunumlerini kullanir; boylece kartlar ve gizlilik
 * kurallari ana akisla ayrismaz.
 */
export default async function SavedPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const posts = getStore().listSavedPosts(viewer.id);

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Kaydedilenler"
        description="Daha sonra dönmek için ayırdığın gönderiler. Bu listeyi yalnızca sen görebilirsin."
      />

      {posts.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Henüz kaydettiğin gönderi yok"
          description="Bir gönderideki kaydet simgesine bastığında burada görünür."
        />
      ) : (
        <ol>
          {posts.map((view) => (
            <li key={view.post.id}>
              <PostCard view={view} revalidate="/saved" />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
