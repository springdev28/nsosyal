/**
 * public/geo altindaki harita verisini uretir.
 *
 * Kaynak ve lisans (PROJECT_SPEC 9.6):
 * - Il sinirlari: cihadturhan/tr-geojson, OpenStreetMap'ten uretilmis, ODbL.
 * - Ilce sinirlari: OpenStreetMap / Nominatim, ODbL.
 * Her iki kaynak da "© OpenStreetMap katkida bulunanlar" atfini gerektirir;
 * bu atif README ve uygulamanin Hakkinda sayfasinda gosterilir.
 *
 * Cikti verisi sosyal kesif icin gorsel amaclidir, resmi idari sinir verisi
 * degildir; poligonlar okunabilirlik ve dosya boyutu icin sadelestirilmistir.
 *
 * Kullanim: node scripts/build-geo.mjs
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'geo');
/** Ham API yanitlari burada onbelleklenir; gitignore edilir. Nominatim'i gereksiz yormamak icin. */
const CACHE_DIR = join(ROOT, '.cache', 'geo');

const PROVINCE_SOURCE =
  'https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json';

/** Kaynak dosyadaki il adi -> plaka kodu. Kaynak "Afyon" yaziyor, biz resmi adi kullaniyoruz. */
const PLATE_CODES = {
  Adana: ['01', 'Adana'],
  Adıyaman: ['02', 'Adıyaman'],
  Afyon: ['03', 'Afyonkarahisar'],
  Ağrı: ['04', 'Ağrı'],
  Amasya: ['05', 'Amasya'],
  Ankara: ['06', 'Ankara'],
  Antalya: ['07', 'Antalya'],
  Artvin: ['08', 'Artvin'],
  Aydın: ['09', 'Aydın'],
  Balıkesir: ['10', 'Balıkesir'],
  Bilecik: ['11', 'Bilecik'],
  Bingöl: ['12', 'Bingöl'],
  Bitlis: ['13', 'Bitlis'],
  Bolu: ['14', 'Bolu'],
  Burdur: ['15', 'Burdur'],
  Bursa: ['16', 'Bursa'],
  Çanakkale: ['17', 'Çanakkale'],
  Çankırı: ['18', 'Çankırı'],
  Çorum: ['19', 'Çorum'],
  Denizli: ['20', 'Denizli'],
  Diyarbakır: ['21', 'Diyarbakır'],
  Edirne: ['22', 'Edirne'],
  Elazığ: ['23', 'Elazığ'],
  Erzincan: ['24', 'Erzincan'],
  Erzurum: ['25', 'Erzurum'],
  Eskişehir: ['26', 'Eskişehir'],
  Gaziantep: ['27', 'Gaziantep'],
  Giresun: ['28', 'Giresun'],
  Gümüşhane: ['29', 'Gümüşhane'],
  Hakkari: ['30', 'Hakkâri'],
  Hatay: ['31', 'Hatay'],
  Isparta: ['32', 'Isparta'],
  Mersin: ['33', 'Mersin'],
  İstanbul: ['34', 'İstanbul'],
  İzmir: ['35', 'İzmir'],
  Kars: ['36', 'Kars'],
  Kastamonu: ['37', 'Kastamonu'],
  Kayseri: ['38', 'Kayseri'],
  Kırklareli: ['39', 'Kırklareli'],
  Kırşehir: ['40', 'Kırşehir'],
  Kocaeli: ['41', 'Kocaeli'],
  Konya: ['42', 'Konya'],
  Kütahya: ['43', 'Kütahya'],
  Malatya: ['44', 'Malatya'],
  Manisa: ['45', 'Manisa'],
  Kahramanmaraş: ['46', 'Kahramanmaraş'],
  Mardin: ['47', 'Mardin'],
  Muğla: ['48', 'Muğla'],
  Muş: ['49', 'Muş'],
  Nevşehir: ['50', 'Nevşehir'],
  Niğde: ['51', 'Niğde'],
  Ordu: ['52', 'Ordu'],
  Rize: ['53', 'Rize'],
  Sakarya: ['54', 'Sakarya'],
  Samsun: ['55', 'Samsun'],
  Siirt: ['56', 'Siirt'],
  Sinop: ['57', 'Sinop'],
  Sivas: ['58', 'Sivas'],
  Tekirdağ: ['59', 'Tekirdağ'],
  Tokat: ['60', 'Tokat'],
  Trabzon: ['61', 'Trabzon'],
  Tunceli: ['62', 'Tunceli'],
  Şanlıurfa: ['63', 'Şanlıurfa'],
  Uşak: ['64', 'Uşak'],
  Van: ['65', 'Van'],
  Yozgat: ['66', 'Yozgat'],
  Zonguldak: ['67', 'Zonguldak'],
  Aksaray: ['68', 'Aksaray'],
  Bayburt: ['69', 'Bayburt'],
  Karaman: ['70', 'Karaman'],
  Kırıkkale: ['71', 'Kırıkkale'],
  Batman: ['72', 'Batman'],
  Şırnak: ['73', 'Şırnak'],
  Bartın: ['74', 'Bartın'],
  Ardahan: ['75', 'Ardahan'],
  Iğdır: ['76', 'Iğdır'],
  Yalova: ['77', 'Yalova'],
  Karabük: ['78', 'Karabük'],
  Kilis: ['79', 'Kilis'],
  Osmaniye: ['80', 'Osmaniye'],
  Düzce: ['81', 'Düzce'],
};

