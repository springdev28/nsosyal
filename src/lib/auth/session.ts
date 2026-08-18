import { cookies } from 'next/headers';
import { cache } from 'react';

import { getStore } from '@/lib/data/store';
import { DEMO_ACCOUNT_USERNAMES } from '@/lib/seed/profiles';
import type { Profile } from '@/types/domain';

/**
 * Oturum katmani.
 *
 * Prototip DEMO_MODE ile calisir: oturum, imzali bir token yerine yalnizca
 * kullanici adini tutan bir cerezdir. Bu bilincli bir demo tercihidir; gercek
 * kimlik dogrulama Supabase Auth ile yapilacaktir (bkz. docs/architecture.md).
 * Bu nedenle demo hesaplari hicbir sekilde gercek veri icermez ve tum kayitlar
 * `demo: true` isaretlidir.
 */

export const SESSION_COOKIE = 'nsosyal_session';
export const ONBOARDING_COOKIE = 'nsosyal_onboarded';
/** Gazetenin gun icinde bir kez acilmasi icin (PROJECT_SPEC 7.9). */
export const NEWSPAPER_SEEN_COOKIE = 'nsosyal_newspaper_seen';
/** Erisilebilirlik tercihi: gazete kapatma gecikmesini kaldirir. */
export const REDUCED_MOTION_COOKIE = 'nsosyal_reduced_motion';

export interface DemoAccount {
  username: string;
  label: string;
  role: Profile['role'];
  description: string;
  showcase: string;
}

/** Jurinin tek tikla giris yapabilmesi icin (PROJECT_SPEC 15.2). */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: DEMO_ACCOUNT_USERNAMES.user,
    label: 'Elif · gündelik kullanıcı',
    role: 'user',
    description: 'İzmir / Bornova, havacılık ve robotik ilgisi. Konumunu ilçe düzeyinde paylaşıyor.',
    showcase: 'Ana akış, harita keşfi, topluluğa katılma, etkinlik hatırlatma',
  },
  {
    username: DEMO_ACCOUNT_USERNAMES.creator,
    label: 'Baran · üreten kullanıcı',
    role: 'user',
    description: 'Rüzgâr ölçer projesinin kurucusu. Bitmemiş işleri paylaşmayı seviyor.',
    showcase: 'Proje oluşturma, pitch videosu, Neden hikâyesi',
  },
  {
    username: DEMO_ACCOUNT_USERNAMES.organization,
    label: 'Ege Teknopark · kurum',
    role: 'organization',
    description: 'Doğrulanmış demo kurum hesabı.',
    showcase: 'Etkinlik duyurusu, nGazete ilan başvurusu',
  },
  {
    username: DEMO_ACCOUNT_USERNAMES.moderator,
    label: 'Deniz · moderatör',
    role: 'moderator',
    description: 'Topluluk başvurularını ve raporları inceler.',
    showcase: 'Topluluk onay kuyruğu, moderasyon kayıtları',
  },
];

/**
 * Istek basina bir kez cozulur. `cache` sayesinde ayni render icinde
 * defalarca cagrilsa da cerez yalnizca bir kez okunur.
 */
export const getViewer = cache(async (): Promise<Profile | null> => {
  const store = await cookies();
  const username = store.get(SESSION_COOKIE)?.value;
  if (!username) return null;
  return getStore().getProfileByUsername(username);
});

export async function requireViewer(): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) {
    // Cagiran sayfa bunu yakalayip /login'e yonlendirir.
    throw new Error('UNAUTHENTICATED');
  }
  return viewer;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const store = await cookies();
  return store.get(ONBOARDING_COOKIE)?.value === '1';
}

export async function prefersReducedMotion(): Promise<boolean> {
  const store = await cookies();
  return store.get(REDUCED_MOTION_COOKIE)?.value === '1';
}

/** Gazete bu oturumda / bugun zaten acildi mi? */
export async function hasSeenTodaysNewspaper(todayKey: string): Promise<boolean> {
  const store = await cookies();
  return store.get(NEWSPAPER_SEEN_COOKIE)?.value === todayKey;
}

/** Rol kontrolu - admin ve moderator rotalarinda kullanilir. */
export function canModerate(profile: Profile | null): boolean {
  return profile?.role === 'moderator' || profile?.role === 'admin';
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}
