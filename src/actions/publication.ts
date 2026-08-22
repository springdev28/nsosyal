'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { revalidatePath } from 'next/cache';

import { canModerate, getViewer } from '@/lib/auth/session';
import { getStore, type PublicationMutationResult } from '@/lib/data/store';
import type { PublicationBlock, PublicationRect } from '@/types/domain';

function unauthorized(): PublicationMutationResult {
  return { ok: false, code: 'invalid', message: 'Yayın Atölyesi için giriş yapmalısın.' };
}

function refreshPublicationPages(): void {
  revalidatePath('/publish');
  revalidatePath('/newspaper');
  revalidatePath('/admin/newspaper');
}

export type PublicationUploadResult =
  | { ok: true; path: string; fileName: string }
  | { ok: false; message: string };

export async function uploadPublicationCreativeAction(formData: FormData): Promise<PublicationUploadResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: 'Dosya yüklemek için giriş yapmalısın.' };
  const file = formData.get('creative');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Bir tasarım dosyası seç.' };
  if (file.size > 8 * 1024 * 1024) return { ok: false, message: 'Tasarım dosyası en fazla 8 MB olabilir.' };

  const extensionByType: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  const extension = extensionByType[file.type];
  if (!extension) return { ok: false, message: 'Canva tasarımını PNG, JPG veya WebP olarak dışa aktarıp yükle.' };

  const directory = path.join(process.cwd(), 'public', 'uploads', 'publication');
  await mkdir(directory, { recursive: true });
  const storedName = `${viewer.id.slice(0, 12)}-${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));
  getStore().track('publication_creative_uploaded', { type: file.type, size: file.size }, viewer.id);
  return { ok: true, path: `/uploads/publication/${storedName}`, fileName: file.name.slice(0, 120) };
}

export async function activatePublicationSubscriptionAction(): Promise<
  { ok: true; monthlyPrice: number } | { ok: false; message: string }
> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: 'Abonelik için giriş yapmalısın.' };
  getStore().updateProfile(viewer.id, { publicationSubscriber: true });
  getStore().track('publication_subscription_activated', { monthlyPrice: 200 }, viewer.id);
  refreshPublicationPages();
  return { ok: true, monthlyPrice: 200 };
}

export async function startPublicationDraftAction(input: {
  issueDate: string;
  page: number;
  rect: PublicationRect;
  anonymous?: boolean;
}): Promise<PublicationMutationResult> {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const result = getStore().startPublicationDraft(viewer.id, input);
  if (result.ok) refreshPublicationPages();
  return result;
}

export async function resizePublicationDraftAction(input: {
  draftId: string;
  rect: PublicationRect;
  revision: number;
}): Promise<PublicationMutationResult> {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const result = getStore().resizePublicationDraft(viewer.id, input.draftId, input.rect, input.revision);
  if (result.ok) refreshPublicationPages();
  return result;
}

export async function savePublicationDraftAction(input: {
  draftId: string;
  blocks: PublicationBlock[];
  anonymous: boolean;
  revision: number;
  submit?: boolean;
}): Promise<PublicationMutationResult> {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const result = getStore().savePublicationDraft(viewer.id, input.draftId, input);
  if (result.ok) refreshPublicationPages();
  return result;
}

export async function reservePublicationAreaAction(input: {
  draftId: string;
  revision: number;
}): Promise<PublicationMutationResult> {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  const result = getStore().reservePublicationArea(viewer.id, input.draftId, input.revision);
  if (result.ok) refreshPublicationPages();
  return result;
}

export async function purchasePublicationAreaAction(input: {
  draftId: string;
  revision: number;
}): Promise<PublicationMutationResult> {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  // Gercek odeme yoktur. Alan hakki, para cekme talimatinin hemen onceki
  // atomik cakismazlik denetimini gosteren demo islemiyle kesinlesir.
  const result = getStore().purchasePublicationArea(viewer.id, input.draftId, input.revision);
  if (result.ok) {
    getStore().track(
      'publication_area_purchased',
      { draftId: input.draftId, price: result.price ?? 0 },
      viewer.id,
    );
    refreshPublicationPages();
  }
  return result;
}

export async function reviewPublicationDraftAction(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer || !canModerate(viewer)) return;
  const draftId = String(formData.get('draftId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  if (!draftId || !['approved', 'rejected', 'changes_requested'].includes(decision)) return;
  getStore().reviewPublicationDraft(
    draftId,
    viewer.id,
    decision as 'approved' | 'rejected' | 'changes_requested',
    note,
  );
  getStore().track('publication_draft_reviewed', { draftId, decision }, viewer.id);
  refreshPublicationPages();
}