/** Pilot il: demo senaryosu Izmir uzerinden ilerliyor (PROJECT_SPEC 15.3). */
const PILOT_PROVINCE = { code: '35', name: 'İzmir' };
const IZMIR_DISTRICTS = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca',
  'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun',
  'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere',
  'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla',
];

// --- Geometri yardimcilari -------------------------------------------------

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + clamped * dx), y - (y1 + clamped * dy));
}

/** Douglas-Peucker sadelestirme. */
function simplifyRing(points, tolerance) {
  if (points.length <= 4) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  const left = simplifyRing(points.slice(0, index + 1), tolerance);
  const right = simplifyRing(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

const round = (n, digits) => Number(n.toFixed(digits));

function simplifyPolygon(rings, tolerance, digits) {
  return rings
    .map((ring) => {
      const simplified = simplifyRing(ring, tolerance).map(([x, y]) => [round(x, digits), round(y, digits)]);
      // Halkayi kapali tut; sadelestirme bitis noktasini bozabilir.
      const first = simplified[0];
      const last = simplified[simplified.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) simplified.push([first[0], first[1]]);
      return simplified;
    })
    .filter((ring) => ring.length >= 4);
}

function simplifyGeometry(geometry, tolerance, digits) {
  if (geometry.type === 'Polygon') {
    const coordinates = simplifyPolygon(geometry.coordinates, tolerance, digits);
    return coordinates.length ? { type: 'Polygon', coordinates } : null;
  }
  if (geometry.type === 'MultiPolygon') {
    const coordinates = geometry.coordinates
      .map((polygon) => simplifyPolygon(polygon, tolerance, digits))
      .filter((polygon) => polygon.length);
    return coordinates.length ? { type: 'MultiPolygon', coordinates } : null;
  }
  return null;
}

/** En buyuk halkanin alan agirlikli merkezi - etiket ve odaklama icin. */
function polygonCentroid(geometry) {
  const rings =
    geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]);
  let best = null;
  let bestArea = -1;
  for (const ring of rings) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    area /= 2;
    const absArea = Math.abs(area);
    if (absArea > bestArea && absArea > 0) {
      bestArea = absArea;
      best = [round(cx / (6 * area), 4), round(cy / (6 * area), 4)];
    }
  }
  return best;
}

