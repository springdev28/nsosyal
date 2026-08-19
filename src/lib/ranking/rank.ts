/**
 * Aciklanabilir akis siralamasi.
 *
 * PROJECT_SPEC 12.1: prototipte makine ogrenmesi modeli yerine agirlikli,
 * aciklanabilir bir skor kullanilir. Boylece hem urun degeri gosterilir hem de
 * model dogrulama yuku dogmaz; ayrica her karta "Neden gosteriliyor?" yaziabilir.
 *
 * KRITIK URUN KURALI (PROJECT_SPEC 1.1 / 12.1):
 * Bu dosya sponsorlu icerik, odeme, ilan veya gazete kavramlarini BILMEZ.
 * Ucretli gorunurluk yalnizca nGazete icinde yasar ve kisisel akis siralamasini
 * hicbir kosulda degistiremez. Bu modul newspaper modullerinden import yapmaz;
 * tests/unit/ranking.test.ts bunu ayrica dogrular.
 */

import type { GoalKey, IntentMode, Post, RankedPost, RankingReason, RankingSignals, UUID } from '@/types/domain';

/** PROJECT_SPEC 12.1'deki baslangic agirliklari. Urun gercegi degil, demo baslangic degerleridir. */
export const BASE_WEIGHTS: RankingSignals = {
  topicMatch: 0.3,
  followedSource: 0.2,
  communityMatch: 0.15,
  intentMatch: 0.1,
  recency: 0.1,
  locationMatch: 0.1,
  explorationBonus: 0.05,
};

/**
 * Niyet modu agirliklari yeniden dagitir (PROJECT_SPEC 7.1).
 * Toplam her modda 1.0'da tutulur ki skorlar modlar arasi karsilastirilabilsin.
 */
export const INTENT_WEIGHTS: Record<IntentMode, RankingSignals> = {
  sosyallesme: {
    topicMatch: 0.2,
    followedSource: 0.32,
    communityMatch: 0.2,
    intentMatch: 0.1,
    recency: 0.11,
    locationMatch: 0.05,
    explorationBonus: 0.02,
  },
  kesfet: {
    topicMatch: 0.24,
    followedSource: 0.08,
    communityMatch: 0.1,
    intentMatch: 0.12,
    recency: 0.1,
    locationMatch: 0.18,
    explorationBonus: 0.18,
  },
  ogren: {
    topicMatch: 0.3,
    followedSource: 0.12,
    communityMatch: 0.16,
    intentMatch: 0.24,
    recency: 0.06,
    locationMatch: 0.06,
    explorationBonus: 0.06,
  },
  uret: {
    topicMatch: 0.28,
    followedSource: 0.14,
    communityMatch: 0.14,
    intentMatch: 0.26,
    recency: 0.08,
    locationMatch: 0.06,
    explorationBonus: 0.04,
  },
};

/** Her niyet modunun oncelikledigi gonderi turleri (PROJECT_SPEC 7.1). */
const INTENT_POST_TYPES: Record<IntentMode, Post['type'][]> = {
  sosyallesme: ['text', 'image', 'video', 'question'],
  kesfet: ['video', 'image', 'event_announcement', 'why_link'],
  ogren: ['resource_suggestion', 'question', 'why_link', 'text'],
  uret: ['project_update', 'event_announcement', 'question', 'text'],
};

export interface RankingViewer {
  id: UUID;
  topicIds: UUID[];
  followingIds: UUID[];
  communityIds: UUID[];
  provinceCode: string | null;
  districtCode: string | null;
  /** Kalici platform amaclari. */
  goalKeys: GoalKey[];
  /** Anlik niyet; secilmemis olabilir. */
  intentMode: IntentMode | null;
}

