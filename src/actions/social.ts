'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { revalidatePath } from 'next/cache';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_POST_MEDIA,
  MAX_VIDEO_BYTES,
} from '@/lib/media/constraints';
import type { PostType } from '@/types/domain';

/**
 * Sosyal etkilesim eylemleri.
 *
 * Hepsi sunucu tarafinda oturumu yeniden dogrular; istemciden gelen bir
 * kullanici kimligine asla guvenilmez (PROJECT_SPEC 11.3).
 */

export async function toggleLike(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;

  const liked = getStore().toggleLike(viewer.id, postId);
  getStore().track('post_liked', { postId, liked }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/feed'));
}

export async function toggleSave(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const postId = String(formData.get('postId') ?? '');
  if (!postId) return;

  const saved = getStore().toggleSave(viewer.id, postId);
  getStore().track('post_saved', { postId, saved }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/feed'));
}

export async function toggleFollow(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const targetId = String(formData.get('profileId') ?? '');
  if (!targetId) return;

  const following = getStore().toggleFollow(viewer.id, targetId);
  getStore().track('profile_followed', { targetId, following }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/feed'));
}

export interface CommentState {
  error?: string;
}

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Yorum yapmak için giriş yapmalısın.' };

  const postId = String(formData.get('postId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!postId) return { error: 'Gönderi bulunamadı.' };
  if (body.length < 2) return { error: 'Yorum en az 2 karakter olmalı.' };
  if (body.length > 600) return { error: 'Yorum en fazla 600 karakter olabilir.' };

  getStore().createComment(postId, viewer.id, body);
  getStore().track('comment_created', { postId }, viewer.id);
  revalidatePath(`/posts/${postId}`);
  revalidatePath('/feed');
  return {};
}

export interface ComposerState {
  error?: string;
  message?: string;
}

async function storePostMedia(file: File): Promise<{ path: string; mediaType: 'image' | 'video' } | { error: string }> {
  const isImage = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
  const isVideo = (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type);
  if (!isImage && !isVideo) return { error: 'Yalnızca JPG, PNG, WebP, MP4 veya WebM yükleyebilirsin.' };

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return { error: `${file.name} için sınır ${limitMb} MB.` };
  }

  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  const directory = join(process.cwd(), 'public', 'uploads');
  const name = `${randomUUID()}.${extensionByType[file.type]}`;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), Buffer.from(await file.arrayBuffer()));
  return { path: `/uploads/${name}`, mediaType: isVideo ? 'video' : 'image' };
}

export async function createPost(_prev: ComposerState, formData: FormData): Promise<ComposerState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Paylaşım yapmak için giriş yapmalısın.' };

  const body = String(formData.get('body') ?? '').trim();
  const mediaFiles = formData
    .getAll('media')
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (body.length < 2 && mediaFiles.length === 0) return { error: 'Metin, görsel veya video ekle.' };
  if (body.length > 2000) return { error: 'Gönderi en fazla 2000 karakter olabilir.' };
  if (mediaFiles.length > MAX_POST_MEDIA) return { error: `En fazla ${MAX_POST_MEDIA} medya ekleyebilirsin.` };

  const mediaAlt = String(formData.get('mediaAlt') ?? '').trim();
  if (mediaFiles.length && mediaAlt.length < 3) return { error: 'Medya için kısa bir açıklama ekle.' };

  const type = String(formData.get('type') ?? 'text') as PostType;
  const communityId = String(formData.get('communityId') ?? '') || null;
  const topicIds = formData.getAll('topics').map(String);
  const shareLocation = formData.get('shareLocation') === 'on';
  const visibility = formData.get('visibility') === 'community' ? 'community' : 'public';
  if (visibility === 'community' && !communityId) return { error: 'Gönderinin görüneceği topluluğu seç.' };

  const store = getStore();
  const mediaIds: string[] = [];
  for (const [index, file] of mediaFiles.entries()) {
    const result = await storePostMedia(file);
    if ('error' in result) return { error: result.error };
    const media = store.addMedia({
      postId: null,
      mediaType: result.mediaType,
      storagePath: result.path,
      caption: body.slice(0, 120) || file.name,
      altText: mediaFiles.length > 1 ? `${mediaAlt} (${index + 1}/${mediaFiles.length})` : mediaAlt,
      durationSec: null,
      posterPath: null,
    });
    mediaIds.push(media.id);
  }

  store.createPost({
    authorId: viewer.id,
    type,
    body,
    visibility,
    communityId,
    topicIds: topicIds.length ? topicIds : viewer.topicIds.slice(0, 1),
    // Konum yalnizca kullanici bu gonderi icin acikca isterse eklenir.
    provinceCode: shareLocation ? viewer.provinceCode : null,
    districtCode: shareLocation ? viewer.districtCode : null,
    mediaIds,
    isShortVideo: mediaFiles.some((file) => file.type.startsWith('video/')),
    videoKind: mediaFiles.some((file) => file.type.startsWith('video/')) ? 'gundelik' : null,
  });

  store.track(
    'post_created',
    { type, hasCommunity: Boolean(communityId), shareLocation, mediaCount: mediaIds.length },
    viewer.id,
  );
  revalidatePath('/feed');
  if (communityId) revalidatePath('/communities');

  return { message: 'Paylaşıldı.' };
}

export async function joinCommunity(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const communityId = String(formData.get('communityId') ?? '');
  if (!communityId) return;

  getStore().joinCommunity(communityId, viewer.id);
  getStore().track('community_joined', { communityId }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/communities'));
  revalidatePath('/feed');
}

export async function leaveCommunity(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const communityId = String(formData.get('communityId') ?? '');
  if (!communityId) return;

  getStore().leaveCommunity(communityId, viewer.id);
  getStore().track('community_left', { communityId }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/communities'));
  revalidatePath('/feed');
}

export async function createReminder(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventId) return;

  getStore().createReminder(viewer.id, eventId);
  getStore().track('event_reminder_created', { eventId }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/explore/time'));
  revalidatePath('/notifications');
}

export async function cancelReminder(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  const eventId = String(formData.get('eventId') ?? '');
  if (!eventId) return;

  getStore().cancelReminder(viewer.id, eventId);
  getStore().track('event_reminder_cancelled', { eventId }, viewer.id);
  revalidatePath(String(formData.get('revalidate') ?? '/explore/time'));
  revalidatePath('/notifications');
}

export async function markNotificationsRead(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;
  getStore().markNotificationsRead(viewer.id);
  revalidatePath('/notifications');
}

export interface ReportState {
  message?: string;
  error?: string;
}

export async function reportEntity(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Bildirim göndermek için giriş yapmalısın.' };

  const entityId = String(formData.get('entityId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (!entityId || !reason) return { error: 'Lütfen bir sebep seç.' };

  getStore().createReport({
    reporterId: viewer.id,
    entityType: 'post',
    entityId,
    reason,
    detail: String(formData.get('detail') ?? '').slice(0, 600),
  });
  getStore().track('content_reported', { entityId, reason }, viewer.id);

  return { message: 'Bildirimin moderasyon ekibine iletildi.' };
}
