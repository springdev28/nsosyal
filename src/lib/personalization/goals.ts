import type { GoalKey } from '@/types/domain';

/**
 * Kalici platform amaclari katalogu (PROJECT_SPEC 7.10 / 10.1.1).
 *
 * Etiketler spec'in saydigi amaclarin birebir karsiligidir; liste kapalidir.
 * Serbest metin olsaydi ne siralamaya (rank.ts) ne de analitige baglanabilirdi,
 * ayrica iki kullanicinin "ogrenmek" yazisi ayni sey sayilamazdi.
 *
 * Bu dosya `'use server'` degildir: sabitler burada durur, Server Action
 * dosyalari yalnizca async fonksiyon disari verebilir.
 */
export interface GoalOption {
  key: GoalKey;
  label: string;
  /** Ayarlar ekraninda kisa aciklama; uzun anlatim degil (spec 8.1.2). */
  hint: string;
}

export const GOALS: readonly GoalOption[] = [
  { key: 'socialize', label: 'Sosyalleşmek', hint: 'Sohbet ve tanışma' },
  { key: 'meet_people', label: 'Yeni insanlarla tanışmak', hint: 'Çevreni genişletmek' },
  { key: 'discover_people', label: 'Bilgili kişileri keşfetmek', hint: 'Alanında üreten insanlar' },
  { key: 'find_communities', label: 'Topluluk bulmak', hint: 'Ait olacağın bir çevre' },
  { key: 'discover_events', label: 'Etkinlik keşfetmek', hint: 'Buluşma, atölye, yarışma' },
  { key: 'discover_projects', label: 'Proje keşfetmek', hint: 'Başkalarının ürettikleri' },
  { key: 'share_projects', label: 'Kendi projemi paylaşmak', hint: 'Süreci görünür kılmak' },
  { key: 'find_collaborators', label: 'Ekip veya iş birliği bulmak', hint: 'Birlikte geliştirmek' },
  { key: 'learn', label: 'Öğrenmek', hint: 'Yeni bir alana girmek' },
  { key: 'find_resources', label: 'Kaynak bulmak', hint: 'Rehber ve yöntem' },
  { key: 'follow_developments', label: 'Gelişmeleri takip etmek', hint: 'Alandaki yenilikler' },
  { key: 'discover_local_ecosystem', label: 'Yerel ekosistemi keşfetmek', hint: 'Yakınındaki üretim' },
  { key: 'find_institutions', label: 'Kurumları bulmak', hint: 'Teknopark, kulüp, dernek' },
  { key: 'discover_opportunities', label: 'Fırsatları görmek', hint: 'Çağrı, burs, program' },
  { key: 'casual_discussion', label: 'Gündelik içerik ve tartışma', hint: 'Ağır olmayan akış' },
  { key: 'follow_creation_stories', label: 'Üretim süreçlerini görmek', hint: 'Sonuç değil, yol' },
] as const;

const GOAL_KEYS = new Set<string>(GOALS.map((goal) => goal.key));

/** Formdan gelen degerleri kontrollu sozluge gore suzer. */
export function parseGoalKeys(values: readonly string[]): GoalKey[] {
  const seen = new Set<GoalKey>();
  for (const value of values) {
    if (GOAL_KEYS.has(value)) seen.add(value as GoalKey);
  }
  return [...seen];
}

export function goalLabel(key: GoalKey): string {
  return GOALS.find((goal) => goal.key === key)?.label ?? key;
}
