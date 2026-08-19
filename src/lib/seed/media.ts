import type { Media } from '@/types/domain';
import { uid } from './ids';

/**
 * Demo medya manifestosu.
 *
 * Bu liste tek kaynaktir: hem seed'deki `media` kayitlari hem de
 * `scripts/build-demo-media.mjs` tarafindan uretilen dosyalar buradan turer.
 * Boylece veri ile dosyalar birbirinden ayrilamaz.
 *
 * Tum klipler sentetiktir: gercek cekim degil, uygulama tarafindan uretilmis
 * kisa hareketli kartlardir. Yarisma demosunun internet baglantisindan bagimsiz
 * calisabilmesi icin dosyalar repoda tutulur ve kucuktur (PROJECT_SPEC 15.4).
 */

export interface DemoClip {
  key: string;
  title: string;
  subtitle: string;
  /** Kart rengi; poster ve video ayni tonu kullanir. */
  tone: string;
  emoji: string;
  durationSec: number;
  /** Video icin altyazi/transkript ozeti - erisilebilirlik gereksinimi. */
  transcript: string;
}

export interface DemoImage {
  key: string;
  title: string;
  tone: string;
  emoji: string;
  /** Gorsel icin alternatif metin. */
  alt: string;
}

/** Proje pitch videolari - her projenin bir tanesi var. */
export const PITCH_CLIPS: DemoClip[] = [
  {
    key: 'pitch-ruzgar-olcer',
    title: 'Açık Kaynak Rüzgâr Ölçer',
    subtitle: '60 saniyelik pitch',
    tone: '#1d4ed8',
    emoji: '🌬️',
    durationSec: 58,
    transcript:
      'Çatıya kurulabilen düşük maliyetli bir anemometre yapıyoruz. Gövde 3B baskı, sensör manyetik, veri açık formatta. Amacımız mahalle ölçeğinde rüzgâr verisini herkese açmak.',
  },
  {
    key: 'pitch-model-roket-itki',
    title: 'Model Roket İtki Test Standı',
    subtitle: '45 saniyelik pitch',
    tone: '#0f7d72',
    emoji: '🚀',
    durationSec: 44,
    transcript:
      'Öğrenci takımlarının motor itki eğrisini güvenle ölçebilmesi için taşınabilir bir stand. Yük hücresi, uzaktan ateşleme ve CSV çıktısı.',
  },
  {
    key: 'pitch-turkce-ozetleme-seti',
    title: 'Türkçe Özetleme Değerlendirme Seti',
    subtitle: '50 saniyelik pitch',
    tone: '#7c3aed',
    emoji: '🔤',
    durationSec: 51,
    transcript:
      'Türkçe özetleme modelleri için insan etiketli açık bir değerlendirme seti. Üç alan, üç bağımsız özet, raporlanan etiketleyici uyumu.',
  },
  {
    key: 'pitch-sera-sensor-agi',
    title: 'Sera Sensör Ağı',
    subtitle: '55 saniyelik pitch',
    tone: '#15803d',
    emoji: '🌱',
    durationSec: 55,
    transcript:
      'Küçük üreticiler için LoRa tabanlı toprak nemi ağı. İnternet olmadan da çalışır, veriler yerel olarak toplanır.',
  },
  {
    key: 'pitch-erisilebilir-oyun-menusu',
    title: 'Erişilebilir Oyun Menüsü Kiti',
    subtitle: '40 saniyelik pitch',
    tone: '#be123c',
    emoji: '🕹️',
    durationSec: 41,
    transcript:
      'Bağımsız oyun geliştiricileri için hazır erişilebilir menü sistemi. Odak sırası, yüksek kontrast, tuş atama ve hareket azaltma kutudan çıkıyor.',
  },
  {
    key: 'pitch-laboratuvar-gunlugu',
    title: 'Açık Laboratuvar Günlüğü',
    subtitle: '48 saniyelik pitch',
    tone: '#0f7d72',
    emoji: '📓',
    durationSec: 47,
    transcript:
      'Başarısız deneylerin de kaydedildiği, aranabilir ve alıntılanabilir bir laboratuvar defteri. Protokol sürümleme ve sonuç etiketleri var.',
  },
  {
    key: 'pitch-otonom-simulasyon',
    title: 'Otonom Araç Simülasyon Sahnesi',
    subtitle: '52 saniyelik pitch',
    tone: '#1c2b44',
    emoji: '🚗',
    durationSec: 52,
    transcript:
      'Türkiye trafik işaretleriyle hazırlanmış açık kaynak simülasyon sahnesi. Senaryolar YAML ile tanımlanıyor, tekrar üretilebilir.',
  },
  {
    key: 'pitch-iha-inis-yardimcisi',
    title: 'İHA Görsel İniş Yardımcısı',
    subtitle: '46 saniyelik pitch',
    tone: '#1d4ed8',
    emoji: '🛸',
    durationSec: 46,
    transcript:
      'GPS olmadan kamera ile iniş hizalaması öneren hafif bir sistem. Otopilotun kontrolünü devralmaz, yalnızca düzeltme önerir.',
  },
  {
    key: 'pitch-ctf-yol-haritasi',
    title: 'Sıfırdan CTF Yol Haritası',
    subtitle: '38 saniyelik pitch',
    tone: '#b45309',
    emoji: '🚩',
    durationSec: 39,
    transcript:
      'Yeni başlayanlar için sıralı ve açıklamalı bir öğrenme yolu. Tüm alıştırmalar izinli ve yasal platformlarda yapılıyor.',
  },
];

