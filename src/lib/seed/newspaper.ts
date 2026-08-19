import type { AdRequest, NewspaperIssue, NewspaperItem } from '@/types/domain';
import {
  placementByCode,
  priceFor,
  type SubscriptionPlan,
} from '@/lib/newspaper/inventory';
import { communityId } from './communities';
import { eventId } from './events';
import { uid } from './ids';
import { profileId } from './profiles';
import { projectId } from './projects';
import { toIstanbulDateKey } from '@/lib/time';
import { whyStoryId } from './why';

/**
 * nGazete seed verisi (PROJECT_SPEC 7.9).
 *
 * Iki isi ayni anda yapar:
 * 1) Kullanici icin gunluk acilmaya deger editoryal bir ozet.
 * 2) Platform icin, kisisel akis siralamasina hic dokunmayan ayri bir ticari envanter.
 *
 * Bu yuzden `sponsored: true` olan her kart arayuzde zorunlu "Sponsorlu" etiketi
 * tasir ve gazete disinda hicbir siralamaya girmez.
 */

export const issueId = (date: string) => uid('issue', date);
export const itemId = (key: string) => uid('newspaper-item', key);

/**
 * Sayi tarihleri Europe/Istanbul gunune gore uretilir.
 *
 * Sunucunun yerel saat dilimine gore uretmek, UTC'de calisan bir sunucuda
 * aksam 21:00'den sonra "bugunun sayisi"nin kaybolmasina yol aciyordu: uygulama
 * Istanbul gunune bakarken seed sunucu gunune bakiyordu.
 */
const toIsoDate = (date: Date) => toIstanbulDateKey(date);

interface ItemInput {
  key: string;
  itemType: NewspaperItem['itemType'];
  section: NewspaperItem['section'];
  layout: NewspaperItem['layoutVariant'];
  /** 1 en yuksek; manset ve bolum sirasi bundan cikar. */
  priority: number;
  title: string;
  standfirst?: string;
  body: string;
  /** Gorsel tasiyan kartlarda zorunlu: sentetik dokunun tohumu + alt metin. */
  glyph?: string;
  imageAlt?: string;
  sourceOrAuthor?: string;
  targetUrl?: string;
  linkedEntityType: NewspaperItem['linkedEntityType'];
  linkedKey: string | null;
  sponsored?: boolean;
  sponsorName?: string;
  /** Ucretli alanlarda satin alinan envanter kodu (bkz. lib/newspaper/inventory). */
  placementCode?: string;
  issueCount?: number;
  subscriptionPlan?: SubscriptionPlan;
}

/**
 * Editoryal kartlarin grid'de kapladigi alan. Ucretli alanlarda span envanter
 * kaydindan gelir, buradan degil.
 */
const LAYOUT_SPAN: Record<NewspaperItem['layoutVariant'], { col: number; row: number }> = {
  lead: { col: 4, row: 2 },
  feature: { col: 2, row: 1 },
  standard: { col: 2, row: 1 },
  brief: { col: 1, row: 1 },
  placement: { col: 1, row: 1 },
};

function resolveLinkedId(input: ItemInput): string | null {
  if (!input.linkedKey) return null;
  switch (input.linkedEntityType) {
    case 'event':
      return eventId(input.linkedKey);
    case 'project':
      return projectId(input.linkedKey);
    case 'community':
      return communityId(input.linkedKey);
    case 'why_story':
      return whyStoryId(input.linkedKey);
    case 'profile':
      return profileId(input.linkedKey);
    default:
      return null;
  }
}

