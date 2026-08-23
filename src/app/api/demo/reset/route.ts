import { NextResponse } from 'next/server';

import { getStore } from '@/lib/data/store';
import { isDemoMode } from '@/lib/supabase/config';

/**
 * Rebuilds the deterministic DemoStore snapshot for E2E isolation and live-demo
 * cleanup. It refuses to run outside demo mode so it cannot erase Supabase data.
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