/** Neden hikayelerinin video anlatimlari. */
export const WHY_CLIPS: DemoClip[] = [
  {
    key: 'why-ruzgar-olcer-nedeni',
    title: 'Cevaplayamadığımız bir soru',
    subtitle: 'Neden hikâyesi · 45 sn',
    tone: '#be123c',
    emoji: '🌬️',
    durationSec: 45,
    transcript:
      'Komşumuz çatısına türbin kurmak istedi ve bize burada rüzgâr var mı diye sordu. Cevap veremedik. Ölçemediğimiz şey hakkında konuşurken aslında tahmin yürütüyoruz.',
  },
  {
    key: 'why-olcmedigimiz-sey',
    title: 'Roketimiz neden yarı yükseklikte kaldı?',
    subtitle: 'Neden hikâyesi · 40 sn',
    tone: '#0f7d72',
    emoji: '🚀',
    durationSec: 40,
    transcript:
      'İki hafta aerodinamiği tartıştık. Sonra biri sordu: motorun gerçek itkisini ölçtük mü? Ölçmemiştik. O gün ölçmediğimiz şeyi tartışıyoruz diye not aldım.',
  },
  {
    key: 'why-arkadasimin-kardesi',
    title: 'Oyunumuzu oynayamayan ilk kişi',
    subtitle: 'Neden hikâyesi · 38 sn',
    tone: '#7c3aed',
    emoji: '🎮',
    durationSec: 38,
    transcript:
      'Arkadaşımın az gören kardeşi menüde kayboldu. Yazılar küçüktü, odak göstergesi yoktu. Erişilebilirliği o günden sonra sonradan eklenen bir iş olarak görmüyorum.',
  },
  {
    key: 'why-gokyuzu-kasabasi',
    title: 'Şehir ışığı olmayan bir kasaba',
    subtitle: 'Neden hikâyesi · 42 sn',
    tone: '#1c2b44',
    emoji: '🌌',
    durationSec: 42,
    transcript:
      'Büyüdüğüm kasabada gökyüzü açıktı. Şehre taşınınca kaybettiğim bir şey olduğunu hissettim. Astrofiziğe yönelmem o eksiklikle başladı.',
  },
];

/** Akista dogrudan gorunen gundelik kisa videolar. */
export const FEED_CLIPS: DemoClip[] = [
  {
    key: 'feed-lehim-nasil',
    title: '30 saniyede temiz lehim',
    subtitle: 'Nasıl · 30 sn',
    tone: '#15803d',
    emoji: '🔧',
    durationSec: 31,
    transcript:
      'Ucu temizle, önce pedi ısıt, sonra teli değdir. Teli ucun üstüne değdirirsen soğuk lehim olur. Üç saniyeden uzun tutma.',
  },
  {
    key: 'feed-jam-son-saat',
    title: 'Jam’in son saati',
    subtitle: 'Gündelik · 22 sn',
    tone: '#7c3aed',
    emoji: '🕹️',
    durationSec: 22,
    transcript: 'Son bir saat kaldı, ses hâlâ yok, menü hâlâ yok ama oyun çalışıyor. Bu da bir başarı sayılır.',
  },
  {
    key: 'feed-sensor-ilerleme',
    title: 'Altı düğüm, altı hafta',
    subtitle: 'İlerleme · 35 sn',
    tone: '#0f7d72',
    emoji: '🌱',
    durationSec: 35,
    transcript: 'Serada altı düğüm çalışıyor. Biri nem yüzünden bozuldu, kutu tasarımını değiştiriyoruz.',
  },
  {
    key: 'feed-tunel-testi',
    title: 'Rüzgâr tünelinde kalibrasyon',
    subtitle: 'Demo · 28 sn',
    tone: '#1d4ed8',
    emoji: '🌬️',
    durationSec: 28,
    transcript: '3 ile 18 metre saniye arasında yüzde dört sapma. Kalibrasyon tablosu depoda paylaşıldı.',
  },
  {
    key: 'feed-mizah-derleyici',
    title: 'Derleyici hatası mı, ben mi?',
    subtitle: 'Gündelik · 18 sn',
    tone: '#f97a07',
    emoji: '😄',
    durationSec: 18,
    transcript: 'Üç saat hata aradım. Noktalı virgül değildi, ben yanlış dosyayı derliyordum. Kahve molası verildi.',
  },
  {
    key: 'feed-teleskop-kurulum',
    title: 'Teleskop kurulumu, 40 saniye',
    subtitle: 'Nasıl · 40 sn',
    tone: '#1c2b44',
    emoji: '🔭',
    durationSec: 40,
    transcript: 'Önce zemini dengele, sonra kutup hizalaması yap. Acele edip hizalamayı atlarsan bütün gece takip kayar.',
  },
  {
    key: 'feed-ekran-okuyucu-soru',
    title: 'Bu formu siz dinleyebiliyor musunuz?',
    subtitle: 'Soru · 25 sn',
    tone: '#be123c',
    emoji: '♿',
    durationSec: 25,
    transcript:
      'Hata mesajını hangi alana bağlamam gerektiğini çözemedim. Ekran okuyucu kullanan varsa bu formu bir dener mi?',
  },
  {
    key: 'feed-roket-atesleme',
    title: 'Standda ilk ateşleme',
    subtitle: 'Demo · 26 sn',
    tone: '#0f7d72',
    emoji: '🔥',
    durationSec: 26,
    transcript: 'Uzaktan ateşleme çalıştı, muhafaza sağlam. Eğri katalogdan yüzde on bir düşük çıktı.',
  },
];