export interface RankingContext {
  viewer: RankingViewer;
  now: Date;
  /** Yazar basina takipci sayisi - "yeni sesler" bonusu icin. */
  followerCounts: Record<UUID, number>;
  /** Aciklama metni uretmek icin konu ve il adlari. */
  topicNames?: Record<UUID, string>;
  provinceNames?: Record<string, string>;
  /** Tazelik yariomru (saat). Varsayilan 36 saat. */
  recencyHalfLifeHours?: number;
}

const DEFAULT_HALF_LIFE_HOURS = 36;

/** Yeni ses esigi: bu sayidan az takipcisi olan hesaplar kesif bonusu alir. */
export const NEW_VOICE_FOLLOWER_THRESHOLD = 120;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function overlapRatio(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const set = new Set(b);
  let hits = 0;
  for (const item of a) if (set.has(item)) hits += 1;
  // Kullanicinin ilgi alani sayisi arttikca tek eslesme deger kaybetmesin diye
  // paydayi gonderinin konu sayisiyla sinirliyoruz.
  return clamp01(hits / Math.min(a.length, 3));
}

/**
 * Ustel tazelik azalmasi. 0 saat -> 1.0, yariomur -> 0.5.
 * Gelecek tarihli gonderi uretilmez; negatif yas 1.0'a kirpilir.
 */
export function recencyScore(createdAt: Date, now: Date, halfLifeHours = DEFAULT_HALF_LIFE_HOURS): number {
  const ageHours = (now.getTime() - createdAt.getTime()) / 3_600_000;
  if (ageHours <= 0) return 1;
  return clamp01(Math.pow(0.5, ageHours / halfLifeHours));
}

export function computeSignals(post: Post, ctx: RankingContext): RankingSignals {
  const { viewer } = ctx;

  const topicMatch = overlapRatio(post.topicIds, viewer.topicIds);

  const followedSource = viewer.followingIds.includes(post.authorId) ? 1 : 0;

  const communityMatch = post.communityId && viewer.communityIds.includes(post.communityId) ? 1 : 0;

  // Mod secilmemisse niyet sinyali notrdur; agirligi kalici katman dagitir.
  const intentTypes = viewer.intentMode ? INTENT_POST_TYPES[viewer.intentMode] : null;
  const intentMatch =
    intentTypes && intentTypes.includes(post.type)
      ? // Listedeki sirasi onemli: ilk tur tam puan, sonrakiler kademeli.
        clamp01(1 - intentTypes.indexOf(post.type) * 0.15)
      : 0;

  const recency = recencyScore(new Date(post.createdAt), ctx.now, ctx.recencyHalfLifeHours);

  let locationMatch = 0;
  if (viewer.provinceCode && post.provinceCode === viewer.provinceCode) {
    locationMatch = viewer.districtCode && post.districtCode === viewer.districtCode ? 1 : 0.7;
  }

  // "Yeni sesler": az takipcili hesaplar tamamen gorunmez kalmasin (PROJECT_SPEC 12.2).
  // Bu bir kalite garantisi degildir; icerik konu/topluluk uygunlugunu yine saglamalidir.
  const followers = ctx.followerCounts[post.authorId] ?? 0;
  const isNewVoice = followers < NEW_VOICE_FOLLOWER_THRESHOLD;
  const isRelevant = topicMatch > 0 || communityMatch > 0;
  const explorationBonus = isNewVoice && isRelevant && followedSource === 0 ? 1 : 0;

  return { topicMatch, followedSource, communityMatch, intentMatch, recency, locationMatch, explorationBonus };
}

/**
 * Kalici platform amaclarinin sinyallere itmesi (PROJECT_SPEC 10.1.1).
 *
 * Her amac bir iki sinyale kucuk bir itme uygular. Degerler mutlak agirlik
 * degil, taban agirliga eklenen paydir; eklendikten sonra toplam yeniden
 * 1.0'a normalize edilir. Kucuk tutulmalarinin sebebi: hedefler akisi
 * yonlendirmeli, ele gecirmemeli. Bes hedef secen bir kullanicinin akisi
 * hicbir hedef secmeyeninkinden taninmaz olmamali.
 */
