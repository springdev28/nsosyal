import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BASE_WEIGHTS,
  GOAL_SIGNAL_BIAS,
  INTENT_WEIGHTS,
  NEW_VOICE_FOLLOWER_THRESHOLD,
  computeSignals,
  explainRanking,
  rankPosts,
  recencyScore,
  scoreFromSignals,
  type RankingContext,
  weightsFor,
  weightsForViewer,
} from '@/lib/ranking/rank';
import type { GoalKey, IntentMode, Post } from '@/types/domain';

/**
 * Siralama motoru testleri (PROJECT_SPEC 12.1-12.3).
 *
 * En kritik test en altta: siralama modulunun sponsorlu icerikten haberdar
 * olmadigini dogrular. Bu bir stil tercihi degil, urunun temel vaadi.
 */

const NOW = new Date('2026-08-18T12:00:00+03:00');

const TOPIC_A = 'topic-a';
const TOPIC_B = 'topic-b';
const AUTHOR_FOLLOWED = 'author-followed';
const AUTHOR_STRANGER = 'author-stranger';
const AUTHOR_NEW_VOICE = 'author-new';
const COMMUNITY = 'community-1';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    authorId: AUTHOR_STRANGER,
    type: 'text',
    body: 'gövde',
    visibility: 'public',
    communityId: null,
    topicIds: [],
    provinceCode: null,
    districtCode: null,
    projectId: null,
    eventId: null,
    whyStoryId: null,
    resourceId: null,
    mediaIds: [],
    createdAt: NOW.toISOString(),
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    isShortVideo: false,
    videoKind: null,
    ...overrides,
  };
}

function makeContext(overrides: Partial<RankingContext> = {}): RankingContext {
  return {
    viewer: {
      id: 'viewer',
      topicIds: [TOPIC_A],
      followingIds: [AUTHOR_FOLLOWED],
      communityIds: [COMMUNITY],
      provinceCode: '35',
      districtCode: '35-07',
      goalKeys: [],
      intentMode: 'sosyallesme',
    },
    now: NOW,
    followerCounts: {
      [AUTHOR_FOLLOWED]: 900,
      [AUTHOR_STRANGER]: 900,
      [AUTHOR_NEW_VOICE]: 12,
    },
    topicNames: { [TOPIC_A]: 'Havacılık ve Uzay', [TOPIC_B]: 'Robotik' },
    provinceNames: { '35': 'İzmir' },
    ...overrides,
  };
}

describe('ağırlıklar', () => {
  it('temel ağırlıklar PROJECT_SPEC 12.1 ile birebir aynı', () => {
    expect(BASE_WEIGHTS).toEqual({
      topicMatch: 0.3,
      followedSource: 0.2,
      communityMatch: 0.15,
      intentMatch: 0.1,
      recency: 0.1,
      locationMatch: 0.1,
      explorationBonus: 0.05,
    });
  });

  it('her niyet modunda ağırlık toplamı 1.0 olur, böylece skorlar karşılaştırılabilir', () => {
    for (const [mode, weights] of Object.entries(INTENT_WEIGHTS)) {
      const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
      expect(total, `${mode} modunun toplamı`).toBeCloseTo(1, 5);
    }
  });

  it('bilinmeyen mod için temel ağırlıklara düşmez, tanımlı modu döndürür', () => {
    expect(weightsFor('kesfet')).toBe(INTENT_WEIGHTS.kesfet);
  });
});

/**
 * Kisisellestirme iki katmanlidir (PROJECT_SPEC 7.10 / 17.18-10): kalici
 * platform amaclari + anlik niyet modu. Tek bir intentMode alani butun
 * kisisellestirme modeli gibi kullanilamaz.
 */