/** Bugunun sayisi - ilk oturumda otomatik acilan sayi budur. */
const TODAY_ITEMS: ItemInput[] = [
  {
    key: 'today-lead',
    itemType: 'lead',
    section: 'gundem',
    layout: 'lead',
    priority: 1,
    standfirst: 'Rüzgâr ölçer, itki test standı ve sera sensör ağı: üçünün de ham verisi açık.',
    glyph: '📈',
    imageAlt: 'Ölçüm grafiği desenli kapak görseli',
    sourceOrAuthor: 'nGazete editoryal',
    title: 'Ölçmediğimiz şeyi tartışıyoruz: veri toplayan üç öğrenci projesi',
    body: 'Bu haftanın üç projesi de aynı cümleden çıkmış: elimizde sayı yoktu. Rüzgâr ölçer, itki test standı ve sera sensör ağı, veri boşluğunu kendi imkânlarıyla kapatmaya çalışan ekiplerin işi. Üçünün de ham verisi açık.',
    linkedEntityType: 'project',
    linkedKey: 'ruzgar-olcer',
  },
  {
    key: 'today-editorial-1',
    itemType: 'editorial',
    section: 'gundem',
    layout: 'feature',
    priority: 2,
    glyph: '🧪',
    imageAlt: 'Laboratuvar defteri desenli görsel',
    sourceOrAuthor: 'Açık Laboratuvar Günlüğü',
    title: 'Başarısız deney neden kaydedilmeli?',
    body: 'Açık Laboratuvar Günlüğü’nde en çok kullanılan filtrenin "başarısız" etiketi olması tesadüf değil. Yayımlanmayan olumsuz sonuçlar, aynı hatanın farklı laboratuvarlarda tekrarlanmasına yol açıyor.',
    linkedEntityType: 'why_story',
    linkedKey: 'basarisiz-deney-arsivi',
  },
  {
    key: 'today-editorial-2',
    itemType: 'editorial',
    section: 'proje',
    layout: 'standard',
    priority: 3,
    glyph: '♿',
    imageAlt: 'Erişilebilirlik simgesi desenli görsel',
    sourceOrAuthor: 'nGazete editoryal',
    title: 'Erişilebilirlik sonradan eklenmiyor',
    body: 'Bir game jam sonrası yaşanan küçük bir an, bir projenin tamamını değiştirdi. Erişilebilir menü kitinin ilk dış testinde dört kullanıcıdan üçü menüyü yardımsız tamamladı.',
    linkedEntityType: 'project',
    linkedKey: 'erisilebilir-oyun-menusu',
  },
  {
    key: 'today-local',
    itemType: 'local',
    section: 'yerel',
    layout: 'standard',
    priority: 4,
    sourceOrAuthor: 'Yerel seçki',
    title: 'İzmir’de bu ay: roket atölyesi, saha uçuşu ve çatı GES gezisi',
    body: 'Konum bilgisi paylaşan kullanıcılar için yerel seçki. Üç etkinliğin ikisi ücretsiz ve kayıt gerektirmiyor.',
    linkedEntityType: 'event',
    linkedKey: 'izmir-model-roket-atolyesi',
  },
  {
    key: 'today-showcase',
    itemType: 'project_showcase',
    section: 'proje',
    layout: 'feature',
    priority: 5,
    glyph: '📝',
    imageAlt: 'Metin özetleme desenli görsel',
    sourceOrAuthor: 'Proje vitrini',
    title: 'Proje vitrini: Türkçe Özetleme Değerlendirme Seti',
    body: 'Editoryal seçki. Model iyileştirmeden önce ölçütü düzeltmeyi seçen bir çalışma; v1’de 1.400 metin ve 4.200 insan özeti var.',
    linkedEntityType: 'project',
    linkedKey: 'turkce-ozetleme-seti',
  },
  {
    key: 'today-ad-event',
    itemType: 'event_ad',
    section: 'etkinlik',
    layout: 'placement',
    priority: 6,
    placementCode: 'bolum-600x400',
    issueCount: 4,
    subscriptionPlan: 'dort-sayi',
    glyph: '🚀',
    imageAlt: 'Ege Teknopark Demo Günü tanıtım görseli',
    title: 'Ege Teknopark Demo Günü başvuruları açık',
    body: 'Erken aşama takımlar için 5 dakikalık demo sunumu ve doğrudan geri bildirim. Başvurular sınırlı kontenjanla alınıyor.',
    linkedEntityType: 'event',
    linkedKey: 'ege-teknopark-demo-gunu',
    sponsored: true,
    sponsorName: 'Ege Teknopark (Demo)',
  },
  {
    key: 'today-ad-org',
    itemType: 'org_ad',
    section: 'topluluk',
    layout: 'placement',
    priority: 7,
    placementCode: 'bolum-300x250',
    issueCount: 1,
    subscriptionPlan: 'tek-sayi',
    glyph: '🧬',
    imageAlt: 'BiyoLab laboratuvar günü tanıtım görseli',
    title: 'BiyoLab: lise grupları için laboratuvar günü',
    body: 'Okul grupları için rehberli laboratuvar turu ve temel ekipman eğitimi. Öğretmen eşliğinde grup başvurusu alınıyor.',
    linkedEntityType: 'profile',
    linkedKey: 'biyolab.demo',
    sponsored: true,
    sponsorName: 'BiyoLab Girişim (Demo)',
  },
];