export const ALL_CLIPS: DemoClip[] = [...PITCH_CLIPS, ...WHY_CLIPS, ...FEED_CLIPS];

export const DEMO_IMAGES: DemoImage[] = [
  {
    key: 'img-ruzgar-olcer-cati',
    title: 'Çatıdaki ölçüm düzeneği',
    tone: '#1d4ed8',
    emoji: '🌬️',
    alt: 'Çatıya monte edilmiş üç kollu rüzgâr ölçerin şematik görseli.',
  },
  {
    key: 'img-itki-egrisi',
    title: 'İtki eğrisi grafiği',
    tone: '#0f7d72',
    emoji: '📈',
    alt: 'Zamana karşı itki değerini gösteren, tepe yapıp azalan bir eğri grafiği.',
  },
  {
    key: 'img-lab-defteri',
    title: 'Laboratuvar defteri sayfası',
    tone: '#be123c',
    emoji: '📓',
    alt: 'Başarılı ve başarısız olarak etiketlenmiş deney kayıtlarını gösteren defter sayfası şeması.',
  },
  {
    key: 'img-sera-dugum',
    title: 'Sera sensör düğümü',
    tone: '#15803d',
    emoji: '🌱',
    alt: 'Güneş paneli ve anteni olan, toprağa yerleştirilmiş bir sensör kutusunun şeması.',
  },
  {
    key: 'img-oyun-menu',
    title: 'Yüksek kontrastlı oyun menüsü',
    tone: '#7c3aed',
    emoji: '🎮',
    alt: 'Belirgin odak halkası olan, yüksek kontrastlı bir oyun menüsü ekran görüntüsü şeması.',
  },
  {
    key: 'img-harita-izmir',
    title: 'İzmir ilçe dağılımı',
    tone: '#0f7d72',
    emoji: '🗺️',
    alt: 'İzmir ilçelerinin vurgulandığı basit bir harita şeması.',
  },
  {
    key: 'img-otonom-sahne',
    title: 'Simülasyon sahnesi',
    tone: '#1c2b44',
    emoji: '🚗',
    alt: 'Trafik işaretleri ve şerit çizgileriyle hazırlanmış bir simülasyon yolu şeması.',
  },
  {
    key: 'img-gozlem-gecesi',
    title: 'Gözlem gecesi',
    tone: '#1c2b44',
    emoji: '🌠',
    alt: 'Teleskop siluetleri ve yıldızlı gökyüzünü gösteren basit bir illüstrasyon.',
  },
  {
    key: 'img-panel-cati',
    title: 'Kooperatif çatı GES',
    tone: '#f97a07',
    emoji: '☀️',
    alt: 'Bir çatıya sıralar hâlinde yerleştirilmiş güneş panellerinin şeması.',
  },
  {
    key: 'img-ctf-tahta',
    title: 'CTF yol haritası panosu',
    tone: '#b45309',
    emoji: '🚩',
    alt: 'On iki haftalık modülleri gösteren bir yol haritası panosu şeması.',
  },
];

export const mediaId = (key: string) => uid('media', key);

export function buildMedia(): Media[] {
  const clips: Media[] = ALL_CLIPS.map((clip) => ({
    id: mediaId(clip.key),
    postId: null,
    mediaType: 'video',
    storagePath: `/demo/video/${clip.key}.webm`,
    caption: clip.title,
    altText: clip.transcript,
    durationSec: clip.durationSec,
    posterPath: `/demo/poster/${clip.key}.svg`,
  }));

  const images: Media[] = DEMO_IMAGES.map((image) => ({
    id: mediaId(image.key),
    postId: null,
    mediaType: 'image',
    storagePath: `/demo/image/${image.key}.svg`,
    caption: image.title,
    altText: image.alt,
    durationSec: null,
    posterPath: null,
  }));

  return [...clips, ...images];
}
