'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { revalidatePath } from 'next/cache';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import {
  normalizeProfileUrl,
  profileLinkDefaultLabel,
  profileLinkPlatform,
} from '@/lib/profile/links';
import { uid } from '@/lib/seed/ids';
import type { BirthDateVisibility, ProfileLink } from '@/types/domain';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface ProfileFormState {
  message?: string;
  error?: string;
}

async function storeProfileImage(
  file: File,
  kind: 'avatar' | 'banner',
): Promise<{ path: string } | { error: string }> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { error: 'Yalnızca JPG, PNG veya WebP görsel yükleyebilirsin.' };
  }
  const maxBytes = kind === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: `${kind === 'avatar' ? 'Profil fotoğrafı' : 'Kapak görseli'} çok büyük.` };
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const directory = join(process.cwd(), 'public', 'uploads', 'profile');
  const name = `${kind}-${randomUUID()}.${extension}`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), Buffer.from(await file.arrayBuffer()));
  return { path: `/uploads/profile/${name}` };
}

export async function updateProfileDetails(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Oturum bulunamadı.' };

  const displayName = String(formData.get('displayName') ?? '').trim();
  if (displayName.length < 2 || displayName.length > 50) {
    return { error: 'Görünen ad 2-50 karakter arasında olmalı.' };
  }
  const bio = String(formData.get('bio') ?? '').trim();
  if (bio.length > 240) return { error: 'Kısa tanıtım en fazla 240 karakter olabilir.' };

  const birthDate = String(formData.get('birthDate') ?? '') || null;
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || new Date(`${birthDate}T00:00:00Z`) > new Date())) {
    return { error: 'Geçerli bir doğum tarihi gir.' };
  }
  const rawBirthVisibility = String(formData.get('birthDateVisibility') ?? 'private');
  const birthDateVisibility: BirthDateVisibility = ['public', 'followers', 'private'].includes(
    rawBirthVisibility,
  )
    ? (rawBirthVisibility as BirthDateVisibility)
    : 'private';

  const urls = formData.getAll('linkUrl').map(String);
  const labels = formData.getAll('linkLabel').map(String);
  const links: ProfileLink[] = [];
  for (let index = 0; index < urls.length; index += 1) {
    const raw = urls[index]?.trim();
    if (!raw) continue;
    const url = normalizeProfileUrl(raw);
    if (!url) return { error: `${index + 1}. bağlantı geçerli bir web adresi değil.` };
    const platform = profileLinkPlatform(url);
    links.push({
      id: uid('profile-link', `${viewer.id}-${url.toString()}`),
      url: url.toString(),
      platform,
      label: labels[index]?.trim().slice(0, 36) || profileLinkDefaultLabel(platform, url),
    });
  }
  if (links.length > 4) return { error: 'En fazla 4 bağlantı ekleyebilirsin.' };

  let avatarUrl = formData.get('removeAvatar') === 'on' ? null : viewer.avatarUrl;
  let bannerUrl = formData.get('removeBanner') === 'on' ? null : viewer.bannerUrl;

  const avatar = formData.get('avatar');
  if (avatar instanceof File && avatar.size > 0) {
    const result = await storeProfileImage(avatar, 'avatar');
    if ('error' in result) return { error: result.error };
    avatarUrl = result.path;
  }

  const banner = formData.get('banner');
  if (banner instanceof File && banner.size > 0) {
    const result = await storeProfileImage(banner, 'banner');
    if ('error' in result) return { error: result.error };
    bannerUrl = result.path;
  }

  getStore().updateProfile(viewer.id, {
    displayName,
    bio,
    birthDate,
    birthDateVisibility,
    links,
    avatarUrl,
    bannerUrl,
  });
  getStore().track('profile_updated', { linkCount: links.length, hasAvatar: Boolean(avatarUrl), hasBanner: Boolean(bannerUrl) }, viewer.id);
  revalidatePath(`/profile/${viewer.username}`);
  revalidatePath(`/profile/${viewer.username}/edit`);
  revalidatePath('/feed');
  return { message: 'Profilin güncellendi.' };
}

export async function resolveFollowRequest(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const requesterId = String(formData.get('requesterId') ?? '');
  const decision = String(formData.get('decision') ?? 'deny');
  if (!requesterId) return;
  getStore().resolveFollowRequest(viewer.id, requesterId, decision === 'approve');
  revalidatePath('/settings');
  revalidatePath(`/profile/${viewer.username}`);
}
