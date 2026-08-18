import type { AdRequest, NewspaperIssue, NewspaperItem } from '@/types/domain';
import { communityId } from './communities';
import { eventId } from './events';
import { uid } from './ids';
import { profileId } from './profiles';
import { projectId } from './projects';
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

const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

interface ItemInput {
  key: string;
  itemType: NewspaperItem['itemType'];
  title: string;
  body: string;
  linkedEntityType: NewspaperItem['linkedEntityType'];
  linkedKey: string | null;
  sponsored?: boolean;
  sponsorName?: string;
}

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
    title: 'Ölçmediğimiz şeyi tartışıyoruz: veri toplayan üç öğrenci projesi',
    body: 'Bu haftanın üç projesi de aynı cümleden çıkmış: elimizde sayı yoktu. Rüzgâr ölçer, itki test standı ve sera sensör ağı, veri boşluğunu kendi imkânlarıyla kapatmaya çalışan ekiplerin işi. Üçünün de ham verisi açık.',
    linkedEntityType: 'project',
    linkedKey: 'ruzgar-olcer',
  },
  {
    key: 'today-editorial-1',
    itemType: 'editorial',
    title: 'Başarısız deney neden kaydedilmeli?',
    body: 'Açık Laboratuvar Günlüğü’nde en çok kullanılan filtrenin "başarısız" etiketi olması tesadüf değil. Yayımlanmayan olumsuz sonuçlar, aynı hatanın farklı laboratuvarlarda tekrarlanmasına yol açıyor.',
    linkedEntityType: 'why_story',
    linkedKey: 'basarisiz-deney-arsivi',
  },
  {
    key: 'today-editorial-2',
    itemType: 'editorial',
    title: 'Erişilebilirlik sonradan eklenmiyor',
    body: 'Bir game jam sonrası yaşanan küçük bir an, bir projenin tamamını değiştirdi. Erişilebilir menü kitinin ilk dış testinde dört kullanıcıdan üçü menüyü yardımsız tamamladı.',
    linkedEntityType: 'project',
    linkedKey: 'erisilebilir-oyun-menusu',
  },
  {
    key: 'today-local',
    itemType: 'local',
    title: 'İzmir’de bu ay: roket atölyesi, saha uçuşu ve çatı GES gezisi',
    body: 'Konum bilgisi paylaşan kullanıcılar için yerel seçki. Üç etkinliğin ikisi ücretsiz ve kayıt gerektirmiyor.',
    linkedEntityType: 'event',
    linkedKey: 'izmir-model-roket-atolyesi',
  },
  {
    key: 'today-showcase',
    itemType: 'project_showcase',
    title: 'Proje vitrini: Türkçe Özetleme Değerlendirme Seti',
    body: 'Editoryal seçki. Model iyileştirmeden önce ölçütü düzeltmeyi seçen bir çalışma; v1’de 1.400 metin ve 4.200 insan özeti var.',
    linkedEntityType: 'project',
    linkedKey: 'turkce-ozetleme-seti',
  },
  {
    key: 'today-ad-event',
    itemType: 'event_ad',
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
    title: 'Kırk saniye: bir test uçuşunun geri kalanını belirleyen an',
    body: 'GPS sinyalinin kaybolduğu kırk saniye, bir öğrenci ekibini kamera tabanlı iniş yardımcısı geliştirmeye yöneltti. Saha testi bu hafta.',
    linkedEntityType: 'why_story',
    linkedKey: 'kirk-saniye',
  },
  {
    key: 'yesterday-editorial-1',
    itemType: 'editorial',
    title: 'Simülasyon gerçeğe benzemezse ne olur?',
    body: 'Yağmur ve gece senaryoları eklendiğinde model başarımının %22 düşmesi kötü bir haber değil. Kötü haber, bunu yarışma pistinde öğrenmek olurdu.',
    linkedEntityType: 'project',
    linkedKey: 'otonom-simulasyon',
  },
  {
    key: 'yesterday-local',
    itemType: 'local',
    title: 'Topluluklardan: CTF başlangıç kampı moderatör doğrulaması aldı',
    body: 'On iki modülün tamamı izinli platformlarda çalışacak biçimde yeniden kontrol edildi.',
    linkedEntityType: 'community',
    linkedKey: 'ctf-baslangic',
  },
  {
    key: 'yesterday-ad-org',
    itemType: 'org_ad',
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
    title: 'Uzay özel sayısı: gökyüzüne bakan topluluklar',
    body: 'Model roketten amatör astronomiye, gökyüzüyle uğraşan toplulukların bu ayki üretimleri.',
    linkedEntityType: 'community',
    linkedKey: 'gece-gokyuzu',
  },
  {
    key: 'theme-editorial',
    itemType: 'editorial',
    title: 'Bir kasabada büyümek ve gökyüzünü kaybetmek',
    body: 'Şehre taşındıktan sonra gökyüzünü kaybetme hissi, bir astrofizik öğrencisini gözlem geceleri düzenlemeye götürdü.',
    linkedEntityType: 'why_story',
    linkedKey: 'gokyuzu-kasabasi',
  },
  {
    key: 'theme-showcase',
    itemType: 'project_showcase',
    title: 'Proje vitrini: Model Roket İtki Test Standı',
    body: 'Katalog değerine güvenmeyi bırakan bir öğrenci takımının taşınabilir ölçüm standı.',
    linkedEntityType: 'project',
    linkedKey: 'model-roket-itki',
  },
  {
    key: 'theme-ad-event',
    itemType: 'event_ad',
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
    inputs.map((input, index) => ({
      id: itemId(input.key),
      issueId: issue.id,
      itemType: input.itemType,
      title: input.title,
      body: input.body,
      linkedEntityType: input.linkedEntityType,
      linkedEntityId: resolveLinkedId(input),
      sponsored: Boolean(input.sponsored),
      sponsorName: input.sponsorName ?? null,
      position: index,
    }));

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

  return [
    {
      id: uid('ad-request', 'yesilcati-panel-gunu'),
      organizationId: profileId('yesilcati.demo'),
      contactEmail: 'iletisim@yesilcati.demo',
      placementType: 'event_ad',
      requestedIssueDate: toDate(1),
      theme: null,
      title: 'Yeşil Çatı: kooperatif bilgilendirme toplantısı',
      body: 'Çatı GES kurmak isteyen hane sahipleri için ücretsiz bilgilendirme toplantısı. Mevzuat, maliyet ve geri ödeme süresi anlatılacak.',
      creativeUrl: null,
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
      requestedIssueDate: toDate(0),
      theme: null,
      title: 'Ege Teknopark Demo Günü başvuruları açık',
      body: 'Erken aşama takımlar için 5 dakikalık demo sunumu ve doğrudan geri bildirim.',
      creativeUrl: null,
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
      requestedIssueDate: toDate(0),
      theme: null,
      title: 'BiyoLab: lise grupları için laboratuvar günü',
      body: 'Okul grupları için rehberli laboratuvar turu ve temel ekipman eğitimi.',
      creativeUrl: null,
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
      requestedIssueDate: toDate(2),
      theme: null,
      title: 'Garantili kazanç yatırım programı',
      body: 'Kesin kazanç vaat eden yatırım programı duyurusu.',
      creativeUrl: null,
      linkUrl: null,
      status: 'rejected',
      createdAt: at(9),
      reviewedAt: at(8),
      publishedItemId: null,
    },
  ];
}
