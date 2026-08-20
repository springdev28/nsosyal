import { NextResponse } from 'next/server';

import { getStore } from '@/lib/data/store';

/**
 * Dagitim sonrasi hizli kontrol noktasi (PROJECT_SPEC 17.16).
 * Playwright webServer'i da bu adresi bekler.
 *
 * `commit` alani dagitim hattinin can damaridir. "Dagitildi" demek "ayakta"
 * demek degildir; ayakta olan ESKI surum de olabilir. Bu proje tam olarak bu
 * yuzden defalarca "hicbir sey degismemis" gorundu: sunucu 200 donuyordu ama
 * uzerinde haftalar oncesinin derlemesi vardi. Is akisi push'ladigi SHA'yi
 * burada gormeden dagitimi basarili saymaz.
 *
 * Deger derleme aninda gomulur. Once dagitim hattinin verdigi degisken,
 * sonra platformlarin kendi degiskenleri denenir:
 *   NSOSYAL_COMMIT_SHA  - is akisinin actigi degisken (her hedefte calisir)
 *   RENDER_GIT_COMMIT   - Render otomatik saglar
 *   VERCEL_GIT_COMMIT_SHA - Vercel otomatik saglar
 * Hicbiri yoksa 'unknown' doner; bu bir hata degil, "bu derleme kimligini
 * bilmiyor" demektir ve is akisi bunu ayrica raporlar.
 */
const COMMIT =
  process.env.NSOSYAL_COMMIT_SHA ??
  process.env.RENDER_GIT_COMMIT ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  'unknown';

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
      // Saglik kontrolu asla onbellekten okunmamali; yoksa eski surumu
      // "guncel" diye onaylayabiliriz.
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  );
}