/** Dunun sayisi - "onceki sayilar" listesi icin. */
const YESTERDAY_ITEMS: ItemInput[] = [
  {
    key: 'yesterday-lead',
    itemType: 'lead',
    section: 'gundem',
    layout: 'lead',
    priority: 1,
    standfirst: 'GPS sinyalinin kaybolduğu kırk saniye, bir ekibi kamera tabanlı iniş yardımcısına götürdü.',
    glyph: '🛬',
    imageAlt: 'Test uçuşu desenli kapak görseli',
    sourceOrAuthor: 'nGazete editoryal',
    title: 'Kırk saniye: bir test uçuşunun geri kalanını belirleyen an',
    body: 'GPS sinyalinin kaybolduğu kırk saniye, bir öğrenci ekibini kamera tabanlı iniş yardımcısı geliştirmeye yöneltti. Saha testi bu hafta.',
    linkedEntityType: 'why_story',
    linkedKey: 'kirk-saniye',
  },
  {
    key: 'yesterday-editorial-1',
    itemType: 'editorial',
    section: 'proje',
    layout: 'feature',
    priority: 2,
    glyph: '🌧️',
    imageAlt: 'Yağmur senaryosu simülasyonu deseni',
    sourceOrAuthor: 'nGazete editoryal',
    title: 'Simülasyon gerçeğe benzemezse ne olur?',
    body: 'Yağmur ve gece senaryoları eklendiğinde model başarımının %22 düşmesi kötü bir haber değil. Kötü haber, bunu yarışma pistinde öğrenmek olurdu.',
    linkedEntityType: 'project',
    linkedKey: 'otonom-simulasyon',
  },
  {
    key: 'yesterday-local',
    itemType: 'local',
    section: 'topluluk',
    layout: 'brief',
    priority: 3,
    sourceOrAuthor: 'Topluluklardan',
    title: 'Topluluklardan: CTF başlangıç kampı moderatör doğrulaması aldı',
    body: 'On iki modülün tamamı izinli platformlarda çalışacak biçimde yeniden kontrol edildi.',
    linkedEntityType: 'community',
    linkedKey: 'ctf-baslangic',
  },
  {
    key: 'yesterday-ad-org',
    itemType: 'org_ad',
    section: 'topluluk',
    layout: 'placement',
    priority: 2,
    placementCode: 'ust-728x90',
    issueCount: 1,
    subscriptionPlan: 'tek-sayi',
    title: 'Kod Kültür Derneği açık kaynak katkı günü',
    body: 'İlk pull request’ini açmak isteyenler için rehberli katkı günü. Deneyim aranmıyor.',
    linkedEntityType: 'profile',
    linkedKey: 'kodkultur.demo',
    sponsored: true,
    sponsorName: 'Kod Kültür Derneği (Demo)',
  },
];

