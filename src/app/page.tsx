/** Kok rotayi oturum ve onboarding durumuna gore gercek baslangic ekranina yonlendirir. */
import { redirect } from 'next/navigation';

import { getViewer, hasCompletedOnboarding } from '@/lib/auth/session';

export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!(await hasCompletedOnboarding())) redirect('/onboarding');
  redirect('/feed');
}
