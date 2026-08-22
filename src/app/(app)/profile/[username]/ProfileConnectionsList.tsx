/** Takipci/takip listelerinde ortak profil kartini ve takip eylemini tekrar kullanir. */
import Link from 'next/link';

import { toggleFollow } from '@/actions/social';
import { Avatar, Card, DemoBadge, EmptyState, VerifiedMark } from '@/components/ui';
import type { ProfileSummary } from '@/types/view';

export function ProfileConnectionsList({
  title,
  description,
  profiles,
  viewerId,
  followingIds,
  pendingIds,
  revalidate,
}: {
  title: string;
  description: string;
  profiles: ProfileSummary[];
  viewerId: string | null;
  followingIds: string[];
  pendingIds: string[];
  revalidate: string;
}) {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-black tracking-tight">{title}</h1><p className="mt-1 text-sm text-fg-muted">{description}</p></div>
      {profiles.length === 0 ? (
        <EmptyState icon="users" title="Liste henüz boş" description="Bağlantılar kurulduğunda hesaplar burada görünür." />
      ) : (
        <Card as="ul" className="divide-y divide-line overflow-hidden">
          {profiles.map((profile) => {
            const isSelf = profile.id === viewerId;
            const following = followingIds.includes(profile.id);
            const pending = pendingIds.includes(profile.id);
            return (
              <li key={profile.id} className="flex items-center gap-3 p-4">
                <Link href={`/profile/${profile.username}`} className="shrink-0" aria-label={`${profile.displayName} profili`}><Avatar profile={profile} size={48} /></Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><Link href={`/profile/${profile.username}`} className="truncate font-bold hover:underline">{profile.displayName}</Link>{profile.verified ? <VerifiedMark kind={profile.kind} /> : null}<DemoBadge /></div>
                  <p className="truncate text-sm text-fg-subtle">@{profile.username}</p>
                </div>
                {viewerId && !isSelf ? (
                  <form action={toggleFollow}>
                    <input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="revalidate" value={revalidate} />
                    <button type="submit" className={`min-h-10 rounded-full px-4 text-sm font-semibold ${following || pending ? 'border border-line-strong' : 'bg-accent text-accent-fg'}`}>{following ? 'Takiptesin' : pending ? 'İstek gönderildi' : 'Takip et'}</button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </Card>
      )}
    </div>
  );
}
