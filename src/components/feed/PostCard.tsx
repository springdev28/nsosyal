import Link from 'next/link';

import { toggleLike, toggleSave } from '@/actions/social';
import { Avatar, Badge, Card, DemoBadge, DimensionChip, VerifiedMark } from '@/components/ui';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { formatEventRange, formatRelative } from '@/lib/time';
import type { PostView } from '@/types/view';

const POST_TYPE_LABEL: Record<string, string> = {
  question: 'Soru',
  project_update: 'Proje güncellemesi',
  event_announcement: 'Etkinlik duyurusu',
  resource_suggestion: 'Kaynak önerisi',
  why_link: 'Neden hikâyesi',
};

/**
 * Ana akis gonderi karti (PROJECT_SPEC 7.1).
 *
 * Tanidik sosyal medya duzeni korunur. 5N chipleri yalnizca gercekten var olan
 * baglamlar icin gosterilir; kartin ustu gereksiz etiketle doldurulmaz.
 */
export function PostCard({ view, revalidate = '/feed' }: { view: PostView; revalidate?: string }) {
  const { post, author, community, media, project, event, whyStory, resource, chips } = view;
  const typeLabel = POST_TYPE_LABEL[post.type];
  const images = media.filter((item) => item.mediaType === 'image');
  const video = media.find((item) => item.mediaType === 'video');

  return (
    <Card as="article" className="p-4">
      <header className="flex items-start gap-3">
        <Link href={`/profile/${author.username}`} className="shrink-0">
          <Avatar profile={author} size={44} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/profile/${author.username}`} className="font-semibold hover:underline">
              {author.displayName}
            </Link>
            {author.verified ? <VerifiedMark kind={author.kind} /> : null}
            <DemoBadge />
          </div>
          <p className="text-sm text-fg-subtle">
            <span>@{author.username}</span>
            <span aria-hidden="true"> · </span>
            <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
            {community ? (
              <>
                <span aria-hidden="true"> · </span>
                <Link href={`/communities/${community.slug}`} className="hover:underline">
                  <span aria-hidden="true">{community.emoji}</span> {community.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>

        {typeLabel ? <Badge tone="neutral">{typeLabel}</Badge> : null}
      </header>

      {view.reason ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <span aria-hidden="true">✨</span>
          <span className="font-medium">Neden gösteriliyor?</span>
          <span>{view.reason.label}</span>
        </p>
      ) : null}

      <div className="mt-3 whitespace-pre-line text-[0.97rem] leading-relaxed">{post.body}</div>

      {video ? (
        <div className="mt-3">
          <VideoPlayer media={video} className="max-h-[70dvh]" />
        </div>
      ) : null}

      {images.length > 0 ? (
        <ul className={`mt-3 grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((image) => (
            <li key={image.id} className="overflow-hidden rounded-xl border border-line">
              {/* Sentetik SVG demo gorselleri; harici host yok, bu yuzden <img> yeterli. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.storagePath} alt={image.altText} className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      ) : null}

      {project ? (
        <Link
          href={`/projects/${project.slug}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-bg-sunken p-3 transition-colors hover:border-accent"
        >
          <span aria-hidden="true" className="text-2xl">
            {project.emoji}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-fg-subtle">Proje</span>
            <span className="block truncate font-medium">{project.title}</span>
            <span className="block truncate text-sm text-fg-muted">{project.summary}</span>
          </span>
          <span aria-hidden="true" className="ml-auto text-fg-subtle">
            →
          </span>
        </Link>
      ) : null}

      {event ? (
        <Link
          href={`/events/${event.slug}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-bg-sunken p-3 transition-colors hover:border-accent"
        >
          <span aria-hidden="true" className="text-2xl">
            {event.emoji}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-fg-subtle">Etkinlik</span>
            <span className="block truncate font-medium">{event.title}</span>
            <span className="block truncate text-sm text-fg-muted">
              {formatEventRange(event.startsAt, event.endsAt)}
              {event.districtName || event.provinceName
                ? ` · ${[event.provinceName, event.districtName].filter(Boolean).join(' / ')}`
                : ''}
            </span>
          </span>
          <span aria-hidden="true" className="ml-auto text-fg-subtle">
            →
          </span>
        </Link>
      ) : null}

      {whyStory ? (
        <Link
          href={`/explore/why/${whyStory.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-bg-sunken p-3 transition-colors hover:border-accent"
        >
          <span aria-hidden="true" className="text-2xl">
            💭
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-fg-subtle">
              Neden hikâyesi
            </span>
            <span className="block truncate font-medium">{whyStory.title}</span>
          </span>
          <span aria-hidden="true" className="ml-auto text-fg-subtle">
            →
          </span>
        </Link>
      ) : null}

      {resource ? (
        <Link
          href={`/explore/how?resource=${resource.id}`}
          className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-bg-sunken p-3 transition-colors hover:border-accent"
        >
          <span aria-hidden="true" className="text-2xl">
            🧭
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-fg-subtle">Kaynak</span>
            <span className="block truncate font-medium">{resource.title}</span>
            <span className="block text-sm text-fg-muted">
              {levelLabel(resource.level)} · {resource.estimatedMinutes} dk
              {resource.verified ? ' · Moderatör doğrulamalı' : ''}
            </span>
          </span>
          <span aria-hidden="true" className="ml-auto text-fg-subtle">
            →
          </span>
        </Link>
      ) : null}

      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Bağlam etiketleri">
          {chips.map((chip) => (
            <li key={`${chip.dimension}-${chip.label}`}>
              <DimensionChip chip={chip} />
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        <form action={toggleLike}>
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="revalidate" value={revalidate} />
          <button
            type="submit"
            aria-pressed={view.viewerLiked}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-bg-sunken ${
              view.viewerLiked ? 'font-semibold text-danger' : 'text-fg-muted'
            }`}
          >
            <span aria-hidden="true">{view.viewerLiked ? '❤️' : '🤍'}</span>
            <span>{post.likeCount}</span>
            <span className="sr-only">beğeni{view.viewerLiked ? ', beğendin' : ''}</span>
          </button>
        </form>

        <Link
          href={`/posts/${post.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted hover:bg-bg-sunken"
        >
          <span aria-hidden="true">💬</span>
          <span>{post.commentCount}</span>
          <span className="sr-only">yorum</span>
        </Link>

        <span className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm text-fg-muted">
          <span aria-hidden="true">🔁</span>
          <span>{post.repostCount}</span>
          <span className="sr-only">yeniden paylaşım</span>
        </span>

        <form action={toggleSave} className="ml-auto">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="revalidate" value={revalidate} />
          <button
            type="submit"
            aria-pressed={view.viewerSaved}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm hover:bg-bg-sunken ${
              view.viewerSaved ? 'font-semibold text-accent' : 'text-fg-muted'
            }`}
          >
            <span aria-hidden="true">{view.viewerSaved ? '🔖' : '📑'}</span>
            <span>{view.viewerSaved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </form>
      </footer>
    </Card>
  );
}

function levelLabel(level: string): string {
  switch (level) {
    case 'baslangic':
      return 'Başlangıç';
    case 'orta':
      return 'Orta';
    case 'ileri':
      return 'İleri';
    default:
      return level;
  }
}
