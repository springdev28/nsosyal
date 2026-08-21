'use server';

import { revalidatePath } from 'next/cache';

import { getViewer } from '@/lib/auth/session';
import { getStore, type PublicationMutationResult } from '@/lib/data/store';
import type { PublicationBlock, PublicationRect } from '@/types/domain';

function unauthorized(): PublicationMutationResult {
  return { ok: false, code: 'invalid', message: 'Yayın Atölyesi için giriş yapmalısın.' };
}

function refreshPublicationPages(): void {
  revalidatePath('/publish');
  revalidatePath('/newspaper');
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
