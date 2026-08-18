import type { Project, ProjectMember, ProjectUpdate } from '@/types/domain';
import { communityId } from './communities';
import { uid } from './ids';
import { profileId } from './profiles';
import { topicId, type TopicSlug } from './topics';

/**
 * Proje seed verisi (PROJECT_SPEC 7.8).
 *
 * Projeler statik portfolyo degil "yasayan" sayfalardir: her projenin bir Neden
 * metni, bir Nasil metni ve tarih sirali ilerleme gunlugu vardir.
 */

export const projectId = (slug: string) => uid('project', slug);

interface ProjectInput {
  slug: string;
  title: string;
  summary: string;
  owner: string;
  status: Project['status'];
  topics: TopicSlug[];
  provinceCode: string | null;
  districtCode: string | null;
  whyText: string;
  howText: string;
  needs: string;
  communities: string[];
  startedDaysAgo: number;
  targetInDays: number | null;
  emoji: string;
  members: Array<{ username: string; roleLabel: string }>;
  updates: Array<{ daysAgo: number; body: string; milestone?: boolean }>;
}

const PROJECTS: ProjectInput[] = [
  {
    slug: 'ruzgar-olcer',
    title: 'Açık Kaynak Rüzgâr Ölçer',
    summary:
      'Çatıya kurulabilen, 3B baskı gövdeli ve düşük maliyetli bir anemometre. Ölçüm verisi açık formatta paylaşılıyor.',
    owner: 'baran.demo',
    status: 'prototip',
    topics: ['surdurulebilirlik', 'robotik'],
    provinceCode: '35',
    districtCode: '35-21',
    whyText:
      'Mahallemizde küçük bir rüzgâr türbini kurmak isteyen bir komşumuz vardı. "Burada rüzgâr var mı?" sorusuna kimse cevap veremedi çünkü elimizde veri yoktu. En yakın meteoroloji istasyonu 14 km uzaktaydı ve verisi bizim çatımızı anlatmıyordu. Ölçemediğimiz şeye yatırım yapamıyoruz; bu proje o boşluğu kapatmak için başladı.',
    howText:
      'Gövde PETG ile 3B baskı, manyetik kapasitif sensör, ESP32 üzerinde MicroPython. Veri 10 dakikada bir CSV olarak yazılıyor ve haftalık özet açık veri olarak yayımlanıyor. Kalibrasyon için üniversitedeki rüzgâr tüneli ile karşılaştırma yapıldı.',
    needs: '3B baskı deneyimi olan ve saha kurulumunda yardım edebilecek 1-2 kişi arıyoruz.',
    communities: ['surdurulebilirlik', 'ege-gunes-enerjisi'],
    startedDaysAgo: 260,
    targetInDays: 75,
    emoji: '🌬️',
    members: [
      { username: 'baran.demo', roleLabel: 'Kurucu, donanım' },
      { username: 'onur.enerji', roleLabel: 'Saha kurulumu' },
      { username: 'nazli.tasarim', roleLabel: 'Veri panosu arayüzü' },
    ],
    updates: [
      { daysAgo: 240, body: 'İlk gövde tasarımı çıktı. Rulman seçimi yanlıştı, 3 günde takıldı.', milestone: true },
      { daysAgo: 180, body: 'Manyetik sensöre geçtik. Sürtünme problemi büyük ölçüde çözüldü.' },
      { daysAgo: 96, body: 'Rüzgâr tünelinde kalibrasyon yaptık. 3-18 m/s aralığında %4 sapma.', milestone: true },
      { daysAgo: 34, body: 'Konak’ta ilk çatı kurulumu tamam. 3 haftalık kesintisiz veri topluyoruz.' },
      { daysAgo: 6, body: 'Veri panosunun erişilebilirlik denetimini yaptık; grafiklerin tablo alternatifi eklendi.' },
    ],
  },
  {
    slug: 'model-roket-itki',
    title: 'Model Roket İtki Test Standı',
    summary: 'Öğrenci takımlarının motor itki eğrisini güvenli biçimde ölçebilmesi için taşınabilir test standı.',
    owner: 'kaan.roket',
    status: 'test',
    topics: ['havacilik-uzay', 'robotik'],
    provinceCode: '35',
    districtCode: '35-07',
    whyText:
      'Takımdaki ilk roketimiz hedeflenen irtifanın yarısına çıktı ve nedenini bir türlü bulamadık. Motorun gerçek itki eğrisini hiç ölçmemiştik, katalog değerine güvenmiştik. O gün "ölçmediğimiz şeyi tartışıyoruz" diye not almıştım. Bu stand o notun sonucudur.',
    howText:
      'Yük hücresi + HX711, Arduino üzerinde 80 Hz örnekleme, güvenlik için uzaktan ateşleme ve çelik muhafaza. Sonuçlar CSV olarak dışa aktarılıyor, topluluk arşivinde saklanıyor.',
    needs: 'Yük hücresi kalibrasyonu konusunda deneyimli birine danışmak istiyoruz.',
    communities: ['havacilik-uzay', 'izmir-havacilik'],
    startedDaysAgo: 150,
    targetInDays: 40,
    emoji: '🚀',
    members: [
      { username: 'kaan.roket', roleLabel: 'Takım kaptanı' },
      { username: 'elif.demo', roleLabel: 'Test güvenliği' },
    ],
    updates: [
      { daysAgo: 140, body: 'Stand iskeleti kaynaklandı. Titreşim beklediğimizden fazla.', milestone: true },
      { daysAgo: 88, body: 'Yük hücresi montajı ve ilk kuru test. Gürültü filtresi gerekiyor.' },
      { daysAgo: 30, body: 'İlk gerçek ateşleme testi başarılı. Eğri katalogdan %11 düşük çıktı.', milestone: true },
      { daysAgo: 9, body: 'Test protokolünü yazdık, topluluk kaynağı olarak paylaştık.' },
    ],
  },
  {
    slug: 'turkce-ozetleme-seti',
    title: 'Türkçe Özetleme Değerlendirme Seti',
    summary: 'Türkçe metin özetleme modelleri için açık, insan etiketli değerlendirme veri seti ve ölçüt takımı.',
    owner: 'ayse.veri',
    status: 'yayinda',
    topics: ['yapay-zeka'],
    provinceCode: '34',
    districtCode: null,
    whyText:
      'Türkçe için bir özetleme modeli değerlendirmek istediğimde elimde İngilizceden çevrilmiş, dilin yapısını hesaba katmayan ölçütler vardı. Sonuçlar iyi görünüyordu ama okuduğumda özetler kötüydü. Ölçüt yanlışsa ilerleme de yanlış yöne gider; bu yüzden önce ölçmeyi düzeltmeye karar verdim.',
    howText:
      'Haber, akademik özet ve forum metni olmak üzere üç alan. Her metin için 3 bağımsız insan özeti ve tutarlılık/kapsam/akıcılık puanları. Etiketleyiciler arası uyum Krippendorff alfa ile raporlanıyor.',
    needs: 'Etiketleme turuna katılacak gönüllüler her zaman açık.',
    communities: ['yapay-zeka', 'turkce-nlp'],
    startedDaysAgo: 420,
    targetInDays: null,
    emoji: '🔤',
    members: [
      { username: 'ayse.veri', roleLabel: 'Kurucu' },
      { username: 'emre.guvenlik', roleLabel: 'Veri altyapısı' },
    ],
    updates: [
      { daysAgo: 400, body: 'İlk 200 metin toplandı ve lisans temizliği yapıldı.', milestone: true },
      { daysAgo: 250, body: 'Etiketleme kılavuzu 3. sürüme geçti; uyum 0.61’den 0.78’e çıktı.' },
      { daysAgo: 120, body: 'v1 yayımlandı. 1.400 metin, 4.200 insan özeti.', milestone: true },
      { daysAgo: 21, body: 'Forum alanı için 300 metin daha eklendi.' },
    ],
  },
  {
    slug: 'sera-sensor-agi',
    title: 'Sera Sensör Ağı',
    summary: 'Küçük üreticiler için düşük maliyetli toprak nemi ve sıcaklık ağı, LoRa üzerinden veri toplama.',
    owner: 'onur.enerji',
    status: 'prototip',
    topics: ['surdurulebilirlik', 'robotik'],
    provinceCode: '35',
    districtCode: '35-25',
    whyText:
      'Ödemiş’te dedemin serasında sulama tamamen tahminle yapılıyordu. Bir yıl fazla suladık, kökler çürüdü. Ertesi yıl az suladık, verim düştü. Ölçüm olmadan tecrübe bile yetmiyordu. Bu ağ, tahminle sulamayı bitirsin diye var.',
    howText:
      'Kapasitif toprak nemi sensörü, LoRa ile 2 km menzil, güneş paneli beslemeli düğümler. Veriler yerel bir Raspberry Pi’de toplanıyor, internet olmadan da çalışıyor.',
    needs: 'LoRa anten yerleşimi ve pil ömrü optimizasyonu konusunda geri bildirim.',
    communities: ['surdurulebilirlik'],
    startedDaysAgo: 190,
    targetInDays: 110,
    emoji: '🌱',
    members: [
      { username: 'onur.enerji', roleLabel: 'Kurucu' },
      { username: 'mert.kod', roleLabel: 'Gömülü yazılım' },
    ],
    updates: [
      { daysAgo: 180, body: 'İlk düğüm çalıştı ama 4 günde pil bitti.', milestone: true },
      { daysAgo: 110, body: 'Uyku modu ve ölçüm aralığı ayarıyla pil ömrü 6 haftaya çıktı.' },
      { daysAgo: 40, body: 'Serada 6 düğümlü ağ kuruldu. Bir düğüm nem yüzünden bozuldu, kutu tasarımı değişecek.' },
      { daysAgo: 11, body: 'Yeni conta tasarımı test ediliyor.' },
    ],
  },
  {
    slug: 'erisilebilir-oyun-menusu',
    title: 'Erişilebilir Oyun Menüsü Kiti',
    summary: 'Bağımsız oyun geliştiricileri için hazır, klavye ve ekran okuyucu uyumlu menü ve ayar sistemi.',
    owner: 'selin.oyun',
    status: 'prototip',
    topics: ['oyun-gelistirme', 'tasarim-urun'],
    provinceCode: '35',
    districtCode: '35-17',
    whyText:
      'Bir game jam’de yaptığımız oyunu arkadaşımın az gören kardeşi oynayamadı. Menüyü göremiyordu, biz de 48 saatte hiç düşünmemiştik. O günden beri erişilebilirliği sonradan eklenen bir şey olarak görmüyorum.',
    howText:
      'Godot ve Unity için ayrı paketler. Odak sırası, yüksek kontrast teması, yeniden tuş atama, metin boyutu ve hareket azaltma ayarları hazır geliyor.',
    needs: 'Ekran okuyucu kullanan oyunculardan test geri bildirimi çok değerli olur.',
    communities: ['oyun-gelistirme', 'erisilebilir-arayuz', 'game-jam-ege'],
    startedDaysAgo: 85,
    targetInDays: 60,
    emoji: '🕹️',
    members: [
      { username: 'selin.oyun', roleLabel: 'Kurucu' },
      { username: 'nazli.tasarim', roleLabel: 'Erişilebilirlik danışmanı' },
    ],
    updates: [
      { daysAgo: 80, body: 'Godot paketinin ilk sürümü. Odak halkası görünmüyordu, düzeltildi.', milestone: true },
      { daysAgo: 40, body: 'Tuş yeniden atama ekranı eklendi.' },
      { daysAgo: 7, body: 'İlk dış test: 4 kullanıcıdan 3’ü menüyü yardımsız tamamladı.' },
    ],
  },
  {
    slug: 'laboratuvar-gunlugu',
    title: 'Açık Laboratuvar Günlüğü',
    summary: 'Başarısız deneylerin de kaydedildiği, aranabilir ve alıntılanabilir bir laboratuvar defteri.',
    owner: 'zeynep.bio',
    status: 'yayinda',
    topics: ['biyoteknoloji'],
    provinceCode: '34',
    districtCode: null,
    whyText:
      'Yüksek lisansın ilk yılında üç ay boyunca bir protokolü tekrarladım. Sonradan öğrendim ki bir önceki dönem başka bir öğrenci aynı protokolü denemiş ve aynı nedenle başarısız olmuş. Kimse yazmamıştı çünkü "başarısız" sonuçlar kaydedilmiyordu. O üç ay kimsenin tekrar kaybetmemesi gerektiğini düşündüğüm için bu projeyi başlattım.',
    howText:
      'Markdown tabanlı kayıtlar, protokol sürümleme, sonuç etiketleri (başarılı / başarısız / belirsiz) ve tam metin arama. Her kayıt alıntılanabilir bir kalıcı bağlantı alıyor.',
    needs: 'Farklı laboratuvarlardan protokol katkısı arıyoruz.',
    communities: ['biyoteknoloji', 'lise-biyoteknoloji'],
    startedDaysAgo: 330,
    targetInDays: null,
    emoji: '📓',
    members: [
      { username: 'zeynep.bio', roleLabel: 'Kurucu' },
      { username: 'irem.lise', roleLabel: 'Lise kullanıcı testi' },
    ],
    updates: [
      { daysAgo: 320, body: 'İlk sürüm sadece kendi defterim içindi.', milestone: true },
      { daysAgo: 200, body: 'İki laboratuvar daha katıldı. Sürümleme şart oldu.' },
      { daysAgo: 90, body: 'Başarısız deney etiketi eklendi; en çok kullanılan filtre bu çıktı.', milestone: true },
      { daysAgo: 15, body: 'Lise öğrencileri için sadeleştirilmiş görünüm test ediliyor.' },
    ],
  },
  {
    slug: 'otonom-simulasyon',
    title: 'Otonom Araç Simülasyon Sahnesi',
    summary: 'Türkiye trafik işaretleri ve şerit çizgileriyle hazırlanmış, açık kaynak simülasyon sahnesi.',
    owner: 'mert.kod',
    status: 'prototip',
    topics: ['robotik', 'yapay-zeka'],
    provinceCode: '06',
    districtCode: null,
    whyText:
      'Takım olarak yarışmaya hazırlanırken hazır simülasyon sahnelerindeki tabelalar bizim yollarımıza benzemiyordu. Modelimiz simülasyonda mükemmeldi, pistte kayboldu. Simülasyon gerçeğe benzemezse harcadığımız zaman bize yalan söylüyor.',
    howText:
      'CARLA üzerine kurulu özel harita, TSE işaret setleri, farklı hava ve ışık koşulları. Senaryolar YAML ile tanımlanıyor, tekrar üretilebilir.',
    needs: 'İşaret ve şerit çeşitliliğini artırmak için saha fotoğrafı katkısı.',
    communities: ['robotik', 'otonom-arac-takimlari'],
    startedDaysAgo: 210,
    targetInDays: 55,
    emoji: '🚗',
    members: [
      { username: 'mert.kod', roleLabel: 'Kurucu' },
      { username: 'burak.uav', roleLabel: 'Algılama' },
    ],
    updates: [
      { daysAgo: 200, body: 'Temel harita çıkarıldı.', milestone: true },
      { daysAgo: 120, body: '30 farklı işaret modellendi.' },
      { daysAgo: 45, body: 'Yağmur ve gece senaryoları eklendi; model başarımı %22 düştü, bu iyi haber.', milestone: true },
      { daysAgo: 12, body: 'Senaryo tanımları YAML’a taşındı.' },
    ],
  },
  {
    slug: 'iha-iniş-yardimcisi',
    title: 'İHA Görsel İniş Yardımcısı',
    summary: 'Sabit kanatlı İHA’lar için kamera tabanlı, GPS’siz iniş hizalama yardımcısı.',
    owner: 'burak.uav',
    status: 'test',
    topics: ['havacilik-uzay', 'yapay-zeka'],
    provinceCode: '06',
    districtCode: null,
    whyText:
      'Bir test uçuşunda GPS sinyali 40 saniye kayboldu. Uçak elimizdeydi ama nereye ineceğini bilmiyordu. O 40 saniye, tek bir sinyale bağımlı olmanın ne demek olduğunu çok net gösterdi.',
    howText:
      'Yer işaretini kamera ile tanıyan hafif bir model, Jetson Nano üzerinde 30 FPS. Otopilota hizalama düzeltmesi öneriyor, kontrolü devralmıyor.',
    needs: 'Farklı ışık koşullarında pist fotoğrafı veri seti.',
    communities: ['havacilik-uzay'],
    startedDaysAgo: 165,
    targetInDays: 30,
    emoji: '🛸',
    members: [
      { username: 'burak.uav', roleLabel: 'Kurucu' },
      { username: 'ece.uzay', roleLabel: 'Görüntü işleme' },
    ],
    updates: [
      { daysAgo: 160, body: 'Yer işareti tasarımı seçildi.', milestone: true },
      { daysAgo: 100, body: 'Simülasyonda %94 tanıma. Gerçekte %61.' },
      { daysAgo: 38, body: 'Veri artırma sonrası gerçek koşullarda %88.', milestone: true },
      { daysAgo: 5, body: 'Rüzgârlı havada ilk saha testi bu hafta.' },
    ],
  },
  {
    slug: 'ctf-yol-haritasi',
    title: 'Sıfırdan CTF Yol Haritası',
    summary: 'Yeni başlayanlar için sıralı, çözümlü ve yasal ortamda uygulanabilir CTF öğrenme yolu.',
    owner: 'emre.guvenlik',
    status: 'yayinda',
    topics: ['siber-guvenlik'],
    provinceCode: '34',
    districtCode: null,
    whyText:
      'Başlarken bana "şu siteye gir, kırmayı dene" dediler. Ne öğrendiğimi anlamadım, sadece kopyala-yapıştır yaptım. Bir yıl kaybettim. Yeni gelenlerin aynı boşlukta dolaşmaması için sıralı ve açıklamalı bir yol yazmak istedim.',
    howText:
      '12 haftalık modüller, her modülde 3 alıştırma ve açıklamalı çözüm. Tüm alıştırmalar izinli ve yasal platformlarda. Gerçek sistemlere yönelik hiçbir içerik yok.',
    needs: 'Çözüm açıklamalarını sadeleştirecek editör desteği.',
    communities: ['siber-guvenlik', 'ctf-baslangic'],
    startedDaysAgo: 280,
    targetInDays: null,
    emoji: '🚩',
    members: [
      { username: 'emre.guvenlik', roleLabel: 'Kurucu' },
      { username: 'ayse.veri', roleLabel: 'İçerik editörü' },
    ],
    updates: [
      { daysAgo: 270, body: 'İlk 3 modül yazıldı.', milestone: true },
      { daysAgo: 150, body: '12 modül tamamlandı, topluluk incelemesine açıldı.', milestone: true },
      { daysAgo: 60, body: 'Geri bildirimlerle 4 modül yeniden yazıldı.' },
      { daysAgo: 18, body: 'Moderatör doğrulaması alındı.' },
    ],
  },
];

