import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';

import { ProfileConnectionsList } from '../ProfileConnectionsList';

export const metadata: Metadata = { title: 'Takip edilenler' };

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const store = getStore();
  const viewer = await getViewer();
  const profile = store.getProfileByUsername(username);
  if (!profile) notFound();
  const profiles = store.listFollowingProfiles(profile.id);
  return <ProfileConnectionsList title={`${profile.displayName} · Takip edilenler`} description={`${profiles.length.toLocaleString('tr-TR')} hesap`} profiles={profiles} viewerId={viewer?.id ?? null} followingIds={viewer ? store.getFollowing(viewer.id) : []} pendingIds={viewer ? profiles.filter((entry) => store.hasFollowRequest(viewer.id, entry.id)).map((entry) => entry.id) : []} revalidate={`/profile/${username}/following`} />;
}
