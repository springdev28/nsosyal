/**
 * nGazete reklam envanteri ve fiyat modeli (PROJECT_SPEC 7.9, 10.1.1, 17.18/9).
 *
 * Spec'in kurali su: ucretli alan "ilan turu" secmek degil, gazetenin gercek
 * grid'inde belirli bir ALAN satin almaktir. Bu yuzden fiyat ilan turunden
 * degil, satin alinan alanin buyuklugunden, sayfadaki yerlesiminden, yayin
 * sayisindan, talep duzeyinden ve varsa abonelik indiriminden turer:
 *
 *   fiyat = taban x alan_katsayisi x yerlesim_katsayisi x yayin_sayisi
 *           x talep_katsayisi x abonelik_indirimi
 *
 * Gercek odeme P2 kapsaminda (spec 5.3); prototipin isi hesabi ACIKLANABILIR
 * bicimde gostermek. Bu yuzden her basvuruda ve her yerlestirilen kartta
 * fiyatin o andaki anlik goruntusu (snapshot) saklanir: katsayilar sonradan
 * degisse bile verilen teklif degismez.
 *
 * Piksel olculeri responsive duzende tek basina yeterli degildir; her yerlesim
 * ayrica grid span tasir (spec 7.9).
 */

/** Yerlesim gorunurluk bolgesi. Kapaga yaklastikca katsayi buyur. */
export type PlacementZone = 'kapak' | 'ust' | 'bolum' | 'alt';

export interface AdPlacement {
  code: string;
  label: string;
  widthPx: number;
  heightPx: number;
  /** Gazete grid'i 4 kolon; responsive'de span daralir. */
  gridColumnSpan: number;
  gridRowSpan: number;
  zone: PlacementZone;
}

/**
 * Ornek envanter. Spec bu olculeri ornek olarak veriyor (300x250, 728x90,
 * 300x600, 600x400, 970x250); urun bunlari degistirebilir.
 */
export const AD_PLACEMENTS: readonly AdPlacement[] = [
  {
    code: 'kapak-970x250',
    label: 'Kapak bandı (970×250)',
    widthPx: 970,
    heightPx: 250,
    gridColumnSpan: 4,
    gridRowSpan: 1,
    zone: 'kapak',
  },
  {
    code: 'ust-728x90',
    label: 'Üst bant (728×90)',
    widthPx: 728,
    heightPx: 90,
    gridColumnSpan: 4,
    gridRowSpan: 1,
    zone: 'ust',
  },
  {
    code: 'bolum-600x400',
    label: 'Bölüm içi geniş (600×400)',
    widthPx: 600,
    heightPx: 400,
    gridColumnSpan: 2,
    gridRowSpan: 1,
    zone: 'bolum',
  },
  {
    code: 'bolum-300x250',
    label: 'Bölüm içi kutu (300×250)',
    widthPx: 300,
    heightPx: 250,
    gridColumnSpan: 1,
    gridRowSpan: 1,
    zone: 'bolum',
  },
  {
    code: 'alt-300x600',
    label: 'Kenar sütunu (300×600)',
    widthPx: 300,
    heightPx: 600,
    gridColumnSpan: 1,
    gridRowSpan: 2,
    zone: 'alt',
  },
] as const;

export function placementByCode(code: string | null | undefined): AdPlacement | null {
  if (!code) return null;
  return AD_PLACEMENTS.find((entry) => entry.code === code) ?? null;
}

/** Abonelik paketleri. Abonelik "sinirsiz alan" degil, tanimli siklik hakkidir. */
export type SubscriptionPlan = 'tek-sayi' | 'dort-sayi' | 'aylik' | 'haftalik' | 'kurumsal';

export interface SubscriptionOption {
  plan: SubscriptionPlan;
  label: string;
  /** Pakete dahil yayin adedi. */
  issueCount: number;
  /** Indirim carpani: 1.0 indirim yok. */
  discount: number;
  note: string;
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionOption[] = [
  { plan: 'tek-sayi', label: 'Tek sayı', issueCount: 1, discount: 1, note: 'Tek bir sayıda yayın.' },
  {
    plan: 'dort-sayi',
    label: 'Dört sayı',
    issueCount: 4,
    discount: 0.92,
    note: 'Ardışık dört sayı.',
  },
  {
    plan: 'aylik',
    label: 'Aylık düzenli',
    issueCount: 12,
    discount: 0.85,
    note: 'Ayda on iki sayıda tanımlı alan.',
  },
  {
    plan: 'haftalik',
    label: 'Haftalık düzenli',
    issueCount: 4,
    discount: 0.88,
    note: 'Haftada bir sayıda tanımlı alan.',
  },
  {
    plan: 'kurumsal',
    label: 'Kurum aboneliği',
    issueCount: 24,
    discount: 0.78,
    note: 'Tanımlı boyut, yerleşim ve sıklık hakkı; sınırsız alan değildir.',
  },
] as const;

export function subscriptionByPlan(plan: string | null | undefined): SubscriptionOption | null {
  if (!plan) return null;
  return SUBSCRIPTION_PLANS.find((entry) => entry.plan === plan) ?? null;
}

/** Taban fiyat (TL). Prototip baslangic degeri, urun gercegi iddiasi degil. */
export const BASE_PRICE = 1_200;

/** Alan katsayisinin referansi: 300x250 kutu = 1.0. */
const REFERENCE_AREA = 300 * 250;

const ZONE_FACTOR: Record<PlacementZone, number> = {
  kapak: 1.8,
  ust: 1.4,
  bolum: 1.0,
  alt: 0.8,
};

export interface PriceInput {
  placementCode: string;
  issueCount: number;
  subscriptionPlan: SubscriptionPlan;
  /** Talep katsayisi; prototipte sabit 1.0, urunde doluluk oranindan gelir. */
  demandFactor?: number;
}

export interface PriceBreakdown {
  basePrice: number;
  areaFactor: number;
  placementFactor: number;
  issueCount: number;
  demandFactor: number;
  subscriptionDiscount: number;
  total: number;
}

/**
 * Fiyati bilesenleriyle birlikte dondurur.
 *
 * Bilesenleri ayri dondurmemizin sebebi arayuz: hem reklamveren hem admin
 * "neden bu fiyat?" sorusunu tek bakista cevaplayabilmeli. Tek bir sayi
 * dondurseydik hesap yine kapali kutu olurdu.
 */
export function priceFor(input: PriceInput): PriceBreakdown | null {
  const placement = placementByCode(input.placementCode);
  if (!placement) return null;

  const areaFactor = round2((placement.widthPx * placement.heightPx) / REFERENCE_AREA);
  const placementFactor = ZONE_FACTOR[placement.zone];
  const subscription = subscriptionByPlan(input.subscriptionPlan);
  const subscriptionDiscount = subscription?.discount ?? 1;
  const demandFactor = input.demandFactor ?? 1;
  const issueCount = Math.max(1, Math.round(input.issueCount));

  const total = Math.round(
    BASE_PRICE * areaFactor * placementFactor * issueCount * demandFactor * subscriptionDiscount,
  );

  return {
    basePrice: BASE_PRICE,
    areaFactor,
    placementFactor,
    issueCount,
    demandFactor,
    subscriptionDiscount,
    total,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString('tr-TR')} TL`;
}