function bboxOf(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return [round(minX, 4), round(minY, 4), round(maxX, 4), round(maxY, 4)];
}

// --- Il sinirlari ----------------------------------------------------------

async function buildProvinces() {
  console.log('Il sinirlari indiriliyor...');
  const response = await fetch(PROVINCE_SOURCE);
  if (!response.ok) throw new Error(`Il kaynagi indirilemedi: HTTP ${response.status}`);
  // Kaynak dosya BOM ile basliyor.
  const source = JSON.parse((await response.text()).replace(/^﻿/, ''));

  const features = [];
  for (const feature of source.features) {
    const entry = PLATE_CODES[feature.properties.name];
    if (!entry) {
      console.warn(`  ! plaka kodu eslesmedi: ${feature.properties.name}`);
      continue;
    }
    const [code, name] = entry;
    const geometry = simplifyGeometry(feature.geometry, 0.006, 4);
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      id: Number(code),
      properties: { code, name, center: polygonCentroid(geometry), bbox: bboxOf(geometry) },
      geometry,
    });
  }

  features.sort((a, b) => a.properties.code.localeCompare(b.properties.code));
  if (features.length !== 81) throw new Error(`81 il beklenirken ${features.length} il uretildi`);

  const collection = {
    type: 'FeatureCollection',
    attribution: '© OpenStreetMap katkıda bulunanlar (ODbL)',
    note: 'Görsel keşif amaçlı, sadeleştirilmiş sınırlar. Resmî idari sınır verisi değildir.',
    features,
  };
  await writeFile(join(OUT_DIR, 'turkey-provinces.geojson'), JSON.stringify(collection));
  console.log(`  ${features.length} il yazildi.`);
  return features;
}

// --- Pilot il ilce sinirlari ----------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readCache(key) {
  try {
    return JSON.parse(await readFile(join(CACHE_DIR, `${key}.json`), 'utf8'));
  } catch {
    return null;
  }
}

/** 429 (rate limit) durumunda artan bekleme ile yeniden dener. */
async function fetchWithBackoff(url, options, attempts = 4) {
  let wait = 3000;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) return response;
    if (attempt === attempts) return response;
    console.warn(`    HTTP ${response.status}, ${wait / 1000}s sonra tekrar denenecek...`);
    await sleep(wait);
    wait *= 2;
  }
  return null;
}