describe('weightsForViewer - iki katmanli kişiselleştirme', () => {
  it('hiçbir amaç ve mod yokken temel ağırlıkları verir', () => {
    const weights = weightsForViewer([], null);
    for (const key of Object.keys(BASE_WEIGHTS) as (keyof typeof BASE_WEIGHTS)[]) {
      expect(weights[key]).toBeCloseTo(BASE_WEIGHTS[key], 5);
    }
  });

  it('her amaç ve mod bileşiminde toplam 1.0 kalır', () => {
    const combos: Array<[GoalKey[], IntentMode | null]> = [
      [[], null],
      [['discover_local_ecosystem'], null],
      [['learn', 'find_resources'], null],
      [['socialize', 'find_communities', 'discover_events'], 'kesfet'],
      [Object.keys(GOAL_SIGNAL_BIAS) as GoalKey[], 'uret'],
    ];
    for (const [goals, intent] of combos) {
      const total = Object.values(weightsForViewer(goals, intent)).reduce((sum, v) => sum + v, 0);
      expect(total, `${goals.length} amaç / ${intent ?? 'mod yok'}`).toBeCloseTo(1, 5);
    }
  });

  it('yerel ekosistem amacı konum ağırlığını yükseltir', () => {
    const base = weightsForViewer([], null);
    const local = weightsForViewer(['discover_local_ecosystem'], null);
    expect(local.locationMatch).toBeGreaterThan(base.locationMatch);
  });

  it('kaynak bulma amacı öğrenme sinyalini yükseltir', () => {
    const base = weightsForViewer([], null);
    const learner = weightsForViewer(['find_resources', 'learn'], null);
    expect(learner.intentMatch).toBeGreaterThan(base.intentMatch);
  });

  it('anlık mod kalıcı amaçları silmez, üzerine geçici olarak biner', () => {
    // Ayni mod, farkli kalici amaclar -> farkli agirlik. Mod hedefleri ezseydi
    // ikisi ayni cikardi ve kalici katman anlamsizlasirdi.
    const socialOnly = weightsForViewer(['socialize'], 'kesfet');
    const localOnly = weightsForViewer(['discover_local_ecosystem'], 'kesfet');
    expect(localOnly.locationMatch).toBeGreaterThan(socialOnly.locationMatch);
  });

  it('mod seçilmemiş olması kişiselleştirmeyi kapatmaz', () => {
    const withGoals = weightsForViewer(['discover_local_ecosystem'], null);
    const flat = weightsForViewer([], null);
    expect(withGoals.locationMatch).not.toBeCloseTo(flat.locationMatch, 5);
  });
});

describe('recencyScore', () => {
  it('şu an paylaşılan içerik 1.0 alır', () => {
    expect(recencyScore(NOW, NOW)).toBe(1);
  });

  it('yarı ömür sonunda 0.5 olur', () => {
    const older = new Date(NOW.getTime() - 36 * 3_600_000);
    expect(recencyScore(older, NOW, 36)).toBeCloseTo(0.5, 5);
  });

  it('çok eski içerik sıfıra yaklaşır ama negatif olmaz', () => {
    const ancient = new Date(NOW.getTime() - 365 * 86_400_000);
    const score = recencyScore(ancient, NOW);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(0.01);
  });

  it('saat farkından doğan gelecek tarihli kayıtlarda 1.0 ile sınırlanır', () => {
    const future = new Date(NOW.getTime() + 3_600_000);
    expect(recencyScore(future, NOW)).toBe(1);
  });
});

describe('computeSignals', () => {
  it('ilgi alanı eşleşmesini yakalar', () => {
    const signals = computeSignals(makePost({ topicIds: [TOPIC_A] }), makeContext());
    expect(signals.topicMatch).toBeGreaterThan(0);
  });

  it('ilgisiz konu için topicMatch sıfırdır', () => {
    const signals = computeSignals(makePost({ topicIds: [TOPIC_B] }), makeContext());
    expect(signals.topicMatch).toBe(0);
  });

  it('takip edilen yazarı işaretler', () => {
    const signals = computeSignals(makePost({ authorId: AUTHOR_FOLLOWED }), makeContext());
    expect(signals.followedSource).toBe(1);
  });

  it('üye olunan topluluğu işaretler', () => {
    const signals = computeSignals(makePost({ communityId: COMMUNITY }), makeContext());
    expect(signals.communityMatch).toBe(1);
  });

  it('ilçe eşleşmesi il eşleşmesinden daha güçlüdür', () => {
    const province = computeSignals(makePost({ provinceCode: '35' }), makeContext());
    const district = computeSignals(makePost({ provinceCode: '35', districtCode: '35-07' }), makeContext());
    expect(district.locationMatch).toBeGreaterThan(province.locationMatch);
  });

  it('konum paylaşmayan kullanıcı için locationMatch her zaman sıfırdır', () => {
    const context = makeContext();
    context.viewer.provinceCode = null;
    context.viewer.districtCode = null;
    const signals = computeSignals(makePost({ provinceCode: '35' }), context);
    expect(signals.locationMatch).toBe(0);
  });

  it('yeni sesler bonusu az takipçili ve konuyla ilgili içeriğe verilir', () => {
    const signals = computeSignals(
      makePost({ authorId: AUTHOR_NEW_VOICE, topicIds: [TOPIC_A] }),
      makeContext(),
    );
    expect(signals.explorationBonus).toBe(1);
  });

  it('yeni sesler bonusu alakasız içeriğe verilmez: bonus kalite garantisi değildir', () => {
    const signals = computeSignals(
      makePost({ authorId: AUTHOR_NEW_VOICE, topicIds: [TOPIC_B] }),
      makeContext(),
    );
    expect(signals.explorationBonus).toBe(0);
  });

  it('eşiğin üstündeki hesap yeni ses sayılmaz', () => {
    const context = makeContext();
    context.followerCounts[AUTHOR_NEW_VOICE] = NEW_VOICE_FOLLOWER_THRESHOLD + 1;
    const signals = computeSignals(
      makePost({ authorId: AUTHOR_NEW_VOICE, topicIds: [TOPIC_A] }),
      context,
    );
    expect(signals.explorationBonus).toBe(0);
  });
});

