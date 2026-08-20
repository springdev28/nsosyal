import { execSync } from 'node:child_process';

import type { NextConfig } from 'next';

/**
 * Bu derlemenin hangi commit'ten cikttigini bul.
 *
 * NEDEN BURADA: "dagitildi" ile "yeni surum yayinda" ayni sey degil. Bu proje
 * birkac kez "hicbir sey degismemis" gorundu; sunucu 200 donuyordu ama uzerinde
 * eski derleme vardi. `/api/health` calistigi commit'i soylerse bu bir daha
 * sessizce olmaz - ama ancak deger derlemeye GERCEKTEN gomulurse.
 *
 * Ortam degiskenine guvenmek yetmiyor: Render `RENDER_GIT_COMMIT` verir,
 * Hostinger'in GitHub entegrasyonu hicbir sey vermez ve orasi `unknown`
 * bildiriyordu. Bu yuzden son care olarak deponun kendisine soruyoruz -
 * platform depoyu klonlayarak derledigi icin `.git` orada olur.
 *
 * Sonuc `env` ile derleme aninda gomulur; calisma aninda git'e ihtiyac yoktur.
 */
function resolveCommit(): string {
  const fromEnv =
    process.env.NSOSYAL_COMMIT_SHA ??
    process.env.RENDER_GIT_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;

  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // Git yoksa (or. yalnizca derleme ciktisi kopyalanmis bir sunucu) sessizce
    // 'unknown' doneriz. Bu bir hata degil; dagitim hatti bunu ayrica raporlar.
    return 'unknown';
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NSOSYAL_COMMIT_SHA: resolveCommit(),
  },
  // The prototype ships its own synthetic media under /public/demo, so no remote
  // image hosts are configured on purpose: the live demo must not depend on a CDN.
  images: {
    remotePatterns: [],
  },
  eslint: {
    dirs: ['src', 'tests'],
  },
};

export default nextConfig;
