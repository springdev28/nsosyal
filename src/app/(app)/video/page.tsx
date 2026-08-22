/** Kisa video akisinda baglam, metin esdegeri ve sosyal eylemleri birlikte sunar. */
import type { Metadata } from 'next';
import Link from 'next/link';

import { toggleLike, toggleSave } from '@/actions/social';
import { Avatar, Badge, ChipRow, EmptyState, FilterChip, InfoNote, Icon } from '@/components/ui';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { formatRelative } from '@/lib/time';
import type { Post } from '@/types/domain';

export const metadata: Metadata = { title: 'Kısa videolar' };

const KINDS: Array<{ value: NonNullable<Post['videoKind']> | 'all'; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'gundelik', label: 'Gündelik' },
  { value: 'pitch', label: 'Pitch' },
  { value: 'demo', label: 'Demo' },
  { value: 'ilerleme', label: 'İlerleme' },
  { value: 'nasil', label: 'Nasıl' },
  { value: 'neden', label: 'Neden' },
  { value: 'soru', label: 'Soru' },
];

/**
 * Kisa video akisi (PROJECT_SPEC 7.2).
 *
 * Dikey format ve baglam kartlari: her videodan projeye, topluluğa veya
 * etkinlige gecilebilir. Otomatik oynatma yoktur; ses ve oynatma kullanicinin
 * kontrolundedir (erisilebilirlik).
 */
export default async function VideoFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const viewer = await getViewer();
  const store = getStore();

  const kind = KINDS.find((entry) => entry.value === params.kind)?.value ?? 'all';
  const all = store.getFeed({ viewerId: viewer?.id ?? null, shortVideoOnly: true, limit: 40 });
  const videos = kind === 'all' ? all : all.filter((view) => view.post.videoKind === kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Kısa videolar</h1>
        <Link
          href="/feed"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
        ><Icon name="arrowLeft" size={15} />Ana akış
        </Link>
      </div>

      <ChipRow label="Video türü">
        {KINDS.map((entry) => (
          <FilterChip
            key={entry.value}
            href={entry.value === 'all' ? '/video' : `/video?kind=${entry.value}`}
            active={kind === entry.value}
          >
            {entry.label}
          </FilterChip>
        ))}
      </ChipRow>

      <InfoNote icon="video">
        Videolar sentetik demo klipleridir. Ses kullanıcının kontrolündedir; her klibin metin karşılığı vardır.
      </InfoNote>

      {videos.length === 0 ? (
        <EmptyState
          icon="video"
          title="Bu türde video yok"
          description="Başka bir tür seçebilir veya tüm videolara dönebilirsin."
          action={
            <Link href="/video" className="text-sm font-semibold text-accent underline">
              Tüm videolar
            </Link>
          }
        />
      ) : (
        <ol className="space-y-5">
          {videos.map((view) => {
            const media = view.media.find((entry) => entry.mediaType === 'video');
            if (!media) return null;

            return (
              <li key={view.post.id} className="mx-auto max-w-[420px]">
                <article className="card overflow-hidden">
                  <VideoPlayer media={media} />

                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${view.author.username}`} className="shrink-0">
                        <Avatar profile={view.author} size={36} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${view.author.username}`}
                          className="block truncate text-sm font-semibold hover:underline"
                        >
                          {view.author.displayName}
                        </Link>
                        <p className="truncate text-xs text-fg-subtle">
                          <time dateTime={view.post.createdAt}>{formatRelative(view.post.createdAt)}</time>
                          {view.districtName || view.provinceName
                            ? ` · ${view.districtName ?? view.provinceName}`
                            : ''}
                        </p>
                      </div>
                      {view.post.videoKind ? (
                        <Badge tone="neutral">
                          {KINDS.find((entry) => entry.value === view.post.videoKind)?.label}
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm">{view.post.body}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {view.project ? (
                        <Link
                          href={`/projects/${view.project.slug}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
                        >
                          Projeyi incele
                        </Link>
                      ) : null}
                      {view.community ? (
                        <Link
                          href={`/communities/${view.community.slug}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
                        >
                          Topluluğa git
                        </Link>
                      ) : null}
                      {view.whyStory ? (
                        <Link
                          href={`/explore/why/${view.whyStory.id}`}
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold hover:bg-bg-sunken"
                        >
                          <span aria-hidden="true">💭</span> Neden hikâyesi
                        </Link>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center gap-1">
                      <form action={toggleLike}>
                        <input type="hidden" name="postId" value={view.post.id} />
                        <input type="hidden" name="revalidate" value="/video" />
                        <button
                          type="submit"
                          aria-pressed={view.viewerLiked}
                          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-bg-sunken ${
                            view.viewerLiked ? 'font-semibold text-danger' : 'text-fg-muted'
                          }`}
                        >
                          <span aria-hidden="true">{view.viewerLiked ? '❤️' : '🤍'}</span>
                          {view.post.likeCount}
                          <span className="sr-only">beğeni</span>
                        </button>
                      </form>

                      <Link
                        href={`/posts/${view.post.id}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted hover:bg-bg-sunken"
                      >
                        <span aria-hidden="true">💬</span>
                        {view.post.commentCount}
                        <span className="sr-only">yorum</span>
                      </Link>

                      <form action={toggleSave} className="ml-auto">
                        <input type="hidden" name="postId" value={view.post.id} />
                        <input type="hidden" name="revalidate" value="/video" />
                        <button
                          type="submit"
                          aria-pressed={view.viewerSaved}
                          className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-bg-sunken ${
                            view.viewerSaved ? 'font-semibold text-accent' : 'text-fg-muted'
                          }`}
                        >
                          <span aria-hidden="true">{view.viewerSaved ? '🔖' : '📑'}</span>
                          {view.viewerSaved ? 'Kaydedildi' : 'Kaydet'}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
