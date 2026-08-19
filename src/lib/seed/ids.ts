import type { UUID } from '@/types/domain';

/**
 * Deterministik kimlik uretici.
 *
 * Seed verisi her sunucu baslangicinda yeniden uretilir. Kimliklerin sabit
 * kalmasi gerekiyor ki paylasilan baglantilar (ornegin demo sirasinda acilan bir
 * proje URL'i) yeniden baslatmadan sonra da calissin. Ayni zamanda seed
 * dosyalarinda "uid('project', 'ruzgar-olcer')" gibi okunabilir referanslar
 * kullanabilmemizi saglar.
 *
 * Kriptografik degildir; yalnizca sabit ve carpisma olasiligi dusuk olmasi yeterli.
 */
function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const hex = (value: number, length: number) => value.toString(16).padStart(8, '0').slice(0, length);

export function uid(namespace: string, key: string): UUID {
  const base = `${namespace}:${key}`;
  const a = fnv1a(base, 0x811c9dc5);
  const b = fnv1a(base, 0x1000193);
  const c = fnv1a(`${base}#2`, 0x811c9dc5);
  const d = fnv1a(`${base}#3`, 0x1000193);

  // UUID v4 bicimini taklit eder: surum hanesi 4, varyant hanesi 8.
  return [
    hex(a, 8),
    hex(b, 4),
    `4${hex(b >>> 4, 3)}`,
    `8${hex(c, 3)}`,
    `${hex(c >>> 8, 4)}${hex(d, 8)}`.slice(0, 12),
  ].join('-');
}
