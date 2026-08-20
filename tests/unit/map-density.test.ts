import { describe, expect, it } from 'vitest';

import { getStore } from '@/lib/data/store';
import { PROVINCES } from '@/lib/geo';

/**
 * Nerede haritasinin yogunluk verisi (PROJECT_SPEC 7.4 / 17.18-6).
 *
 * Bu dosya bir gorsel hatanin geri gelmesini engeller. Harita kodu bastan
 * beri dogruydu: choropleth, tek renkli skala, legend, hover, secim - hepsi
 * yerindeydi. Eksik olan VERIYDI. Elle yazilmis demo icerigi yalnizca uc ile
 * baglanmisti, dolayisiyla 81 ilin 78'i ayni koyu renkte ciziliyordu.
 * Kullanicinin gordugu sey "yogunluk gostermeyen bir yogunluk haritasi"ydi.
 *
 * Asagidaki olcumler haritanin GORSEL olarak bir sey soyledigini dogrular:
 * yeterli il dolu mu, degerler gercekten degisiyor mu, skala duz mu.
 */
describe('Nerede yogunluk verisi', () => {
  const store = getStore();
  const summaries = store.getProvinceSummaries();
  const withContent = summaries.filter((province) => province.total > 0);

  it('yurt genelinde yayilir, uc ile sikismaz', () => {
    // Platform Turkiye genelidir; Izmir yalnizca ilce verisi bulunan ildir.
    expect(withContent.length).toBeGreaterThanOrEqual(60);
    expect(summaries.length).toBe(PROVINCES.length);
  });

  it('choropleth okunacak bir degisim tasir', () => {
    const totals = withContent.map((province) => province.total);
    const max = Math.max(...totals);
    const min = Math.min(...totals);

    // Duz bir harita ise skala bir sey anlatmiyordur.
    expect(max).toBeGreaterThan(min);
    // En yogun il en seyrekten belirgin sekilde ayrilmali; aksi halde bes
    // duraklik skala tek bir tona sikisir.
    expect(max / Math.max(1, min)).toBeGreaterThan(4);

    // Skalanin ara duraklari da kullanilmali: yalnizca "cok" ve "az" iki
    // kumeye bolunmus bir harita yogunluk degil ikili durum gosterir.
    const buckets = new Set(totals.map((total) => Math.round((total / max) * 4)));
    expect(buckets.size).toBeGreaterThanOrEqual(4);
  });

  it('her il ozeti tur kirilimini de tasir', () => {
    const busiest = [...withContent].sort((a, b) => b.total - a.total)[0];
    expect(busiest.communities + busiest.events + busiest.projects).toBeGreaterThan(0);
    expect(busiest.name.length).toBeGreaterThan(0);
  });

  it('sentetik bolgesel icerik demo olarak isaretlidir', () => {
    // Urun degismezi 7: demo verisi sentetiktir ve oyle etiketlenir.
    const regional = store
      .listCommunities({})
      .filter((community) => community.slug.startsWith('bolge-'));

    expect(regional.length).toBeGreaterThan(0);
    for (const community of regional) {
      expect(community.description).toContain('Sentetik demo');
    }
  });
});
