/**
 * public/demo altindaki sentetik demo medyasini uretir.
 *
 * Neden: kisa video P0 kapsamindadir (PROJECT_SPEC 5.1) ve canli demoda gercekten
 * oynayan bir video gostermek gerekiyor. Gercek cekim kullanmak yerine, tamamen
 * sentetik ve acikca "demo klip" olarak isaretlenmis kisa kartlar uretiyoruz.
 * Dosyalar kucuk tutulur ve repoda saklanir ki demo internet olmadan da calissin
 * (PROJECT_SPEC 15.4).
 *
 * Video: Chromium ile 540x960 dikey kart kaydedilir (WebM/VP8).
 * Poster ve gorseller: dogrudan SVG olarak yazilir.
 *
 * Kullanim: npm run build:media
 */

import { mkdir, writeFile, readdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

import { ALL_CLIPS, DEMO_IMAGES } from '../src/lib/seed/media';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = join(ROOT, 'public', 'demo', 'video');
const POSTER_DIR = join(ROOT, 'public', 'demo', 'poster');
const IMAGE_DIR = join(ROOT, 'public', 'demo', 'image');
const TMP_DIR = join(ROOT, '.cache', 'video-tmp');

const WIDTH = 540;
const HEIGHT = 960;
/** Kayit suresi. Klibin "gercek" suresi kart uzerinde metin olarak yazar. */
const RECORD_MS = 3200;

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/** Kart HTML'i - hem video kaydinda hem posterde ayni gorsel dil. */
function cardHtml(clip) {
  const seconds = `${clip.durationSec} sn`;
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><style>
  @keyframes drift { from { transform: translate3d(-6%, -4%, 0) scale(1.15); } to { transform: translate3d(6%, 4%, 0) scale(1.3); } }
  @keyframes pulse { 0%,100% { opacity: .55 } 50% { opacity: .95 } }
  * { margin:0; padding:0; box-sizing:border-box }
  body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; background:#04101f;
         font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color:#fff; }
  .stage { position:relative; width:100%; height:100%; display:flex; flex-direction:column;
           justify-content:space-between; padding:56px 44px; }
  .glow { position:absolute; inset:-25%; background:
            radial-gradient(circle at 30% 25%, ${clip.tone}dd, transparent 55%),
            radial-gradient(circle at 72% 78%, ${clip.tone}88, transparent 58%);
          animation: drift 6s ease-in-out infinite alternate; }
  .grid { position:absolute; inset:0; opacity:.16;
          background-image: linear-gradient(#ffffff33 1px, transparent 1px), linear-gradient(90deg, #ffffff33 1px, transparent 1px);
          background-size: 54px 54px; }
  .content { position:relative; z-index:2 }
  .tag { display:inline-flex; align-items:center; gap:8px; border:1px solid #ffffff55; border-radius:999px;
         padding:8px 16px; font-size:20px; font-weight:600; letter-spacing:.02em; backdrop-filter: blur(4px);
         background:#00000044; }
  .emoji { font-size:150px; line-height:1; filter: drop-shadow(0 12px 34px #00000066);
           animation: pulse 3s ease-in-out infinite; }
  h1 { font-size:52px; line-height:1.1; font-weight:800; letter-spacing:-.02em; text-wrap:balance; }
  .sub { margin-top:18px; font-size:26px; opacity:.85 }
  .foot { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between;
          font-size:20px; opacity:.8 }
  .brand { display:flex; align-items:center; gap:10px; font-weight:700 }
  .badge { width:38px; height:38px; border-radius:11px; background:#fff; color:#04101f;
           display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:800 }
</style></head><body>
  <div class="stage">
    <div class="glow"></div><div class="grid"></div>
    <div class="content">
      <span class="tag">🎬 Sentetik demo klibi</span>
    </div>
    <div class="content">
      <div class="emoji">${clip.emoji}</div>
      <h1>${escapeXml(clip.title)}</h1>
      <p class="sub">${escapeXml(clip.subtitle)}</p>
    </div>
    <div class="foot">
      <span class="brand"><span class="badge">5N</span> nSosyal 5N</span>
      <span>${seconds}</span>
    </div>
  </div>
</body></html>`;
}

/** Poster: videonun ilk karesine benzeyen statik SVG. */
function posterSvg(clip) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${escapeXml(clip.title)}">
  <defs>
    <radialGradient id="g1" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="${clip.tone}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${clip.tone}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="72%" cy="78%" r="60%">
      <stop offset="0%" stop-color="${clip.tone}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${clip.tone}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#04101f"/>
  <rect width="100%" height="100%" fill="url(#g1)"/>
  <rect width="100%" height="100%" fill="url(#g2)"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <text x="44" y="86" font-family="system-ui, sans-serif" font-size="20" fill="#ffffff" fill-opacity="0.85">🎬 Sentetik demo klibi</text>
  <text x="44" y="600" font-size="140">${clip.emoji}</text>
  <text x="44" y="700" font-family="system-ui, sans-serif" font-size="46" font-weight="800" fill="#ffffff">${escapeXml(
    clip.title.length > 22 ? `${clip.title.slice(0, 21)}…` : clip.title,
  )}</text>
  <text x="44" y="742" font-family="system-ui, sans-serif" font-size="24" fill="#ffffff" fill-opacity="0.85">${escapeXml(
    clip.subtitle,
  )}</text>
  <text x="44" y="904" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#ffffff" fill-opacity="0.8">nSosyal 5N</text>
</svg>`;
}

/** Gonderi gorselleri: soyut, hafif ve tamamen sentetik SVG kartlar. */
function imageSvg(image) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-label="${escapeXml(
    image.alt,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${image.tone}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${image.tone}" stop-opacity="0.06"/>
    </linearGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${image.tone}" fill-opacity="0.28"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#f4f6fa"/>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#dots)"/>
  <g transform="translate(64 96)">
    <rect width="360" height="14" rx="7" fill="${image.tone}" fill-opacity="0.55"/>
    <rect y="34" width="250" height="10" rx="5" fill="${image.tone}" fill-opacity="0.32"/>
    <rect y="60" width="300" height="10" rx="5" fill="${image.tone}" fill-opacity="0.22"/>
  </g>
  <g transform="translate(64 230)">
    <rect width="180" height="180" rx="20" fill="${image.tone}" fill-opacity="0.16" stroke="${image.tone}" stroke-opacity="0.4"/>
    <text x="90" y="112" font-size="76" text-anchor="middle">${image.emoji}</text>
  </g>
  <g transform="translate(288 244)" font-family="system-ui, sans-serif">
    <text font-size="30" font-weight="700" fill="#1c2b44">${escapeXml(image.title)}</text>
    <text y="42" font-size="18" fill="#4c5f7a">Sentetik demo görseli</text>
    <rect y="72" width="420" height="10" rx="5" fill="${image.tone}" fill-opacity="0.3"/>
    <rect y="94" width="340" height="10" rx="5" fill="${image.tone}" fill-opacity="0.22"/>
    <rect y="116" width="386" height="10" rx="5" fill="${image.tone}" fill-opacity="0.16"/>
  </g>
  <text x="736" y="452" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#1c2b44" fill-opacity="0.55" text-anchor="end">nSosyal 5N · demo</text>
</svg>`;
}

async function buildStaticAssets() {
  await mkdir(POSTER_DIR, { recursive: true });
  await mkdir(IMAGE_DIR, { recursive: true });

  for (const clip of ALL_CLIPS) {
    await writeFile(join(POSTER_DIR, `${clip.key}.svg`), posterSvg(clip));
  }
  console.log(`  ${ALL_CLIPS.length} poster yazildi.`);

  for (const image of DEMO_IMAGES) {
    await writeFile(join(IMAGE_DIR, `${image.key}.svg`), imageSvg(image));
  }
  console.log(`  ${DEMO_IMAGES.length} gorsel yazildi.`);
}

async function buildVideos() {
  await mkdir(VIDEO_DIR, { recursive: true });
  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({ executablePath });

  for (const clip of ALL_CLIPS) {
    const outDir = join(TMP_DIR, clip.key);
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      recordVideo: { dir: outDir, size: { width: WIDTH, height: HEIGHT } },
    });
    const page = await context.newPage();
    await page.setContent(cardHtml(clip), { waitUntil: 'load' });
    await page.waitForTimeout(RECORD_MS);
    await context.close();

    const [file] = await readdir(outDir);
    await rename(join(outDir, file), join(VIDEO_DIR, `${clip.key}.webm`));
    console.log(`  ${clip.key}.webm`);
  }

  await browser.close();
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log(`  ${ALL_CLIPS.length} klip yazildi.`);
}

async function main() {
  console.log('Statik demo medyasi uretiliyor...');
  await buildStaticAssets();
  console.log('Demo klipleri kaydediliyor...');
  await buildVideos();
  console.log('Demo medyasi hazir.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
