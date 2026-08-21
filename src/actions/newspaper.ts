'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getViewer, isAdmin } from '@/lib/auth/session';
import { getStore } from '@/lib/data/store';
import type { AdRequest, ModerationStatus } from '@/types/domain';
import { placementByCode, priceFor, subscriptionByPlan } from '@/lib/newspaper/inventory';

/**
 * nGazete ilan akisi (PROJECT_SPEC 7.9 / 17.12).
 *
 * DEGISMEZ URUN KURALI: ucretli gorunurluk yalnizca gazete icinde yasar.
 * Bu dosya siralama moduluyle (lib/ranking) hicbir bagimliliga sahip degildir
 * ve olmamalidir. Onaylanan bir ilan yalnizca bir gazete sayisina kart olarak
 * eklenir; hicbir kullanicinin akis skorunu degistirmez.
 *
 * Ayrica gercek odeme entegrasyonu bilerek YOKTUR (7.9).
 */

export interface AdRequestState {
  error?: string;
  message?: string;
}

export async function submitAdRequest(_prev: AdRequestState, formData: FormData): Promise<AdRequestState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'İlan başvurusu için giriş yapmalısın.' };
  if (viewer.kind !== 'organization' && viewer.role !== 'admin') {
    return { error: 'İlan başvurusunu yalnızca kurum hesapları gönderebilir.' };
  }

  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 6) return { error: 'İlan başlığı en az 6 karakter olmalı.' };

  const body = String(formData.get('body') ?? '').trim();
  if (body.length < 20) return { error: 'İlan metni en az 20 karakter olmalı.' };

  const contactEmail = String(formData.get('contactEmail') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { error: 'Geçerli bir iletişim e-postası gir.' };
  }

  // Fiyat ILAN TURUNDEN degil, satin alinan ALANDAN turer (PROJECT_SPEC 10.1.1).
  const placementCode = String(formData.get('requestedPlacement') ?? '');
  const placement = placementByCode(placementCode);
  if (!placement) return { error: 'Geçerli bir yerleşim alanı seç.' };

  const plan = String(formData.get('subscriptionPlan') ?? 'tek-sayi');
  const subscription = subscriptionByPlan(plan);
  if (!subscription) return { error: 'Geçerli bir yayın paketi seç.' };

  const price = priceFor({
    placementCode: placement.code,
    issueCount: subscription.issueCount,
    subscriptionPlan: subscription.plan,
  });

  getStore().submitAdRequest({
    organizationId: viewer.id,
    contactEmail,
    placementType: (String(formData.get('placementType') ?? 'org_ad') as AdRequest['placementType']),
    requestedPlacement: placement.code,
    widthPx: placement.widthPx,
    heightPx: placement.heightPx,
    requestedIssueStart: String(formData.get('requestedIssueStart') ?? '') || null,
    requestedIssueCount: subscription.issueCount,
    subscriptionPlan: subscription.plan,
    // Katsayilar sonradan degisse de verilen teklif degismesin diye dondurulur.
    pricingSnapshot: price?.total ?? null,
    theme: String(formData.get('theme') ?? '') || null,
    title,
    body,
    creativeUrl: null,
    creativeAlt: String(formData.get('creativeAlt') ?? '').trim() || null,
    linkUrl: String(formData.get('linkUrl') ?? '') || null,
  });

  getStore().track('ad_request_submitted', { title }, viewer.id);
  revalidatePath('/newspaper/advertise');
  revalidatePath('/admin/newspaper');

  return {
    message:
      'Başvurun alındı ve incelemeye gönderildi. Onaylanırsa seçtiğin sayıların gazete kompozisyonunda yayımlanır.',
  };
}

/** Admin karari. Onaylanan ilan yalnizca gazete sayisina eklenir. */
export async function reviewAdRequest(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!isAdmin(viewer) || !viewer) redirect('/feed');

  const requestId = String(formData.get('requestId') ?? '');
  const decision = String(formData.get('decision') ?? '') as Exclude<ModerationStatus, 'pending'>;
  const issueDate = String(formData.get('issueDate') ?? '') || undefined;

  if (!requestId || !['approved', 'rejected'].includes(decision)) return;

  getStore().reviewAdRequest(requestId, viewer.id, decision, issueDate);
  getStore().track('ad_request_reviewed', { requestId, decision }, viewer.id);

  revalidatePath('/admin/newspaper');
  revalidatePath('/newspaper');
}
