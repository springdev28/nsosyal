import Link from 'next/link';

import { toggleLike, toggleSave } from '@/actions/social';
import { Avatar, Badge, DemoBadge, DimensionChip, Icon, VerifiedMark } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { formatEventRange, formatRelative } from '@/lib/time';
import type { PostView } from '@/types/view';

const POST_TYPE_LABEL: Record<string, string> = {
  question: 'Soru',
  project_update: 'Proje güncellemesi',
  event_announcement: 'Etkinlik',
  resource_suggestion: 'Kaynak',
  why_link: 'Neden',
};

/**
 * Ana akis gonderi karti.
 *
 * Yerlesim nsosyal.com'daki gonderi kartindan alinmistir: avatar, kalin ad,
 * dogrulama isareti, @kullanici · sure, sagda menu; altta metin, medya ve
 * etkilesim satiri. 5N chipleri yalnizca gercekten var olan baglamlar icin
 * gosterilir (PROJECT_SPEC 7.1).
 */
export function PostCard({ view, revalidate = '/feed' }: { view: PostView; revalidate?: string }) {
  const { post, author, community, media, project, event, whyStory, resource, chips } = view;
  const typeLabel = POST_TYPE_LABEL[post.type];
  const images = media.filter((item) => item.mediaType === 'image');
  const video = media.find((item) => item.mediaType === 'video');

  return (
    <article className="border-b border-line px-1 py-4 transition-colors last:border-b-0 hover:bg-bg-raised/40 sm:px-3">
      <div className="flex gap-3">
        <Link href={`/profile/${author.username}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <Avatar profile={author} size={44} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-[0.95rem] leading-tight">
              <Link href={`/profile/${author.username}`} className="font-bold hover:underline">
                {author.displayName}
              </Link>
              {author.verified ? (
                <span className="ml-1 inline-flex translate-y-0.5">
                  <VerifiedMark kind={author.kind} />
                </span>
              ) : null}
              <span className="ml-1.5 text-fg-subtle">
                @{author.username}
                <span aria-hidden="true"> · </span>
                <time dateTime={post.createdAt}>{formatRelative(post.createdAt)}</time>
              </span>
              <span className="ml-1.5 inline-flex translate-y-px">
                <DemoBadge />
              </span>
            </p>

            {typeLabel ? <Badge tone="neutral">{typeLabel}</Badge> : null}
          </div>

          {community ? (
            <p className="text-[0.82rem]">
              {/* Dokunma hedefi en az 24px: WCAG 2.2 target-size. */}
              <Link
                href={`/communities/${community.slug}`}
                className="inline-flex min-h-6 items-center gap-1.5 text-fg-muted transition-colors hover:text-accent"
              >
                <Icon name="users" size={13} />
                {community.name}
              </Link>
            </p>
          ) : null}

          {view.reason ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-bg-sunken px-2.5 py-1 text-[0.75rem] text-fg-muted ring-1 ring-[var(--border)]">
              <Icon name="sparkles" size={13} className="text-accent" />
              <span className="font-medium text-fg">Neden gösteriliyor?</span>
              <span>{view.reason.label}</span>
            </p>
          ) : null}

          <div className="mt-2 whitespace-pre-line text-[0.95rem] leading-[1.55]">{post.body}</div>

          {video ? (
            <div className="mt-3">
              <VideoPlayer media={video} />
            </div>
          ) : null}

          {images.length > 0 ? (
            <ul className={`mt-3 grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {images.map((image) => (
                <li key={image.id} className="overflow-hidden rounded-2xl border border-line">
                  {/* Sentetik SVG demo gorselleri; harici host yok. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.storagePath} alt={image.altText} className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : null}

          {project ? (
            <LinkedCard
              href={`/projects/${project.slug}`}
              seed={project.slug}
              glyph={project.emoji}
              kicker="Proje"
              title={project.title}
              subtitle={project.summary}
            />
          ) : null}

          {event ? (
            <LinkedCard
              href={`/events/${event.slug}`}
              seed={event.slug}
              glyph={event.emoji}
              kicker="Etkinlik"
              title={event.title}
              subtitle={`${formatEventRange(event.startsAt, event.endsAt)}${
                event.provinceName ? ` · ${[event.provinceName, event.districtName].filter(Boolean).join(' / ')}` : ''
              }`}
            />
          ) : null}

          {whyStory ? (
            <LinkedCard
              href={`/explore/why/${whyStory.id}`}
              seed={whyStory.id}
              glyph="💭"
              kicker="Neden hikâyesi"
              title={whyStory.title}
              subtitle={whyStory.hasVideo ? 'Video anlatım' : undefined}
            />
          ) : null}

          {resource ? (
            <LinkedCard
              href={`/explore/how?resource=${resource.id}`}
              seed={resource.id}
              glyph="🧭"
              kicker="Kaynak"
              title={resource.title}
              subtitle={`${levelLabel(resource.level)} · ${resource.estimatedMinutes} dk${
                resource.verified ? ' · Moderatör doğrulamalı' : ''
              }`}
            />
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

          <div className="-ml-2 mt-2 flex max-w-md items-center justify-between">
            <form action={toggleLike}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <ActionButton
                icon="heart"
                count={post.likeCount}
                label="beğeni"
                active={view.viewerLiked}
                activeClass="text-danger"
              />
            </form>

            <Link
              href={`/posts/${post.id}`}
              className="group inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[0.82rem] text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <Icon name="message" size={18} />
              <span>{post.commentCount}</span>
              <span className="sr-only">yorum</span>
            </Link>

            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[0.82rem] text-fg-muted">
              <Icon name="repeat" size={18} />
              <span>{post.repostCount}</span>
              <span className="sr-only">yeniden paylaşım</span>
            </span>

            <form action={toggleSave}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <ActionButton
                icon="bookmark"
                label={view.viewerSaved ? 'kaydedildi' : 'kaydet'}
                active={view.viewerSaved}
                activeClass="text-accent"
              />
            </form>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  count,
  label,
  active,
  activeClass,
}: {
  icon: 'heart' | 'bookmark';
  count?: number;
  label: string;
  active: boolean;
  activeClass: string;
}) {
  return (
    <button
      type="submit"
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[0.82rem] transition-colors hover:bg-bg-hover ${
        active ? `${activeClass} font-semibold` : 'text-fg-muted'
      }`}
    >
      <Icon name={icon} size={18} filled={active} />
      {count === undefined ? null : <span>{count}</span>}
      <span className="sr-only">
        {label}
        {active ? ', etkin' : ''}
      </span>
    </button>
  );
}

function LinkedCard({
  href,
  seed,
  glyph,
  kicker,
  title,
  subtitle,
}: {
  href: string;
  seed: string;
  glyph: string;
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-bg-sunken p-3 transition-colors hover:border-accent-line hover:bg-bg-hover"
    >
      <CoverBadge seed={seed} glyph={glyph} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-fg-subtle">
          {kicker}
        </span>
        <span className="block truncate font-semibold">{title}</span>
        {subtitle ? <span className="block truncate text-sm text-fg-muted">{subtitle}</span> : null}
      </span>
      <Icon name="chevronRight" size={18} className="shrink-0 text-fg-subtle" />
    </Link>
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