export function buildProjects(now: Date): Project[] {
  return PROJECTS.map((input) => ({
    id: projectId(input.slug),
    slug: input.slug,
    ownerId: profileId(input.owner),
    title: input.title,
    summary: input.summary,
    status: input.status,
    topicIds: input.topics.map(topicId),
    provinceCode: input.provinceCode,
    districtCode: input.districtCode,
    whyText: input.whyText,
    howText: input.howText,
    needs: input.needs,
    communityIds: input.communities.map(communityId),
    startedAt: new Date(now.getTime() - input.startedDaysAgo * 86_400_000).toISOString(),
    targetEndAt:
      input.targetInDays === null ? null : new Date(now.getTime() + input.targetInDays * 86_400_000).toISOString(),
    emoji: input.emoji,
    pitchMediaId: uid('media', `pitch-${input.slug}`),
  }));
}

export function buildProjectMembers(): ProjectMember[] {
  return PROJECTS.flatMap((input) =>
    input.members.map((member) => ({
      projectId: projectId(input.slug),
      profileId: profileId(member.username),
      roleLabel: member.roleLabel,
    })),
  );
}

export function buildProjectUpdates(now: Date): ProjectUpdate[] {
  return PROJECTS.flatMap((input) =>
    input.updates.map((update, index) => {
      const createdAt = new Date(now.getTime() - update.daysAgo * 86_400_000).toISOString();
      return {
        id: uid('project-update', `${input.slug}-${index}`),
        projectId: projectId(input.slug),
        authorId: profileId(input.owner),
        body: update.body,
        createdAt,
        milestoneDate: update.milestone ? createdAt : null,
        isMilestone: Boolean(update.milestone),
      };
    }),
  );
}

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);