/** Tematik sayi - abonelik ve tema mantigini gosterir. */
const THEME_ITEMS: ItemInput[] = [
  {
    key: 'theme-lead',
    itemType: 'lead',
    section: 'gundem',
    layout: 'lead',
    priority: 1,
    standfirst: 'Model roketten amatör astronomiye, gökyüzüyle uğraşan toplulukların bu ayki üretimleri.',
    glyph: '🌌',
    imageAlt: 'Gece gökyüzü desenli kapak görseli',
    sourceOrAuthor: 'nGazete editoryal',
    title: 'Uzay özel sayısı: gökyüzüne bakan topluluklar',
    body: 'Model roketten amatör astronomiye, gökyüzüyle uğraşan toplulukların bu ayki üretimleri.',
    linkedEntityType: 'community',
    linkedKey: 'gece-gokyuzu',
  },
  {
    key: 'theme-editorial',
    itemType: 'editorial',
    section: 'gundem',
    layout: 'feature',
    priority: 2,
    glyph: '🔭',
    imageAlt: 'Teleskop desenli görsel',
    sourceOrAuthor: 'Neden panosundan',
    title: 'Bir kasabada büyümek ve gökyüzünü kaybetmek',
    body: 'Şehre taşındıktan sonra gökyüzünü kaybetme hissi, bir astrofizik öğrencisini gözlem geceleri düzenlemeye götürdü.',
    linkedEntityType: 'why_story',
    linkedKey: 'gokyuzu-kasabasi',
  },
  {
    key: 'theme-showcase',
    itemType: 'project_showcase',
    section: 'proje',
    layout: 'standard',
    priority: 3,
    glyph: '🚀',
    imageAlt: 'İtki test standı deseni',
    sourceOrAuthor: 'Proje vitrini',
    title: 'Proje vitrini: Model Roket İtki Test Standı',
    body: 'Katalog değerine güvenmeyi bırakan bir öğrenci takımının taşınabilir ölçüm standı.',
    linkedEntityType: 'project',
    linkedKey: 'model-roket-itki',
  },
  {
    key: 'theme-ad-event',
    itemType: 'event_ad',
    section: 'etkinlik',
    layout: 'placement',
    priority: 2,
    placementCode: 'kapak-970x250',
    issueCount: 12,
    subscriptionPlan: 'aylik',
    glyph: '📡',
    imageAlt: 'Anadolu Uzay Kulübü uçuş raporu arşivi görseli',
    title: 'Anadolu Uzay Kulübü: uçuş raporu arşivi açıldı',
    body: '40 uçuş raporu öğrenci takımlarının kullanımına açıldı. Atıf yeterli, ücret yok.',
    linkedEntityType: 'profile',
    linkedKey: 'anadoluuzay.demo',
    sponsored: true,
    sponsorName: 'Anadolu Uzay Kulübü (Demo)',
  },
];