export const GOAL_SIGNAL_BIAS: Record<GoalKey, Partial<RankingSignals>> = {
  socialize: { followedSource: 0.06, recency: 0.03 },
  casual_discussion: { followedSource: 0.05, recency: 0.04 },
  find_communities: { communityMatch: 0.08 },
  discover_events: { recency: 0.04, locationMatch: 0.04 },
  discover_projects: { topicMatch: 0.05, explorationBonus: 0.03 },
  share_projects: { communityMatch: 0.05, explorationBonus: 0.03 },
  find_collaborators: { communityMatch: 0.05, explorationBonus: 0.04 },
  learn: { intentMatch: 0.06, topicMatch: 0.03 },
  find_resources: { intentMatch: 0.07 },
  follow_developments: { followedSource: 0.05, recency: 0.04 },
  discover_local_ecosystem: { locationMatch: 0.09 },
  find_institutions: { locationMatch: 0.05, communityMatch: 0.03 },
  discover_opportunities: { recency: 0.05, topicMatch: 0.03 },
  follow_creation_stories: { topicMatch: 0.04, explorationBonus: 0.04 },
  discover_people: { explorationBonus: 0.06, followedSource: 0.02 },
};

const SIGNAL_KEYS: (keyof RankingSignals)[] = [
  'topicMatch',
  'followedSource',
  'communityMatch',
  'intentMatch',
  'recency',
  'locationMatch',
  'explorationBonus',
];

/** Toplami 1.0'a getirir. Skorlarin modlar arasi karsilastirilabilirligi buna bagli. */
function normalize(weights: RankingSignals): RankingSignals {
  const total = SIGNAL_KEYS.reduce((sum, key) => sum + weights[key], 0);
  if (total <= 0) return { ...BASE_WEIGHTS };
  const out = {} as RankingSignals;
  for (const key of SIGNAL_KEYS) out[key] = weights[key] / total;
  return out;
}

/**
 * Kisisellestirmenin iki katmani (PROJECT_SPEC 7.10 / 17.18-10).
 *
 * 1. KALICI katman: profil hedefleri taban agirliklari egriltir. Hicbir hedef
 *    secilmemisse taban agirliklar oldugu gibi kalir.
 * 2. ANLIK katman: bir niyet modu secilmisse o modun dagilimina dogru
 *    harmanlanir. Mod hedefleri SILMEZ, uzerine gecici olarak biner - bu
 *    yuzden tam degistirme degil harmanlama.
 *
 * Mod secilmemisse (intentMode null) yalnizca kalici katman calisir; spec
 * kullanicinin hicbir mod secmeden de kisisellestirilmis akis gorebilmesini
 * sart kosuyor.
 */
export function weightsForViewer(
  goalKeys: readonly GoalKey[] = [],
  intentMode: IntentMode | null = null,
): RankingSignals {
  const persistent = { ...BASE_WEIGHTS };
  for (const goal of goalKeys) {
    const bias = GOAL_SIGNAL_BIAS[goal];
    if (!bias) continue;
    for (const key of SIGNAL_KEYS) persistent[key] += bias[key] ?? 0;
  }

  const base = normalize(persistent);
  if (!intentMode) return base;

  // Anlik niyet gecicidir: kalici katmani ezmek yerine ona dogru %65 harmanlanir.
  const intent = INTENT_WEIGHTS[intentMode] ?? BASE_WEIGHTS;
  const blended = {} as RankingSignals;
  for (const key of SIGNAL_KEYS) blended[key] = base[key] * 0.35 + intent[key] * 0.65;
  return normalize(blended);
}

/** Geriye donuk kisayol: yalnizca niyet modundan agirlik uretir. */
export function weightsFor(intentMode: IntentMode | null): RankingSignals {
  return intentMode ? INTENT_WEIGHTS[intentMode] ?? BASE_WEIGHTS : BASE_WEIGHTS;
}

