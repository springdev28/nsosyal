'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { canModerate, getViewer } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import type { ModerationStatus, Scope } from '@/types/domain';

/**
 * Topluluk basvurusu ve moderator karari (PROJECT_SPEC 7.3 / 17.8).
 *
 * Degismez urun kurali: topluluk dogrudan acilmaz. Basvuru moderasyon
 * kuyruguna duser; onaylandiginda topluluk olusur ve basvuran yonetici olur.
 */

export interface ApplicationState {
  error?: string;
  message?: string;
}

export async function submitCommunityApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Başvuru için giriş yapmalısın.' };

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 4) return { error: 'Topluluk adı en az 4 karakter olmalı.' };
  if (name.length > 80) return { error: 'Topluluk adı en fazla 80 karakter olabilir.' };

  const rootTopicId = String(formData.get('rootTopicId') ?? '');
  if (!rootTopicId) return { error: 'Bağlı olduğu kök alanı seç.' };

  const rationale = String(formData.get('rationale') ?? '').trim();
  if (rationale.length < 40) {
    return { error: 'Amaç alanı en az 40 karakter olmalı. Moderatörün kararı buna dayanıyor.' };
  }

  const rules = String(formData.get('rules') ?? '').trim();
  if (rules.length < 10) return { error: 'En az bir topluluk kuralı yaz.' };

  const scope = String(formData.get('scope') ?? 'online') as Scope;
  const provinceCode = String(formData.get('provinceCode') ?? '') || null;
  const districtCode = String(formData.get('districtCode') ?? '') || null;

  if (scope === 'local' && !provinceCode) {
    return { error: 'Yerel kapsam seçtin; hangi ilde olduğunu belirt.' };
  }

  getStore().submitApplication({
    name,
    rootTopicId,
    rationale,
    scope,
    provinceCode: scope === 'local' ? provinceCode : null,
    districtCode: scope === 'local' ? districtCode : null,
    audience: String(formData.get('audience') ?? 'Genel'),
    rules,
    applicantId: viewer.id,
  });

  getStore().track('community_application_submitted', { scope, name }, viewer.id);

  revalidatePath('/communities/apply');
  revalidatePath('/admin/moderation');
  revalidatePath('/notifications');

  return { message: 'Başvurun alındı ve moderasyon kuyruğuna eklendi.' };
}

/**
 * Moderator karari. Yetki kontrolu sunucuda yapilir; arayuzde dugmeyi gizlemek
 * tek basina yeterli bir koruma degildir (PROJECT_SPEC 11.3).
 */
export async function reviewCommunityApplication(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!canModerate(viewer) || !viewer) redirect('/feed');

  const applicationId = String(formData.get('applicationId') ?? '');
  const decision = String(formData.get('decision') ?? '') as Exclude<ModerationStatus, 'pending'>;
  const note = String(formData.get('note') ?? '').slice(0, 600);

  if (!applicationId || !['approved', 'rejected', 'changes_requested'].includes(decision)) return;

  getStore().reviewApplication(applicationId, viewer.id, decision, note);
  getStore().track('community_application_reviewed', { applicationId, decision }, viewer.id);

  revalidatePath('/admin/moderation');
  revalidatePath('/communities');
  revalidatePath('/notifications');
}

export async function resolveReport(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!canModerate(viewer) || !viewer) redirect('/feed');

  const reportId = String(formData.get('reportId') ?? '');
  const status = String(formData.get('status') ?? 'dismissed') as 'actioned' | 'dismissed' | 'reviewing';
  const note = String(formData.get('note') ?? '').slice(0, 600);
  if (!reportId) return;

  getStore().resolveReport(reportId, viewer.id, status, note);
  revalidatePath('/admin/moderation');
}