export function buildNewspaper(now: Date): { issues: NewspaperIssue[]; items: NewspaperItem[] } {
  const today = new Date(now);
  const yesterday = new Date(now.getTime() - 86_400_000);
  const themeDay = new Date(now.getTime() - 6 * 86_400_000);

  const issues: NewspaperIssue[] = [
    {
      id: issueId(toIsoDate(today)),
      issueDate: toIsoDate(today),
      title: 'nGazete · Günün Özeti',
      standfirst: 'Bugün topluluklarda ölçüm, erişilebilirlik ve yerel etkinlikler konuşuldu.',
      coverEmoji: '📰',
      theme: null,
      publishAt: new Date(today.setHours(7, 0, 0, 0)).toISOString(),
      status: 'published',
    },
    {
      id: issueId(toIsoDate(yesterday)),
      issueDate: toIsoDate(yesterday),
      title: 'nGazete · Günün Özeti',
      standfirst: 'Bir test uçuşundan çıkan proje ve simülasyonun gerçekle sınavı.',
      coverEmoji: '🗞️',
      theme: null,
      publishAt: new Date(yesterday.setHours(7, 0, 0, 0)).toISOString(),
      status: 'published',
    },
    {
      id: issueId(toIsoDate(themeDay)),
      issueDate: toIsoDate(themeDay),
      title: 'nGazete · Uzay Özel Sayısı',
      standfirst: 'Gökyüzüne bakan topluluklar, projeler ve hikâyeler.',
      coverEmoji: '🌌',
      theme: 'Uzay',
      publishAt: new Date(themeDay.setHours(7, 0, 0, 0)).toISOString(),
      status: 'published',
    },
  ];

  const buildItems = (issue: NewspaperIssue, inputs: ItemInput[]): NewspaperItem[] =>
    inputs.map((input, index) => {
      const placement = placementByCode(input.placementCode);
      const span = placement
        ? { col: placement.gridColumnSpan, row: placement.gridRowSpan }
        : LAYOUT_SPAN[input.layout];
      // Fiyat, karta yerlestirildigi andaki katsayilarla dondurulur.
      const price = placement
        ? priceFor({
            placementCode: placement.code,
            issueCount: input.issueCount ?? 1,
            subscriptionPlan: input.subscriptionPlan ?? 'tek-sayi',
          })
        : null;

      return {
        id: itemId(input.key),
        issueId: issue.id,
        itemType: input.itemType,
        section: input.section,
        title: input.title,
        standfirst: input.standfirst ?? null,
        body: input.body,
        imageSeed: input.glyph ? input.key : null,
        imageGlyph: input.glyph ?? null,
        imageAlt: input.imageAlt ?? null,
        sourceOrAuthor: input.sourceOrAuthor ?? null,
        targetUrl: input.targetUrl ?? null,
        linkedEntityType: input.linkedEntityType,
        linkedEntityId: resolveLinkedId(input),
        layoutVariant: input.layout,
        gridColumnSpan: span.col,
        gridRowSpan: span.row,
        priority: input.priority,
        publicationOrder: index,
        sponsored: Boolean(input.sponsored),
        sponsorName: input.sponsorName ?? null,
        placementCode: placement?.code ?? null,
        widthPx: placement?.widthPx ?? null,
        heightPx: placement?.heightPx ?? null,
        priceSnapshot: price?.total ?? null,
        campaignId: null,
      };
    });

  const items = [
    ...buildItems(issues[0], TODAY_ITEMS),
    ...buildItems(issues[1], YESTERDAY_ITEMS),
    ...buildItems(issues[2], THEME_ITEMS),
  ];

  return { issues, items };
}

/**
 * Ilan basvurulari (PROJECT_SPEC 7.9 "Gelir modelinin prototipte gosterimi").
 * Gercek odeme entegrasyonu YOKTUR; basvuru "incelemede" durumunda bekler ve
 * admin ekranindan bir sayiya yerlestirilir.
 */
