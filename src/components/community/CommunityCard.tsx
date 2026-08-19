import Link from 'next/link';

import { joinCommunity, leaveCommunity } from '@/actions/social';
import { AvatarStack, Badge, Icon } from '@/components/ui';
import { CoverTile } from '@/components/ui/CoverTile';
import type { ProfileSummary } from '@/types/view';

/**
 * Topluluk karti.
 *
 * nsosyal.com'daki topluluk izgarasindan alinmistir: ustte kapak gorseli,
 * altta ad, uye sayisi ve ust uste binen uye avatarlari. Kapak gorseli yerine
 * varliktan turetilen gradyan doku kullanilir (gercek fotograf yok).
 */
export function CommunityCard({
  slug,
  name,
  emoji,
  description,
  memberCount,
  kind,
  place,
  members,
  isMember,
  communityId,
  revalidate,
}: {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  memberCount: number;
  kind: 'root' | 'branch';
  place: string | null;
  members: Array<Pick<ProfileSummary, 'avatarTone' | 'displayName' | 'kind'>>;
  isMember: boolean;
  communityId: string;
  revalidate: string;
}) {
  return (
    <article className="card flex h-full flex-col overflow-hidden transition-colors hover:border-accent-line">
      <Link href={`/communities/${slug}`} tabIndex={-1} aria-hidden="true">
        <CoverTile seed={slug} glyph={emoji} height={104} />
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 font-bold leading-snug">
            <Link href={`/communities/${slug}`} className="hover:text-accent">
              {name}
            </Link>
          </h3>
          <Badge tone={kind === 'root' ? 'accent' : 'neutral'}>{kind === 'root' ? 'Kök' : 'Dal'}</Badge>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Icon name="users" size={13} />
          {memberCount.toLocaleString('tr-TR')} üye
          {place ? (
            <>
              <span aria-hidden="true">·</span>
              <Icon name="mapPin" size={13} />
              {place}
            </>
          ) : null}
        </p>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-fg-muted">{description}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          {members.length > 0 ? <AvatarStack profiles={members} size={26} max={4} /> : <span />}

          {isMember ? (
            <form action={leaveCommunity}>
              <input type="hidden" name="communityId" value={communityId} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-fg-muted ring-1 ring-[var(--border)] transition-colors hover:bg-bg-hover hover:text-fg"
              >
                <Icon name="check" size={14} />
                Üyesin
              </button>
            </form>
          ) : (
            <form action={joinCommunity}>
              <input type="hidden" name="communityId" value={communityId} />
              <input type="hidden" name="revalidate" value={revalidate} />
              <button
                type="submit"
                className="btn-gradient inline-flex min-h-9 items-center rounded-full px-4 text-sm"
              >
                Katıl
              </button>
            </form>
          )}
        </div>
      </div>
    </article>
  );
}
