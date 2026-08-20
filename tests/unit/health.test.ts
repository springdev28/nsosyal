import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `/api/health` (PROJECT_SPEC 17.16).
 *
 * Bu dosya bir dagitim hatasi sinifini sabitler. Uc kez "site guncellenmemis"
 * durumu yasandi ve her seferinde sunucu 200 donuyordu: ayakta olan ESKI
 * derlemeydi. "Dagitildi" ile "yeni surum yayinda" ayni sey degil. Saglik
 * cikti artik calistigi commit'i soyler ve dagitim hatti bunu bekler; alan
 * kaybolursa dogrulama sessizce anlamsizlasir.
 *
 * Modul seviyesinde okunan bir ortam degiskeni oldugu icin her senaryoda
 * modulu yeniden yukluyoruz.
 */
async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/health/route');
}

const ENV_KEYS = ['NSOSYAL_COMMIT_SHA'] as const;
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('/api/health', () => {
  it('ayakta oldugunu ve calistigi modu bildirir', async () => {
    const { GET } = await loadRoute();
    const body = await GET().json();

    expect(body.status).toBe('ok');
    expect(body.mode).toBe('demo');
    expect(body.topics).toBeGreaterThan(0);
    expect(body.communities).toBeGreaterThan(0);
  });

  it('derlemeye gomulen surum kimligini bildirir', async () => {
    // Uretimde bu degeri `next.config.ts` gomer: once platform degiskenleri,
    // hicbiri yoksa `git rev-parse HEAD`. Burada dogrudan veriyoruz.
    process.env.NSOSYAL_COMMIT_SHA = 'abc123';
    const { GET } = await loadRoute();
    expect((await GET().json()).commit).toBe('abc123');
  });

  it('kimlik yoksa yalan soylemez', async () => {
    const { GET } = await loadRoute();
    // 'unknown' bir hata degil: "bu derleme kimligini bilmiyor" demek. CI bunu
    // gorurse dogrulamayi gecmis saymaz - Hostinger tam olarak bu durumdaydi.
    expect((await GET().json()).commit).toBe('unknown');
  });

  it('onbelleklenmez', async () => {
    process.env.NSOSYAL_COMMIT_SHA = 'abc123';
    const { GET } = await loadRoute();
    // Onbelleklenen bir saglik cikti eski surumu "guncel" diye onaylardi.
    expect(GET().headers.get('cache-control')).toContain('no-store');
  });
});
