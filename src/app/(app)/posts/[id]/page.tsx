import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PostCard } from '@/components/feed/PostCard';
import { CommentForm } from '@/components/feed/CommentForm';
import { Avatar, Card, EmptyState, SectionHeader } from '@/components/ui';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';

export const metadata: Metadata = { title: 'Gönderi' };

/** Gonderi detayi ve yorumlar. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const store = getStore();

  const view = store.getPostView(id, viewer?.id ?? null);
  if (!view) notFound();

  const comments = store.getComments(id);

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/feed" className="text-fg-muted hover:underline">
          ← Ana akış
        </Link>
      </p>

      <PostCard view={view} revalidate={`/posts/${id}`} />

      <section aria-labelledby="comments-heading">
        <SectionHeader title={<span id="comments-heading">Yorumlar ({comments.length})</span>} />

        <CommentForm postId={id} />

        {comments.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="💬"
              title="Henüz yorum yok"
              description="İlk yorumu sen yazabilirsin. Soru sormak da bir yorumdur."
            />
          </div>
        ) : (
          <ol className="mt-3 space-y-2">
            {comments.map((entry) => (
              <li key={entry.comment.id}>
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${entry.author.username}`} className="shrink-0">
                      <Avatar profile={entry.author} size={36} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <Link href={`/profile/${entry.author.username}`} className="font-semibold hover:underline">
                          {entry.author.displayName}
                        </Link>
                        <span className="text-fg-subtle">
                          <span aria-hidden="true"> · </span>
                          <time dateTime={entry.comment.createdAt}>
                            {formatRelative(entry.comment.createdAt)}
                          </time>
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">{entry.comment.body}</p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
