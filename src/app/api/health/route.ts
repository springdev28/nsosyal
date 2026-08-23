import { NextResponse } from 'next/server';

import { getStore } from '@/lib/data/store';

/**
 * Deployment identity endpoint used by Playwright and CI. `next.config.ts`
 * embeds the build commit, allowing the release job to distinguish the new
 * deployment from an older process that also returns HTTP 200.
 */
const COMMIT = process.env.NSOSYAL_COMMIT_SHA ?? 'unknown';

export function GET() {
  const store = getStore();
  return NextResponse.json(
    {
      status: 'ok',
      commit: COMMIT,
      mode: process.env.DEMO_MODE === 'false' ? 'supabase' : 'demo',
      seedGeneratedAt: store.generatedAt,
      topics: store.getTopics().length,
      communities: store.listCommunities().length,
    },
    {
      // A cached response could make an old deployment look current.
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  );
}
