/**
 * Server-side boundary for creating projects and Why stories.
 * Upload rules are checked here again because browser validation can be bypassed.
 */
'use server';

import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import { inspectVideoUpload } from '@/lib/media/constraints';
import { commitLocalUploadBatch } from '@/lib/media/local-upload';
import type { Project, WhyStory } from '@/types/domain';

export interface ProjectFormState {
  error?: string;
  message?: string;
}

interface PreparedProjectVideo {
  absolutePath: string;
  publicPath: string;
  bytes: Uint8Array;
  durationSec: number;
}

async function prepareProjectVideo(
  file: File,
): Promise<PreparedProjectVideo | { error: string }> {
  const inspection = await inspectVideoUpload(file);
  if (!inspection.ok) return { error: inspection.error };

  const extension = file.type === 'video/webm' ? 'webm' : 'mp4';
  const name = `${randomUUID()}.${extension}`;
  const directory = join(process.cwd(), 'public', 'uploads');

  return {
    absolutePath: join(directory, name),
    publicPath: `/uploads/${name}`,
    bytes: inspection.bytes,
    durationSec: inspection.durationSec,
  };
}

export async function createProject(_prev: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Proje oluşturmak için giriş yapmalısın.' };

  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 4) return { error: 'Proje adı en az 4 karakter olmalı.' };

  const summary = String(formData.get('summary') ?? '').trim();
  if (summary.length < 20) return { error: 'Kısa açıklama en az 20 karakter olmalı.' };

  const whyText = String(formData.get('whyText') ?? '').trim();
  if (whyText.length < 30) {
    return { error: 'Neden alanı en az 30 karakter olmalı. Bu proje sayfasının en değerli kısmı.' };
  }

  const topicIds = formData.getAll('topics').map(String).filter(Boolean);
  if (topicIds.length === 0) return { error: 'En az bir konu seç.' };

  const shareLocation = formData.get('shareLocation') === 'on';
  const store = getStore();

  const file = formData.get('pitch');
  let preparedVideo: PreparedProjectVideo | null = null;
  if (file instanceof File && file.size > 0) {
    const result = await prepareProjectVideo(file);
    if ('error' in result) return { error: result.error };
    preparedVideo = result;
  }

  let uploadCommit;
  try {
    uploadCommit = await commitLocalUploadBatch(preparedVideo ? [preparedVideo] : []);
  } catch {
    return { error: 'Pitch videosu kaydedilemedi. Dosyayı yeniden seçip tekrar dene.' };
  }

  let project: Project | null = null;
  const mediaIds: string[] = [];
  try {
    project = store.createProject({
      ownerId: viewer.id,
      title,
      summary,
      status: (String(formData.get('status') ?? 'fikir') as Project['status']) ?? 'fikir',
      topicIds,
      provinceCode: shareLocation ? viewer.provinceCode : null,
      districtCode: shareLocation ? viewer.districtCode : null,
      whyText,
      howText: String(formData.get('howText') ?? '').trim(),
      needs: String(formData.get('needs') ?? '').trim(),
      communityIds: formData.getAll('communities').map(String).filter(Boolean),
    });

    if (preparedVideo) {
      const media = store.addMedia({
        postId: null,
        mediaType: 'video',
        storagePath: preparedVideo.publicPath,
        caption: `${title} · pitch`,
        altText: String(formData.get('pitchTranscript') ?? '').slice(0, 1000),
        durationSec: preparedVideo.durationSec,
        posterPath: null,
      });
      mediaIds.push(media.id);
      if (!store.attachPitch(project.id, media.id)) throw new Error('Pitch could not be attached.');
    }
  } catch {
    if (project) store.rollbackProjectCreation(project.id, mediaIds);
    else store.removeMedia(mediaIds);
    await uploadCommit.rollback();
    return { error: 'Proje kaydedilemedi. Yarım kayıt tutulmadı; tekrar deneyebilirsin.' };
  }

  store.track('project_created', { hasPitch: file instanceof File && file.size > 0 }, viewer.id);
  revalidatePath('/projects');
  redirect(`/projects/${project.slug}`);
}

export interface WhyFormState {
  error?: string;
}

export async function createWhyStory(_prev: WhyFormState, formData: FormData): Promise<WhyFormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Hikâye yazmak için giriş yapmalısın.' };

  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 6) return { error: 'Başlık en az 6 karakter olmalı.' };

  const body = String(formData.get('body') ?? '').trim();
  if (body.length < 80) {
    return {
      error:
        'Hikâye en az 80 karakter olmalı. Somut bir an anlat: neyi çözemedin, ne kaybettin, ne fark ettin?',
    };
  }

  const linkedProjectId = String(formData.get('linkedProjectId') ?? '') || null;
  const store = getStore();

  const story = store.createWhyStory({
    authorId: viewer.id,
    title,
    body,
    linkedEntityType: linkedProjectId ? 'project' : null,
    linkedEntityId: linkedProjectId,
    topicIds: formData.getAll('topics').map(String).filter(Boolean),
    provinceCode: formData.get('shareLocation') === 'on' ? viewer.provinceCode : null,
    visibility: (String(formData.get('visibility') ?? 'public') as WhyStory['visibility']) ?? 'public',
  });

  store.track('why_story_created', { linked: Boolean(linkedProjectId) }, viewer.id);
  revalidatePath('/explore/why');
  redirect(`/explore/why/${story.id}`);
}

export async function addProjectUpdate(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;

  const projectId = String(formData.get('projectId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  const slug = String(formData.get('slug') ?? '');
  if (!projectId || body.length < 4) return;

  // This owner check is the prototype's authorization boundary for updates.
  const project = getStore().getProject(projectId);
  if (!project || project.ownerId !== viewer.id) return;

  getStore().addProjectUpdate(projectId, viewer.id, body, formData.get('milestone') === 'on');
  revalidatePath(`/projects/${slug}`);
}