describe('niyet modu sıralamayı değiştirir', () => {
  const resourcePost = makePost({ id: 'resource', type: 'resource_suggestion', topicIds: [TOPIC_A] });
  const projectPost = makePost({ id: 'project', type: 'project_update', topicIds: [TOPIC_A] });

  it('Öğren modunda kaynak önerisi proje güncellemesinin önüne geçer', () => {
    const context = makeContext();
    context.viewer.intentMode = 'ogren';
    const ranked = rankPosts([projectPost, resourcePost], context);
    expect(ranked[0].post.id).toBe('resource');
  });

  it('Üret modunda proje güncellemesi kaynak önerisinin önüne geçer', () => {
    const context = makeContext();
    context.viewer.intentMode = 'uret';
    const ranked = rankPosts([projectPost, resourcePost], context);
    expect(ranked[0].post.id).toBe('project');
  });
});

describe('rankPosts', () => {
  it('skoru yüksek olan önce gelir', () => {
    const relevant = makePost({ id: 'relevant', topicIds: [TOPIC_A], authorId: AUTHOR_FOLLOWED });
    const irrelevant = makePost({ id: 'irrelevant', topicIds: [TOPIC_B] });
    const ranked = rankPosts([irrelevant, relevant], makeContext());
    expect(ranked.map((entry) => entry.post.id)).toEqual(['relevant', 'irrelevant']);
  });

  it('eşit skorda daha yeni gönderi öne gelir ve sıralama kararlıdır', () => {
    const older = makePost({ id: 'a', createdAt: new Date(NOW.getTime() - 7_200_000).toISOString() });
    const newer = makePost({ id: 'b', createdAt: new Date(NOW.getTime() - 3_600_000).toISOString() });
    const first = rankPosts([older, newer], makeContext()).map((entry) => entry.post.id);
    const second = rankPosts([newer, older], makeContext()).map((entry) => entry.post.id);
    expect(first).toEqual(['b', 'a']);
    expect(second).toEqual(first);
  });

  it('girdiyi değiştirmez', () => {
    const posts = [makePost({ id: 'a' }), makePost({ id: 'b' })];
    const snapshot = posts.map((post) => post.id);
    rankPosts(posts, makeContext());
    expect(posts.map((post) => post.id)).toEqual(snapshot);
  });

  it('boş girdi için boş sonuç döner', () => {
    expect(rankPosts([], makeContext())).toEqual([]);
  });
});

