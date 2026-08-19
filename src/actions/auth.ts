'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getStore } from '@/lib/data/store';
import { parseGoalKeys } from '@/lib/personalization/goals';
import {
  DEMO_ACCOUNTS,
  NEWSPAPER_SEEN_COOKIE,
  ONBOARDING_COOKIE,
  REDUCED_MOTION_COOKIE,
  SESSION_COOKIE,
  getViewer,
} from '@/lib/auth/session';
import type { IntentMode, LocationVisibility } from '@/types/domain';

/**
 * Oturum ve profil eylemleri.
 *
 * Not: prototip DEMO_MODE ile calisir, bu yuzden "giris" yalnizca bir demo
 * hesabini secmektir. Parola dogrulamasi Supabase Auth'a birakilmistir; boylece
 * repoya sahte parola hash'i veya gercek gibi gorunen bir kimlik katmani
 * eklemek zorunda kalmiyoruz (PROJECT_SPEC 11.3).
 */

const YEAR = 60 * 60 * 24 * 365;

export async function signInAsDemoAccount(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '');
  const account = DEMO_ACCOUNTS.find((entry) => entry.username === username);
  if (!account) redirect('/login?error=unknown-account');

  const profile = getStore().getProfileByUsername(username);
  if (!profile) redirect('/login?error=unknown-account');

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, username, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: YEAR });

  getStore().track('demo_login', { username }, profile.id);

  // Demo hesaplarinin profili zaten dolu; onboarding'i tekrar gostermiyoruz.
  cookieStore.set(ONBOARDING_COOKIE, '1', { sameSite: 'lax', path: '/', maxAge: YEAR });
  redirect('/feed');
}

export async function startOnboarding(): Promise<void> {
  const cookieStore = await cookies();
  // Onboarding turu her zaman gundelik kullanici hesabi uzerinden gosterilir.
  cookieStore.set(SESSION_COOKIE, DEMO_ACCOUNTS[0].username, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: YEAR,
  });
  cookieStore.delete(ONBOARDING_COOKIE);
  redirect('/onboarding');
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ONBOARDING_COOKIE);
  cookieStore.delete(NEWSPAPER_SEEN_COOKIE);
  redirect('/login');
}

export interface OnboardingState {
  error?: string;
}

/**
 * Onboarding kaydi (PROJECT_SPEC 17.4).
 * Konum tamamen istege baglidir ve varsayilani "paylasmiyorum"dur.
 */
export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' };

  const topicIds = formData.getAll('topics').map(String);
  if (topicIds.length < 3) {
    return { error: 'Devam etmek için en az 3 ilgi alanı seçmelisin.' };
  }

  const username = String(formData.get('username') ?? '').trim();
  if (!/^[a-z0-9._]{3,24}$/.test(username)) {
    return { error: 'Kullanıcı adı 3-24 karakter olmalı; küçük harf, rakam, nokta ve alt çizgi kullanabilirsin.' };
  }

  const existing = getStore().getProfileByUsername(username);
  if (existing && existing.id !== viewer.id) {
    return { error: 'Bu kullanıcı adı zaten kullanılıyor.' };
  }

  const visibility = String(formData.get('locationVisibility') ?? 'hidden') as LocationVisibility;
  const provinceCode = String(formData.get('provinceCode') ?? '') || null;
  const districtCode = String(formData.get('districtCode') ?? '') || null;

  if ((visibility === 'province' || visibility === 'district') && !provinceCode) {
    return { error: 'Konum paylaşmayı seçtin ama il seçmedin.' };
  }
  if (visibility === 'district' && !districtCode) {
    return { error: 'İlçe düzeyinde paylaşmayı seçtin ama ilçe seçmedin.' };
  }

  // Anlik niyet opsiyoneldir; bos birakilirsa kullanici mod secmemis sayilir
  // ve akis yalnizca kalici amaclardan turer (spec 7.10).
  const rawIntent = String(formData.get('intentMode') ?? '');
  const intentMode = rawIntent ? (rawIntent as IntentMode) : null;
  // Kalici platform amaclari - P0 (teknik rapor 3.3.2): onboarding birden
  // fazlasini toplar, kullanici sonradan Ayarlar'dan hepsini degistirebilir.
  const goalKeys = parseGoalKeys(formData.getAll('goalKeys').map(String));
  const bio = String(formData.get('bio') ?? '').slice(0, 240);

  getStore().updateProfile(viewer.id, {
    username,
    bio,
    topicIds,
    intentMode,
    goalKeys,
    locationVisibility: visibility,
    provinceCode: visibility === 'hidden' || visibility === 'online_only' ? null : provinceCode,
    districtCode: visibility === 'district' ? districtCode : null,
  });

  getStore().track(
    'onboarding_completed',
    { topics: topicIds.length, locationVisibility: visibility, intentMode, goals: goalKeys.length },
    viewer.id,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, username, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: YEAR });
  cookieStore.set(ONBOARDING_COOKIE, '1', { sameSite: 'lax', path: '/', maxAge: YEAR });

  redirect('/feed');
}

export interface SettingsState {
  message?: string;
  error?: string;
}

export async function updateSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'Oturum bulunamadı.' };

  const visibility = String(formData.get('locationVisibility') ?? 'hidden') as LocationVisibility;
  const provinceCode = String(formData.get('provinceCode') ?? '') || null;
  const districtCode = String(formData.get('districtCode') ?? '') || null;
  const rawIntent = String(formData.get('intentMode') ?? '');
  const intentMode = rawIntent ? (rawIntent as IntentMode) : null;
  const goalKeys = parseGoalKeys(formData.getAll('goalKeys').map(String));
  const bio = String(formData.get('bio') ?? '').slice(0, 240);

  if ((visibility === 'province' || visibility === 'district') && !provinceCode) {
    return { error: 'Konum paylaşmayı seçtin ama il seçmedin.' };
  }

  getStore().updateProfile(viewer.id, {
    bio,
    intentMode,
    goalKeys,
    locationVisibility: visibility,
    provinceCode: visibility === 'hidden' || visibility === 'online_only' ? null : provinceCode,
    districtCode: visibility === 'district' ? districtCode : null,
  });

  const cookieStore = await cookies();
  const reducedMotion = formData.get('reducedMotion') === 'on';
  if (reducedMotion) {
    cookieStore.set(REDUCED_MOTION_COOKIE, '1', { sameSite: 'lax', path: '/', maxAge: YEAR });
  } else {
    cookieStore.delete(REDUCED_MOTION_COOKIE);
  }

  // Gazetenin bir sonraki oturumda tekrar acilmasini isteyen kullanicilar icin.
  if (formData.get('newspaperAutoOpen') === 'on') {
    cookieStore.delete(NEWSPAPER_SEEN_COOKIE);
  }

  getStore().track('settings_updated', { locationVisibility: visibility, reducedMotion }, viewer.id);
  revalidatePath('/settings');
  revalidatePath('/feed');

  return { message: 'Ayarların kaydedildi.' };
}