export function scoreFromSignals(signals: RankingSignals, weights: RankingSignals): number {
  return (
    signals.topicMatch * weights.topicMatch +
    signals.followedSource * weights.followedSource +
    signals.communityMatch * weights.communityMatch +
    signals.intentMatch * weights.intentMatch +
    signals.recency * weights.recency +
    signals.locationMatch * weights.locationMatch +
    signals.explorationBonus * weights.explorationBonus
  );
}

/**
 * "Neden gosteriliyor?" aciklamasi (PROJECT_SPEC 12.3).
 * En yuksek agirlikli katkiyi yapan sinyali secer; hicbir sinyal yoksa null doner
 * (o zaman kart "onerilen" degil, dogal siralamada gelmis demektir).
 */
export function explainRanking(
  post: Post,
  signals: RankingSignals,
  weights: RankingSignals,
  ctx: RankingContext,
): RankingReason | null {
  // PROJECT_SPEC 12.3 aciklanabilir gerekce olarak yalnizca su sinyalleri sayar.
  // Tazelik ve niyet modu disarida: ikisi de bu icerige ozgu bir sey anlatmaz,
  // neredeyse her kartta gorunur ve aciklamayi gurultuye cevirirdi.
  const EXPLAINABLE: (keyof RankingSignals)[] = [
    'topicMatch',
    'followedSource',
    'communityMatch',
    'locationMatch',
    'explorationBonus',
  ];

  const contributions = EXPLAINABLE.map((key) => ({ key, value: signals[key] * weights[key] }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const top = contributions[0];
  if (!top) return null;

  switch (top.key) {
    case 'topicMatch': {
      const matched = post.topicIds.find((id) => ctx.viewer.topicIds.includes(id));
      const name = matched ? ctx.topicNames?.[matched] : undefined;
      return { key: top.key, label: name ? `${name} ile ilgilendiğin için` : 'İlgi alanlarınla eşleştiği için' };
    }
    case 'followedSource':
      return { key: top.key, label: 'Takip ettiğin bir hesap paylaştığı için' };
    case 'communityMatch':
      return { key: top.key, label: 'Katıldığın bir toplulukla ilişkili olduğu için' };
    case 'locationMatch': {
      const name = post.provinceCode ? ctx.provinceNames?.[post.provinceCode] : undefined;
      return {
        key: top.key,
        label: name ? `${name} içeriklerini keşfetmeyi seçtiğin için` : 'Seçtiğin konumla ilgili olduğu için',
      };
    }
    case 'explorationBonus':
      return { key: top.key, label: 'Yeni bir üreticiyi keşfetmen için' };
    default:
      return null;
  }
}

export function intentLabel(mode: IntentMode): string {
  switch (mode) {
    case 'sosyallesme':
      return 'Sosyalleş';
    case 'kesfet':
      return 'Keşfet';
    case 'ogren':
      return 'Öğren';
    case 'uret':
      return 'Üret';
  }
}

/**
 * Gonderileri sirala. Girdi yalnizca sosyal gonderilerdir; gazete icerigi
 * bilerek bu fonksiyona hic ulasmaz.
 */
export function rankPosts(posts: readonly Post[], ctx: RankingContext): RankedPost[] {
  // Iki katman birlikte: kalici amaclar tabani kurar, anlik mod uzerine biner.
  const weights = weightsForViewer(ctx.viewer.goalKeys, ctx.viewer.intentMode);

  return posts
    .map((post) => {
      const signals = computeSignals(post, ctx);
      return {
        post,
        score: scoreFromSignals(signals, weights),
        signals,
        reason: explainRanking(post, signals, weights, ctx),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Esitlikte daha yeni olan once gelsin, sonra id ile kararli sirala.
      const timeDiff = new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.post.id.localeCompare(b.post.id);
    });
}