describe('explainRanking - "Neden gösteriliyor?"', () => {
  it('konu eşleşmesinde konu adını kullanır', () => {
    const post = makePost({ topicIds: [TOPIC_A] });
    const context = makeContext();
    const signals = computeSignals(post, context);
    const reason = explainRanking(post, signals, weightsFor('sosyallesme'), context);
    expect(reason?.key).toBe('topicMatch');
    expect(reason?.label).toContain('Havacılık ve Uzay');
  });

  it('konum eşleşmesinde il adını kullanır', () => {
    const post = makePost({ provinceCode: '35' });
    const context = makeContext();
    context.viewer.topicIds = [];
    context.viewer.followingIds = [];
    context.viewer.communityIds = [];
    const signals = computeSignals(post, context);
    const reason = explainRanking(post, signals, weightsFor('kesfet'), context);
    expect(reason?.key).toBe('locationMatch');
    expect(reason?.label).toContain('İzmir');
  });

  it('yeni ses bonusunda keşif gerekçesi verir', () => {
    const post = makePost({ authorId: AUTHOR_NEW_VOICE, topicIds: [TOPIC_A] });
    const context = makeContext();
    // Konu eşleşmesini bastırıp bonusun tek başına gerekçe olabildiğini görelim.
    context.viewer.topicIds = [];
    context.viewer.communityIds = [];
    const signals = { ...computeSignals(post, context), explorationBonus: 1 };
    const reason = explainRanking(post, signals, weightsFor('kesfet'), context);
    expect(reason?.key).toBe('explorationBonus');
    expect(reason?.label).toBe('Yeni bir üreticiyi keşfetmen için');
  });

  it('hiçbir sinyal yoksa gerekçe üretmez: "önerilen" demediğimiz kartta açıklama olmaz', () => {
    const post = makePost({ topicIds: [TOPIC_B] });
    const context = makeContext();
    context.viewer.topicIds = [];
    context.viewer.followingIds = [];
    context.viewer.communityIds = [];
    context.viewer.provinceCode = null;
    context.viewer.districtCode = null;
    context.viewer.intentMode = 'uret';
    const signals = computeSignals(post, context);
    expect(explainRanking(post, signals, weightsFor('uret'), context)).toBeNull();
  });

  it('niyet modu tek başına gerekçe olarak gösterilmez: her kartta çıkar, bir şey anlatmaz', () => {
    const post = makePost({ type: 'project_update' });
    const context = makeContext();
    context.viewer.topicIds = [];
    context.viewer.followingIds = [];
    context.viewer.communityIds = [];
    context.viewer.provinceCode = null;
    context.viewer.districtCode = null;
    context.viewer.intentMode = 'uret';
    const signals = computeSignals(post, context);
    expect(signals.intentMatch).toBeGreaterThan(0);
    expect(explainRanking(post, signals, weightsFor('uret'), context)).toBeNull();
  });

  it('tazelik tek başına gerekçe olarak gösterilmez', () => {
    const post = makePost({ topicIds: [TOPIC_A] });
    const context = makeContext();
    const signals = computeSignals(post, context);
    const reason = explainRanking(post, signals, weightsFor('sosyallesme'), context);
    expect(reason?.key).not.toBe('recency');
  });
});

describe('scoreFromSignals', () => {
  it('tüm sinyaller tavan değerdeyken skor 1.0 olur', () => {
    const full = {
      topicMatch: 1,
      followedSource: 1,
      communityMatch: 1,
      intentMatch: 1,
      recency: 1,
      locationMatch: 1,
      explorationBonus: 1,
    };
    expect(scoreFromSignals(full, BASE_WEIGHTS)).toBeCloseTo(1, 5);
  });
});

/**
 * PROJECT_SPEC 1.1 madde 6 ve 12.1: ücretli görünürlük kişisel akış
 * sıralamasını DEĞİŞTİREMEZ. Bunu davranışla test etmek mümkün değil, çünkü
 * doğru davranış "böyle bir kavramın hiç olmaması". Bu yüzden modülün
 * kaynağını denetliyoruz.
 */
describe('sıralama motoru ücretli içerikten habersizdir', () => {
  const source = readFileSync(join(process.cwd(), 'src/lib/ranking/rank.ts'), 'utf8');

  it('newspaper veya reklam modüllerinden import yapmaz', () => {
    const imports = source.match(/from\s+'[^']+'/g) ?? [];
    for (const line of imports) {
      expect(line).not.toMatch(/newspaper|advert|sponsor|billing|payment/i);
    }
  });

  it('kodda sponsorlu boost alanı bulunmaz', () => {
    // Yorumlarda kuralı anlatmak serbest; kodda alan/degisken olmasi degil.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/sponsor/i);
    expect(code).not.toMatch(/\bboost\b/i);
    expect(code).not.toMatch(/\bpromoted\b/i);
  });

  it('RankingSignals yalnızca kullanıcıya açıklanabilir sinyalleri içerir', () => {
    const signals = computeSignals(makePost(), makeContext());
    expect(Object.keys(signals).sort()).toEqual(
      [
        'communityMatch',
        'explorationBonus',
        'followedSource',
        'intentMatch',
        'locationMatch',
        'recency',
        'topicMatch',
      ].sort(),
    );
  });
});
