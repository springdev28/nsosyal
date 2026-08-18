import { NextResponse } from 'next/server';

import { getStore } from '@/lib/data/store';
import { isDemoMode } from '@/lib/supabase/config';

/**
 * Demo verisini yeniden üretir.
 *
 * İki yerde işe yarar:
 *   1. Uçtan uca testler: her senaryo temiz bir durumla başlar.
 *   2. Canlı demo: sunum sırasında yapılan değişiklikler (onaylanan başvuru,
 *      kurulan hatırlatma) tek istekle geri alınabilir.
 *
 * DEMO_MODE kapalıyken çalışmaz: Supabase'e bağlı bir kurulumda veri silmez.
 */
export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Demo sıfırlama yalnızca DEMO_MODE açıkken kullanılabilir.' },
      { status: 403 },
    );
  }

  const store = getStore();
  store.reset();

  return NextResponse.json({ status: 'reset', seedGeneratedAt: store.generatedAt });
}
