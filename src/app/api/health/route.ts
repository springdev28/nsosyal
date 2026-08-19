import { NextResponse } from 'next/server';

import { getStore } from '@/lib/data/store';

/**
 * Dagitim sonrasi hizli kontrol noktasi (PROJECT_SPEC 17.16).
 * Playwright webServer'i da bu adresi bekler.
 */
export function GET() {
  const store = getStore();
  return NextResponse.json({
    status: 'ok',
    mode: process.env.DEMO_MODE === 'false' ? 'supabase' : 'demo',
    seedGeneratedAt: store.generatedAt,
    topics: store.getTopics().length,
    communities: store.listCommunities().length,
  });
}
