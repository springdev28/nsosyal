/**
 * geoBoundaries TUR ADM2 verisini uygulamanin il bazli GeoJSON dosyalarina cevirir.
 *
 * NEDEN VAR: urun Turkiye genelidir; tek bir Izmir dosyasi ilce drill-down'ini
 * urun kuraliymis gibi sinirliyordu. Kaynak OSM/ODbL tabanli geoBoundaries
 * 2021 sinirlaridir. Girdi URL'si sabit bir veri surumune pinlenmistir.
 *
 * Kullanim:
 *   node scripts/import-district-geo.mjs /tmp/turkey-districts.geojson
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(process.argv[2] ?? '/tmp/turkey-districts-geoboundaries.geojson');
const provincePath = join(ROOT, 'public/geo/turkey-provinces.geojson');
const outDir = join(ROOT, 'public/geo');
const modulePath = join(ROOT, 'src/lib/geo/districts.generated.ts');

const [districtCollection, provinceCollection] = await Promise.all([
  readFile(input, 'utf8').then(JSON.parse),
  readFile(provincePath, 'utf8').then(JSON.parse),
]);

function ringsOfGeometry(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function inRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function contains(geometry, point) {
  return ringsOfGeometry(geometry).some((polygon) => {
    if (!inRing(point, polygon[0])) return false;
    return polygon.slice(1).every((hole) => !inRing(point, hole));
  });
}

function boundsOf(geometry) {
  const points = ringsOfGeometry(geometry).flat(2);
  return points.reduce(
    (box, [x, y]) => [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
}

function interiorPoint(geometry) {
  const [minX, minY, maxX, maxY] = boundsOf(geometry);
  const center = [(minX + maxX) / 2, (minY + maxY) / 2];
  if (contains(geometry, center)) return center;

  // Ic nokta icin sabit bir tarama kullanilir; sinir noktasi secip iki ile
  // birden dusme riskini ortadan kaldirir.
  for (let rows = 1; rows <= 19; rows += 1) {
    const y = minY + ((maxY - minY) * rows) / 20;
    for (let columns = 1; columns <= 19; columns += 1) {
      const point = [minX + ((maxX - minX) * columns) / 20, y];
      if (contains(geometry, point)) return point;
    }
  }

  return ringsOfGeometry(geometry)[0]?.[0]?.[0] ?? center;
}

function normalize(value) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const IZMIR_NAMES = [
  'Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
  'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık',
  'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla',
];
const izmirName = new Map(IZMIR_NAMES.map((name) => [normalize(name), name]));

const byProvince = new Map(provinceCollection.features.map((feature) => [feature.properties.code, []]));
const fallbackMatches = [];

for (const feature of districtCollection.features) {
  const point = interiorPoint(feature.geometry);
  let province = provinceCollection.features.find((candidate) => contains(candidate.geometry, point));
  if (!province) {
    // Sadelestirilmis iki veri setinin kiyilari birkac yuz metre ayrisabilir.
    // Yalnizca boyle bir eslesmeme halinde en yakin il merkezi kullanilir.
    province = provinceCollection.features.reduce((nearest, candidate) => {
      const [x, y] = candidate.properties.center;
      const distance = (x - point[0]) ** 2 + (y - point[1]) ** 2;
      return !nearest || distance < nearest.distance ? { feature: candidate, distance } : nearest;
    }, null).feature;
    fallbackMatches.push(`${feature.properties.shapeName} -> ${province.properties.name}`);
  }

  const provinceCode = province.properties.code;
  const rawName = String(feature.properties.shapeName ?? '').trim();
  const name = provinceCode === '35' ? (izmirName.get(normalize(rawName)) ?? rawName) : rawName;
  byProvince.get(provinceCode).push({ ...feature, properties: { name, provinceCode } });
}

await mkdir(outDir, { recursive: true });
const rows = [];

for (const province of provinceCollection.features) {
  const provinceCode = province.properties.code;
  const features = byProvince.get(provinceCode).sort((a, b) =>
    a.properties.name.localeCompare(b.properties.name, 'tr-TR'),
  );

  features.forEach((feature, index) => {
    const code = `${provinceCode}-${String(index + 1).padStart(2, '0')}`;
    feature.properties = { code, provinceCode, name: feature.properties.name };
    rows.push({ code, provinceCode, name: feature.properties.name });
  });

  await writeFile(
    join(outDir, `districts-${provinceCode}.geojson`),
    JSON.stringify({ type: 'FeatureCollection', features }),
  );
}

const source = `// OTOMATIK URETILDI - elle duzenlemeyin.\n// Kaynak: geoBoundaries TUR ADM2 (OSM/ODbL), scripts/import-district-geo.mjs\n\nimport type { District } from '@/types/domain';\n\nexport const DISTRICT_DATA_PROVINCES: readonly string[] = ${JSON.stringify([...byProvince.keys()])};\n\nexport const DISTRICTS: readonly District[] = [\n${rows
  .map((row) => `  { code: '${row.code}', provinceCode: '${row.provinceCode}', name: ${JSON.stringify(row.name)} },`)
  .join('\n')}\n];\n`;

await writeFile(modulePath, source);
console.log(`${rows.length} ilce, ${byProvince.size} il ve ${byProvince.size} GeoJSON dosyasi yazildi.`);
if (fallbackMatches.length > 0) console.log(`Kiyi yedegi: ${fallbackMatches.join(', ')}`);