export function buildAdRequests(now: Date): AdRequest[] {
  const at = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const toDate = (days: number) => toIsoDate(new Date(now.getTime() + days * 86_400_000));
  const snapshot = (placementCode: string, issueCount: number, plan: SubscriptionPlan) =>
    priceFor({ placementCode, issueCount, subscriptionPlan: plan })?.total ?? null;

  return [
    {
      id: uid('ad-request', 'yesilcati-panel-gunu'),
      organizationId: profileId('yesilcati.demo'),
      contactEmail: 'iletisim@yesilcati.demo',
      placementType: 'event_ad',
      requestedPlacement: 'bolum-300x250',
      widthPx: placementByCode('bolum-300x250')!.widthPx,
      heightPx: placementByCode('bolum-300x250')!.heightPx,
      requestedIssueStart: toDate(1),
      requestedIssueCount: 1,
      subscriptionPlan: 'tek-sayi',
      pricingSnapshot: snapshot('bolum-300x250', 1, 'tek-sayi'),
      theme: null,
      title: 'Yeşil Çatı: kooperatif bilgilendirme toplantısı',
      body: 'Çatı GES kurmak isteyen hane sahipleri için ücretsiz bilgilendirme toplantısı. Mevzuat, maliyet ve geri ödeme süresi anlatılacak.',
      creativeUrl: null,
      creativeAlt: null,
      linkUrl: '/etkinlikler/ege-ges-saha-gezisi',
      status: 'pending',
      createdAt: at(1),
      reviewedAt: null,
      publishedItemId: null,
    },
    {
      id: uid('ad-request', 'egeteknopark-demo-gunu'),
      organizationId: profileId('egeteknopark.demo'),
      contactEmail: 'demo@egeteknopark.demo',
      placementType: 'event_ad',
      requestedPlacement: 'bolum-600x400',
      widthPx: placementByCode('bolum-600x400')!.widthPx,
      heightPx: placementByCode('bolum-600x400')!.heightPx,
      requestedIssueStart: toDate(0),
      requestedIssueCount: 4,
      subscriptionPlan: 'dort-sayi',
      pricingSnapshot: snapshot('bolum-600x400', 4, 'dort-sayi'),
      theme: null,
      title: 'Ege Teknopark Demo Günü başvuruları açık',
      body: 'Erken aşama takımlar için 5 dakikalık demo sunumu ve doğrudan geri bildirim.',
      creativeUrl: null,
      creativeAlt: null,
      linkUrl: '/etkinlikler/ege-teknopark-demo-gunu',
      status: 'approved',
      createdAt: at(5),
      reviewedAt: at(4),
      publishedItemId: itemId('today-ad-event'),
    },
    {
      id: uid('ad-request', 'biyolab-lab-gunu'),
      organizationId: profileId('biyolab.demo'),
      contactEmail: 'demo@biyolab.demo',
      placementType: 'org_ad',
      requestedPlacement: 'bolum-300x250',
      widthPx: placementByCode('bolum-300x250')!.widthPx,
      heightPx: placementByCode('bolum-300x250')!.heightPx,
      requestedIssueStart: toDate(0),
      requestedIssueCount: 1,
      subscriptionPlan: 'tek-sayi',
      pricingSnapshot: snapshot('bolum-300x250', 1, 'tek-sayi'),
      theme: null,
      title: 'BiyoLab: lise grupları için laboratuvar günü',
      body: 'Okul grupları için rehberli laboratuvar turu ve temel ekipman eğitimi.',
      creativeUrl: null,
      creativeAlt: null,
      linkUrl: '/profil/biyolab.demo',
      status: 'approved',
      createdAt: at(7),
      reviewedAt: at(6),
      publishedItemId: itemId('today-ad-org'),
    },
    {
      id: uid('ad-request', 'kripto-reklam'),
      organizationId: profileId('yesilcati.demo'),
      contactEmail: 'reklam@ornek.demo',
      placementType: 'org_ad',
      requestedPlacement: 'kapak-970x250',
      widthPx: placementByCode('kapak-970x250')!.widthPx,
      heightPx: placementByCode('kapak-970x250')!.heightPx,
      requestedIssueStart: toDate(2),
      requestedIssueCount: 1,
      subscriptionPlan: 'tek-sayi',
      pricingSnapshot: snapshot('kapak-970x250', 1, 'tek-sayi'),
      theme: null,
      title: 'Garantili kazanç yatırım programı',
      body: 'Kesin kazanç vaat eden yatırım programı duyurusu.',
      creativeUrl: null,
      creativeAlt: null,
      linkUrl: null,
      status: 'rejected',
      createdAt: at(9),
      reviewedAt: at(8),
      publishedItemId: null,
    },
  ];
}
