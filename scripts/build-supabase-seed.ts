/**
 * supabase/seed.sql dosyasini uretir.
 *
 * Yalnizca REFERANS verisini yazar: iller, ilceler ve kok konu taksonomisi.
 * Sentetik demo icerigi (profiller, gonderiler, etkinlikler) bilerek buraya
 * yazilmaz; o veri uygulamanin demo deposunda yasar ve zaman damgalari her
 * calistirmada "simdi"ye gore uretilir (bkz. src/lib/seed).
 *
 * Kullanim: npm run build:supabase-seed
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DISTRICTS, PROVINCES } from '../src/lib/geo/regions.generated';
import { TOPICS } from '../src/lib/seed/topics';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** SQL tek tirnak kacisi. */
const q = (value: string) => `'${value.replaceAll("'", "''")}'`;

async function main() {
  const provinceRows = PROVINCES.map(
    (p) => `  (${q(p.code)}, ${q(p.name)}, ${p.center[0]}, ${p.center[1]})`,
  ).join(',\n');

  const districtRows = DISTRICTS.map(
    (d) => `  (${q(d.code)}, ${q(d.provinceCode)}, ${q(d.name)})`,
  ).join(',\n');

  const topicRows = TOPICS.map(
    (t) => `  (${q(t.slug)}, ${q(t.name)}, ${q(t.emoji)}, ${q(t.description)})`,
  ).join(',\n');

  const sql = `-- =============================================================================
-- nSosyal 5N1K · Referans verisi
--
-- OTOMATIK URETILDI - elle duzenlemeyin.
-- Yeniden uretmek icin: npm run build:supabase-seed
--
-- Bu dosya yalnizca degismeyen referans verisini icerir: 81 il, pilot il
-- ilceleri ve kok konu taksonomisi. Sentetik demo icerigi burada DEGILDIR;
-- prototip demo modunda kendi bellek ici veri kumesini uretir.
--
-- Kaynak ve lisans: il/ilce sinirlari OpenStreetMap katkida bulunanlar (ODbL).
-- =============================================================================

insert into public.provinces (code, name, center_lng, center_lat) values
${provinceRows}
on conflict (code) do update
  set name = excluded.name,
      center_lng = excluded.center_lng,
      center_lat = excluded.center_lat;

insert into public.districts (code, province_code, name) values
${districtRows}
on conflict (code) do update
  set province_code = excluded.province_code,
      name = excluded.name;

insert into public.topics (slug, name, emoji, description) values
${topicRows}
on conflict (slug) do update
  set name = excluded.name,
      emoji = excluded.emoji,
      description = excluded.description;
`;

  await mkdir(join(ROOT, 'supabase'), { recursive: true });
  await writeFile(join(ROOT, 'supabase', 'seed.sql'), sql);
  console.log(
    `supabase/seed.sql yazildi: ${PROVINCES.length} il, ${DISTRICTS.length} ilce, ${TOPICS.length} konu.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
