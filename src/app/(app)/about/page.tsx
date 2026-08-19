import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, InfoNote, SectionHeader } from '@/components/ui';
import { getStore } from '@/lib/data/store';
import { BASE_WEIGHTS, INTENT_WEIGHTS } from '@/lib/ranking/rank';

export const metadata: Metadata = { title: 'Hakkında' };

/**
 * Hakkinda: veri kaynaklari, lisans atiflari, siralama seffafligi ve
 * erisilebilirlik notlari (PROJECT_SPEC 9.6, 12.1, 8.3, 17.13).
 */
export default async function AboutPage() {
  const store = getStore();

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="nSosyal 5N hakkında"
        description="Bağlamsal sosyal keşif katmanı prototipi. Tüm içerik sentetik demo verisidir."
      />

      <InfoNote icon="beaker">
        Bu bir yarışma prototipidir. Profiller, kurumlar, projeler, etkinlikler ve gazete içerikleri
        tamamen kurgusaldır; gerçek bir kişiyi, kurumu veya olayı temsil etmez.
      </InfoNote>

      <Card className="p-4" id="5n">
        <h2 className="text-lg font-semibold">5N nedir?</h2>
        <p className="mt-2 text-fg-muted">
          5N bir gönderi formu değil, ortak bir veri ve keşif dilidir. Her içerik bütün boyutları doldurmak
          zorunda değildir: gündelik bir mizah gönderisi yalnızca konu ve topluluk bağlamı taşırken bir etkinlik
          Ne, Nerede ve Ne zaman boyutlarını birlikte kullanır.
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ['Ne', 'Konu, içerik türü, proje, ürün, hizmet, etkinlik, kaynak'],
            ['Nerede', 'İl, ilçe, kurum, mekân veya çevrim içi'],
            ['Ne zaman', 'Yayın zamanı, etkinlik zamanı, son başvuru, proje aşaması'],
            ['Nasıl', 'Yöntem, araç, öğrenme materyali, katılım biçimi'],
            ['Neden', 'Kişisel motivasyon, projeyi başlatan problem veya deneyim'],
            ['Kim', 'Kullanıcı, takım, kurum, topluluk: sosyal kimlik katmanı'],
          ].map(([term, description]) => (
            <div key={term} className="rounded-lg border border-line bg-bg-sunken p-3">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-sm text-fg-muted">{description}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4" id="siralama">
        <h2 className="text-lg font-semibold">Akış sıralaması nasıl çalışıyor?</h2>
        <p className="mt-2 text-fg-muted">
          Prototipte makine öğrenmesi modeli yerine açıklanabilir, ağırlıklı bir skor kullanılır. Böylece her
          kartın neden gösterildiği kullanıcıya yazılabilir ve ağırlıklar kullanıcı testleriyle
          değiştirilebilir. Aşağıdaki değerler demo başlangıç değerleridir, ürün gerçeği iddiası taşımaz.
        </p>

        {/* Tablo dar ekranda yatay kayar; kaydirilabilir alan klavyeyle de
            odaklanabilir olmali (WCAG 2.1.1). */}
        <div
          className="scroll-x mt-3"
          tabIndex={0}
          role="region"
          aria-label="Niyet moduna göre sıralama ağırlıkları tablosu"
        >
          <table className="w-full min-w-[540px] border-collapse text-sm">
            <caption className="sr-only">Niyet moduna göre sıralama ağırlıkları</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="py-2 pr-3">
                  Sinyal
                </th>
                <th scope="col" className="py-2 pr-3">
                  Temel
                </th>
                <th scope="col" className="py-2 pr-3">
                  Sosyalleş
                </th>
                <th scope="col" className="py-2 pr-3">
                  Keşfet
                </th>
                <th scope="col" className="py-2 pr-3">
                  Öğren
                </th>
                <th scope="col" className="py-2">
                  Üret
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['topicMatch', 'Konu uyumu'],
                  ['followedSource', 'Takip ettiğin kaynak'],
                  ['communityMatch', 'Topluluk uyumu'],
                  ['intentMatch', 'Niyet uyumu'],
                  ['recency', 'Tazelik'],
                  ['locationMatch', 'Konum uyumu'],
                  ['explorationBonus', 'Yeni sesler bonusu'],
                ] as Array<[keyof typeof BASE_WEIGHTS, string]>
              ).map(([key, label]) => (
                <tr key={key} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">
                    {label}
                  </th>
                  <td className="py-2 pr-3">{BASE_WEIGHTS[key].toFixed(2)}</td>
                  <td className="py-2 pr-3">{INTENT_WEIGHTS.sosyallesme[key].toFixed(2)}</td>
                  <td className="py-2 pr-3">{INTENT_WEIGHTS.kesfet[key].toFixed(2)}</td>
                  <td className="py-2 pr-3">{INTENT_WEIGHTS.ogren[key].toFixed(2)}</td>
                  <td className="py-2">{INTENT_WEIGHTS.uret[key].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3 text-sm">
          <strong>Sponsorlu içerik bu tabloda yok ve olmayacak.</strong> Sıralama modülü (
          <code>src/lib/ranking/rank.ts</code>) reklam, ödeme veya gazete kavramlarını hiç bilmez. Bunu bir
          birim testi ayrıca doğrular.
        </p>
      </Card>

      <Card className="p-4" id="gelir">
        <h2 className="text-lg font-semibold">Gelir modeli</h2>
        <p className="mt-2 text-fg-muted">
          Ücretli görünürlük yalnızca <Link href="/newspaper" className="underline">nGazete</Link> içinde satılır
          ve her ücretli kart zorunlu olarak “Sponsorlu” etiketi taşır. Kişisel akış sıralaması hiçbir ödemeyle
          değiştirilemez. Kod düzeyinde de bu ayrım korunur: gazete modülü ile sıralama modülü arasında
          bağımlılık yoktur.
        </p>

        <h3 className="mt-4 font-semibold">Fiyat nasıl hesaplanıyor?</h3>
        <p className="mt-1 text-fg-muted">
          Reklamveren bir “ilan türü” değil, gazetenin grid’inde belirli bir <strong>alan</strong> satın
          alır. Fiyat da oradan türer:
        </p>
        <p className="mt-2 rounded-lg bg-bg-sunken px-3 py-2 font-mono text-sm">
          fiyat = taban × alan × yerleşim × yayın sayısı × talep × abonelik indirimi
        </p>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>
            <strong className="text-fg">Alan:</strong> satın alınan {`width_px × height_px`} (veya eşdeğer
            grid alanı), 300×250 kutusu 1.0 kabul edilerek.
          </li>
          <li>
            <strong className="text-fg">Yerleşim:</strong> kapak, üst bölüm, bölüm içi veya alt bölüm
            görünürlüğü.
          </li>
          <li>
            <strong className="text-fg">Yayın sayısı:</strong> tek sayı ya da tekrar eden kampanya.
          </li>
          <li>
            <strong className="text-fg">Abonelik:</strong> tanımlı boyut, yerleşim ve sıklık hakkı verir;
            her sayıda sınırsız alan anlamına gelmez.
          </li>
        </ul>
        <p className="mt-2 text-sm text-fg-subtle">
          Gerçek tahsilat prototip kapsamı dışındadır. Başvuru anındaki fiyat bir anlık görüntü olarak
          saklanır: katsayılar sonradan değişse bile verilen teklif değişmez.
        </p>
      </Card>

      <Card className="p-4" id="veri">
        <h2 className="text-lg font-semibold">Veri kaynakları ve lisanslar</h2>
        <ul className="mt-2 space-y-2 text-sm text-fg-muted">
          <li>
            <strong className="text-fg">Harita sınırları:</strong> OpenStreetMap katkıda bulunanlar,{' '}
            <a
              href="https://opendatacommons.org/licenses/odbl/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ODbL
            </a>{' '}
            lisansı altında. İl sınırları OpenStreetMap’ten türetilmiş açık bir veri setinden, pilot il ilçe
            sınırları Nominatim üzerinden alınmıştır. Poligonlar okunabilirlik ve dosya boyutu için
            sadeleştirilmiştir; görsel keşif amaçlıdır, resmî idari sınır verisi değildir.
          </li>
          <li>
            <strong className="text-fg">Harita motoru:</strong> MapLibre GL JS. Prototipte hiçbir dış tile
            servisi kullanılmaz; tüm veri <code>public/geo</code> altından yerel olarak okunur.
          </li>
          <li>
            <strong className="text-fg">Demo medyası:</strong> Videolar ve görseller uygulama tarafından
            üretilmiş sentetik kliplerdir. Gerçek çekim veya üçüncü taraf içerik içermez.
          </li>
          <li>
            <strong className="text-fg">Demo verisi:</strong> {store.listProfiles().length} profil,{' '}
            {store.listCommunities().length} topluluk ve tüm içerikler kurgusaldır.
          </li>
        </ul>
      </Card>

      <Card className="p-4" id="erisilebilirlik">
        <h2 className="text-lg font-semibold">Erişilebilirlik</h2>
        <p className="mt-2 text-fg-muted">
          Hedef WCAG 2.2 AA prensiplerine mümkün olduğunca yaklaşmaktır. Uygulanan başlıca kararlar:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>• Tüm etkileşimli kontroller klavyeyle kullanılabilir; odak göstergesi gizlenmez.</li>
          <li>• Renk tek başına durum iletmez: seçili filtreler işaret, harita seçimi kalın kenarlık taşır.</li>
          <li>• Harita sonuçlarının klavyeyle kullanılabilen eşdeğer bir liste görünümü vardır.</li>
          <li>• Videolar için metin karşılığı (transkript) bulunur; otomatik oynatma yoktur.</li>
          <li>• Gazete kapağındaki bekleme, hareket azaltma tercihinde tamamen kaldırılır.</li>
          <li>• Form alanları etiketli, hata mesajları alanlarla ilişkilendirilmiştir.</li>
          <li>• Dokunma hedefleri en az 44 piksel yüksekliğindedir.</li>
        </ul>
        <p className="mt-3 text-sm text-fg-subtle">
          Otomatik test tek başına erişilebilirliği kanıtlamaz. Depodaki axe tabanlı testler yalnızca yaygın
          hataları yakalar; klavye sırası, odak yönetimi ve ekran okuyucu deneyimi elle de kontrol edilmiştir.
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold">Teknik</h2>
        <ul className="mt-2 space-y-1 text-sm text-fg-muted">
          <li>• Next.js App Router + TypeScript + Tailwind CSS</li>
          <li>• MapLibre GL JS, yerel GeoJSON</li>
          <li>• Vitest (birim), Playwright + axe-core (uçtan uca ve erişilebilirlik)</li>
          <li>
            • Veri katmanı: demo modunda bellek içi sentetik depo; üretim için Supabase Postgres şeması ve RLS
            politikaları <code>supabase/migrations</code> altında hazırdır.
          </li>
        </ul>
      </Card>
    </div>
  );
}