async function buildPilotDistricts() {
  console.log(`Pilot il ilceleri indiriliyor (${PILOT_PROVINCE.name})...`);
  await mkdir(CACHE_DIR, { recursive: true });
  const features = [];

  for (const [index, district] of IZMIR_DISTRICTS.entries()) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${district}, ${PILOT_PROVINCE.name}, Türkiye`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('polygon_geojson', '1');
    // Nominatim ilk sirada tren istasyonu gibi noktalari dondurebiliyor;
    // birkac aday isteyip idari sinir olani seciyoruz.
    url.searchParams.set('limit', '8');
    url.searchParams.set('countrycodes', 'tr');

    const cacheKey = `izmir-${String(index + 1).padStart(2, '0')}`;
    let candidates = await readCache(cacheKey);

    if (!candidates) {
      const response = await fetchWithBackoff(url, {
        headers: {
          // Nominatim kullanim politikasi tanimlanabilir bir User-Agent istiyor.
          'User-Agent': 'nsosyal-5n-prototype/0.1 (TEKNOFEST nSosyal Inovasyon 2026)',
          'Accept-Language': 'tr',
        },
      });
      if (!response?.ok) {
        console.warn(`  ! ${district}: HTTP ${response?.status ?? 'baglanti hatasi'}`);
        await sleep(1500);
        continue;
      }
      candidates = await response.json();
      await writeFile(join(CACHE_DIR, `${cacheKey}.json`), JSON.stringify(candidates));
      // Nominatim kullanim politikasi: saniyede en fazla 1 istek.
      await sleep(1500);
    }

    // Ilce = idari sinir. OSM'de Turkiye ilceleri cogunlukla "town", buyuksehir
    // ilceleri "city", bazilari "county" olarak etiketleniyor.
    const ADMIN_TYPES = new Set(['town', 'city', 'county', 'municipality', 'district']);
    const hit =
      candidates.find(
        (c) =>
          c.type === 'administrative' &&
          ADMIN_TYPES.has(c.addresstype) &&
          (c.geojson?.type === 'Polygon' || c.geojson?.type === 'MultiPolygon'),
      ) ??
      candidates.find(
        (c) => c.type === 'administrative' && (c.geojson?.type === 'Polygon' || c.geojson?.type === 'MultiPolygon'),
      );

    if (!hit?.geojson) {
      console.warn(`  ! ${district}: idari sinir verisi bulunamadi`);
      continue;
    }

    const geometry = simplifyGeometry(hit.geojson, 0.0015, 4);
    if (!geometry) {
      console.warn(`  ! ${district}: geometri sadelestirilemedi (${hit.geojson.type})`);
      continue;
    }

    features.push({
      type: 'Feature',
      properties: {
        code: `${PILOT_PROVINCE.code}-${String(index + 1).padStart(2, '0')}`,
        provinceCode: PILOT_PROVINCE.code,
        name: district,
        center: polygonCentroid(geometry),
      },
      geometry,
    });
    console.log(`  ${district} tamam.`);
  }

  const collection = {
    type: 'FeatureCollection',
    attribution: '© OpenStreetMap katkıda bulunanlar (ODbL)',
    note: 'Görsel keşif amaçlı, sadeleştirilmiş sınırlar. Resmî idari sınır verisi değildir.',
    provinceCode: PILOT_PROVINCE.code,
    features,
  };
  await writeFile(join(OUT_DIR, 'izmir-districts.geojson'), JSON.stringify(collection));
  console.log(`  ${features.length} ilce yazildi.`);
  return features;
}

// --- Turetilmis TypeScript listesi ----------------------------------------

/**
 * Poligonlari client bundle'a sokmadan il/ilce adlarini form ve filtrelerde
 * kullanabilmek icin kucuk bir TypeScript modulu uretiyoruz.
 */
async function writeRegionModule(provinces, districts) {
  const provinceRows = provinces.map((f) => {
    const { code, name, center } = f.properties;
    return `  { code: '${code}', name: '${name}', center: [${center[0]}, ${center[1]}] },`;
  });
  const districtRows = districts.map((f) => {
    const { code, provinceCode, name } = f.properties;
    return `  { code: '${code}', provinceCode: '${provinceCode}', name: '${name}' },`;
  });

  const contents = `// OTOMATIK URETILDI - elle duzenlemeyin.
// Kaynak: scripts/build-geo.mjs (OpenStreetMap / ODbL)
// Yeniden uretmek icin: npm run build:geo

import type { District, Province } from '@/types/domain';

/** 81 il, plaka kodu sirasinda. */
export const PROVINCES: readonly Province[] = [
${provinceRows.join('\n')}
];

/** Pilot il ilceleri (PROJECT_SPEC 7.4: ilce detayi bir pilot il icin yeterlidir). */
export const PILOT_PROVINCE_CODE = '${PILOT_PROVINCE.code}';

export const DISTRICTS: readonly District[] = [
${districtRows.join('\n')}
];
`;

  await mkdir(join(ROOT, 'src', 'lib', 'geo'), { recursive: true });
  await writeFile(join(ROOT, 'src', 'lib', 'geo', 'regions.generated.ts'), contents);
  console.log(`  regions.generated.ts yazildi (${provinces.length} il, ${districts.length} ilce).`);
}

await mkdir(OUT_DIR, { recursive: true });
const provinceFeatures = await buildProvinces();
const districtFeatures = await buildPilotDistricts();
await writeRegionModule(provinceFeatures, districtFeatures);
console.log('Harita verisi hazir.');
