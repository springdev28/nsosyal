'use client';

import maplibregl, { type MapGeoJSONFeature } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Turkiye il/ilce kesif haritasi (PROJECT_SPEC 7.4 / 17.6).
 *
 * Tasarim kararlari:
 * - Arka planda hicbir tile servisi kullanilmaz. Stil tamamen yerel: bir arka
 *   plan rengi + public/geo altindaki GeoJSON katmanlari. Boylece harita
 *   internet olmadan da acilir (PROJECT_SPEC 15.4).
 * - Dolgu, secili konu ve varlik turunun il bazindaki YOGUNLUGUNU tasir
 *   (spec 17.18/6-7). Olcek tek renklidir: nSosyal mavi/cyan ailesinde koyudan
 *   aciga giden bes duraklik sirali bir skala, yaninda dusuk-yuksek legend.
 *   Yogunluk nufus ya da canli kisi konumu degil, secili platform
 *   varliklarinin bolgesel dagilimidir.
 * - Secili il yalnizca renkle degil kalin kenarlikla da isaretlenir; hover ve
 *   secim degerleri okunur metin olarak da yazilir.
 * - Harita klavye kullanicilari icin tek basina yeterli degildir; sayfadaki
 *   liste gorunumu ayni sonuclari erisilebilir bicimde sunar (8.3).
 * - Bireysel kullanicilar hicbir zaman kesin koordinatla gosterilmez (11.1).
 */

export interface ProvinceMetric {
  code: string;
  name: string;
  total: number;
  /** Ipucu balonundaki tur kirilimi. Toplam tek basina "neyin" yogun oldugunu soylemiyordu. */
  communities: number;
  events: number;
  projects: number;
  posts: number;
  organizations: number;
  people: number;
}

/**
 * Yogunluk skalasi. Tek renk ailesi (mavi -> camgobegi), sirali, bes durak.
 * Harita dolgusu ve legend ayni diziyi okur; ikisi elle senkronlanmaz.
 */
const DENSITY_STOPS = [
  { at: 0, color: '#101b2c' },
  { at: 0.15, color: '#163553' },
  { at: 0.4, color: '#1c5580' },
  { at: 0.7, color: '#2a80b4' },
  { at: 1, color: '#45c8e0' },
] as const;

const SELECTED_FILL = '#7fe4f0';
const HOVER_FILL = '#5cc4e8';

/**
 * Turkiye'nin kabaca kapsama kutusu.
 *
 * Onceki surum sabit bir merkez ve zoom (4.6) kullaniyordu. Zoom, kapsayicinin
 * boyutundan bagimsiz oldugu icin harita hicbir ekrana tam oturmuyordu: genis
 * masaustunde iki yanda bosluk kaliyor, dar kolonda ise dogu ve bati kirpiliyordu.
 * `fitBounds` kapsayiciyi olcup zoom'u kendisi secer.
 */
const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [25.5, 35.6],
  [45.0, 42.4],
];

const FIT_PADDING = { top: 24, bottom: 56, left: 24, right: 24 };

const LEGEND_GRADIENT = `linear-gradient(90deg, ${DENSITY_STOPS.map(
  ({ at, color }) => `${color} ${Math.round(at * 100)}%`,
).join(', ')})`;

export function TurkeyMap({
  metrics,
  selectedProvince,
  selectedDistrict,
  districtDataProvinces,
  onSelectProvince,
  onSelectDistrict,
}: {
  metrics: ProvinceMetric[];
  selectedProvince: string | null;
  selectedDistrict: string | null;
  districtDataProvinces: readonly string[];
  onSelectProvince: (code: string | null) => void;
  onSelectDistrict: (code: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [districtsLoaded, setDistrictsLoaded] = useState(false);
  // Hover/secim degerini metin olarak da yaziyoruz: harita tek basina yeterli degil.
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Callback'ler her renderda degisebilir; harita olaylari icin sabit referans tutuyoruz.
  const selectProvinceRef = useRef(onSelectProvince);
  const selectDistrictRef = useRef(onSelectDistrict);
  selectProvinceRef.current = onSelectProvince;
  selectDistrictRef.current = onSelectDistrict;
  // Ipucu balonu harita olaylarindan okunur; olaylar bir kez baglandigi icin
  // guncel metrikleri bir ref uzerinden gorurler.
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;
  const selectedProvinceRef = useRef(selectedProvince);
  selectedProvinceRef.current = selectedProvince;
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Tamamen yerel stil: dis servis yok. `glyphs` tanimlanmaz cunku hicbir
      // katman metin etiketi cizmiyor; tanimlamak uzak bir font sunucusu
      // gerektirirdi ve demoyu internete baglardi.
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'arka-plan', type: 'background', paint: { 'background-color': '#0b1b34' } }],
      },
      bounds: TURKEY_BOUNDS,
      fitBoundsOptions: { padding: FIT_PADDING },
      minZoom: 3,
      maxZoom: 9,
      attributionControl: false,
      // Kucuk ekranlarda sayfa kaydirmayi engellememesi icin.
      cooperativeGestures: true,
      // MapLibre'in kendi denetimleri varsayilan olarak Ingilizce seslendirilir;
      // arayuzun tamami Turkce oldugu icin ekran okuyucu metinlerini ceviriyoruz.
      locale: {
        'Map.Title': 'Etkileşimli harita',
        'NavigationControl.ZoomIn': 'Yakınlaştır',
        'NavigationControl.ZoomOut': 'Uzaklaştır',
        'AttributionControl.ToggleAttribution': 'Veri kaynağını göster',
        'AttributionControl.MapFeedback': 'Harita geri bildirimi',
        'CooperativeGesturesHandler.WindowsHelpText':
          'Yakınlaştırmak için Ctrl tuşuyla birlikte kaydır.',
        'CooperativeGesturesHandler.MacHelpText':
          'Yakınlaştırmak için ⌘ tuşuyla birlikte kaydır.',
        'CooperativeGesturesHandler.MobileHelpText': 'Haritayı iki parmakla hareket ettir.',
      },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap katkıda bulunanlar (ODbL)',
      }),
      'bottom-right',
    );

    map.on('load', async () => {
      try {
        const response = await fetch('/geo/turkey-provinces.geojson');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const provinces = await response.json();

        map.addSource('provinces', { type: 'geojson', data: provinces, promoteId: 'code' });

        map.addLayer({
          id: 'province-fill',
          type: 'fill',
          source: 'provinces',
          paint: {
            // Tek renkli sirali skala: yogunluk arttikca koyu laciverten
            // nSosyal camgobegine gider. Ara duraklar DENSITY_STOPS ile
            // paylasilir, boylece legend ile harita asla ayrisamaz.
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              SELECTED_FILL,
              ['boolean', ['feature-state', 'hover'], false],
              HOVER_FILL,
              [
                'interpolate',
                ['linear'],
                ['coalesce', ['feature-state', 'density'], 0],
                ...DENSITY_STOPS.flatMap(({ at, color }) => [at, color]),
              ],
            ],
            'fill-opacity': 0.92,
          },
        });

        map.addLayer({
          id: 'province-line',
          type: 'line',
          source: 'provinces',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#eaf7ff',
              '#33507a',
            ],
            // Secili il yalnizca renkle degil, kalin kenarlikla da belirtilir.
            'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.6, 0.6],
          },
        });

        setReady(true);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Harita verisi yüklenemedi');
      }
    });

    let hovered: string | null = null;

    /*
     * Ipucu balonu. Onceki surumde imlecin altinda hicbir sey yoktu; tek geri
     * bildirim legend kosesindeki kucuk satirdi, yani kullanici bir ile bakip
     * gozunu koseye kaydirmak zorundaydi. Balon ilin adini ve TUR KIRILIMINI
     * gosterir: toplam tek basina neyin yogun oldugunu soylemiyor.
     */
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'ns-map-popup',
    });
    popupRef.current = popup;

    const tooltipHtml = (code: string) => {
      const metric = metricsRef.current.find((entry) => entry.code === code);
      if (!metric) return '';
      const rows: Array<[string, number]> = [
        ['Topluluk', metric.communities],
        ['Etkinlik', metric.events],
        ['Proje', metric.projects],
        ['Paylaşım', metric.posts],
        ['Kurum', metric.organizations],
        ['Kişi', metric.people],
      ];
      const filled = rows.filter(([, value]) => value > 0);
      const escape = (text: string) =>
        text.replace(/[&<>"]/g, (ch) =>
          ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;',
        );

      const body = filled.length
        ? filled
            .map(
              ([label, value]) =>
                `<span class="ns-map-popup__row"><span>${label}</span><b>${value.toLocaleString('tr-TR')}</b></span>`,
            )
            .join('')
        : '<span class="ns-map-popup__empty">Bu filtrede sonuç yok</span>';

      return `<strong class="ns-map-popup__title">${escape(metric.name)}</strong><span class="ns-map-popup__total">${metric.total.toLocaleString('tr-TR')} sonuç</span><span class="ns-map-popup__grid">${body}</span>`;
    };

    const setHover = (code: string | null) => {
      if (hovered && hovered !== code) {
        map.setFeatureState({ source: 'provinces', id: hovered }, { hover: false });
      }
      hovered = code;
      if (code) map.setFeatureState({ source: 'provinces', id: code }, { hover: true });
      setHoveredProvince(code);
    };

    map.on('mousemove', 'province-fill', (event) => {
      const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
      const code = feature?.properties?.code as string | undefined;
      map.getCanvas().style.cursor = 'pointer';
      setHover(code ?? null);
      if (code) popup.setLngLat(event.lngLat).setHTML(tooltipHtml(code)).addTo(map);
      else popup.remove();
    });

    map.on('mouseleave', 'province-fill', () => {
      map.getCanvas().style.cursor = '';
      setHover(null);
      popup.remove();
    });

    map.on('click', 'province-fill', (event) => {
      const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
      const code = feature?.properties?.code as string | undefined;
      if (code) selectProvinceRef.current(code);
    });

    /*
     * Kapsayici boyu degistiginde (kenar cubugunun acilmasi, ekran donmesi,
     * pencere yeniden boyutlandirma) MapLibre kendiliginden yeniden olcmez ve
     * harita ya kirpilir ya da tuvalin bir kismi bos kalir. Secim yokken
     * yeniden oturtuyoruz; secim varken kullanicinin kadrajini bozmuyoruz.
     */
    const observer = new ResizeObserver(() => {
      map.resize();
      if (!selectedProvinceRef.current) {
        map.fitBounds(TURKEY_BOUNDS, { padding: FIT_PADDING, duration: 0 });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      popup.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sonuc sayilarini ve normalize edilmis yogunlugu feature-state olarak isle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // Normalizasyon en yuksek ile deger uzerinden; boylece skala her filtrede
    // kendi araligina oturur ve az sonuclu bir secimde harita bos gorunmez.
    const max = metrics.reduce((peak, metric) => Math.max(peak, metric.total), 0);
    for (const metric of metrics) {
      map.setFeatureState(
        { source: 'provinces', id: metric.code },
        { total: metric.total, density: max > 0 ? metric.total / max : 0 },
      );
    }
  }, [metrics, ready]);

  // Secili il vurgusu ve odaklama.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    for (const metric of metrics) {
      map.setFeatureState(
        { source: 'provinces', id: metric.code },
        { selected: metric.code === selectedProvince },
      );
    }

    if (!selectedProvince) {
      map.fitBounds(TURKEY_BOUNDS, { padding: FIT_PADDING, duration: 600 });
      return;
    }

    const source = map.getSource('provinces') as maplibregl.GeoJSONSource | undefined;
    const data = source?._data as GeoJSON.FeatureCollection | undefined;
    const feature = data?.features.find((entry) => entry.properties?.code === selectedProvince);
    const bbox = feature?.properties?.bbox as [number, number, number, number] | undefined;
    if (bbox) {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 48, duration: 700, maxZoom: 8 },
      );
    }
  }, [selectedProvince, metrics, ready]);

  // Pilot il secildiginde ilce katmanini ekle, birakildiginda kaldir.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const shouldShow = selectedProvince !== null && districtDataProvinces.includes(selectedProvince);

    if (!shouldShow) {
      if (map.getLayer('district-line')) map.removeLayer('district-line');
      if (map.getLayer('district-fill')) map.removeLayer('district-fill');
      if (map.getSource('districts')) map.removeSource('districts');
      setDistrictsLoaded(false);
      return;
    }

    if (map.getSource('districts')) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/geo/districts-${selectedProvince}.geojson`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const districts = await response.json();
        if (cancelled || !mapRef.current) return;

        map.addSource('districts', { type: 'geojson', data: districts, promoteId: 'code' });
        map.addLayer({
          id: 'district-fill',
          type: 'fill',
          source: 'districts',
          paint: {
            // Ilce katmani da ayni mavi/cyan ailesinde kalir.
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              SELECTED_FILL,
              ['boolean', ['feature-state', 'hover'], false],
              HOVER_FILL,
              '#1c5580',
            ],
            'fill-opacity': 0.85,
          },
        });
        map.addLayer({
          id: 'district-line',
          type: 'line',
          source: 'districts',
          paint: {
            'line-color': '#eaf7ff',
            'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.4, 0.7],
          },
        });
        setDistrictsLoaded(true);

        map.on('click', 'district-fill', (event) => {
          const code = (event.features?.[0] as MapGeoJSONFeature | undefined)?.properties?.code as
            | string
            | undefined;
          if (code) selectDistrictRef.current(code);
        });
        map.on('mouseenter', 'district-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'İlçe verisi yüklenemedi');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProvince, districtDataProvinces, ready]);

  // Secili ilce vurgusu.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !districtsLoaded) return;
    const source = map.getSource('districts') as maplibregl.GeoJSONSource | undefined;
    const data = source?._data as GeoJSON.FeatureCollection | undefined;
    for (const feature of data?.features ?? []) {
      const code = feature.properties?.code as string;
      map.setFeatureState({ source: 'districts', id: code }, { selected: code === selectedDistrict });
    }
  }, [selectedDistrict, districtsLoaded]);

  // Hover varsa onu, yoksa secili ili yaz. Ayni sayi listede de var; bu yalnizca
  // haritanin uzerinde dururken baglami kaybetmemek icin.
  const readoutCode = hoveredProvince ?? selectedProvince;
  const readout = readoutCode ? (metrics.find((m) => m.code === readoutCode) ?? null) : null;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line">
      <div
        ref={containerRef}
        className="h-[52dvh] min-h-[320px] w-full bg-ink-950 md:h-[60dvh]"
        // Harita gorsel bir yardimcidir; ayni sonuclar sayfadaki listede de var.
        // Rol "img" degil "group": MapLibre kendi tuvalini, yakinlastirma
        // dugmelerini ve kaynak baglantisini bu kutunun icine ekliyor; bir img
        // odaklanabilir cocuk barindiramaz (WCAG 4.1.2 / axe nested-interactive).
        role="group"
        aria-label={
          selectedProvince
            ? `Türkiye haritası, ${metrics.find((m) => m.code === selectedProvince)?.name ?? ''} seçili. Aynı sonuçlar aşağıdaki listede de yer alıyor.`
            : 'Türkiye il haritası. Bir il seçmek için haritaya tıklayabilir veya aşağıdaki listeyi kullanabilirsin.'
        }
      />

      {error ? (
        <p
          role="alert"
          className="absolute inset-x-3 top-3 rounded-lg border border-danger/40 bg-bg-raised px-3 py-2 text-sm text-danger"
        >
          Harita yüklenemedi ({error}). Aşağıdaki liste görünümünden keşfetmeye devam edebilirsin.
        </p>
      ) : null}

      {/* Legend: yogunlugun ne demek oldugunu skalanin kendisiyle soyler. */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-ink-950/85 px-2.5 py-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-white/70">
          Seçili filtrede yoğunluk
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[0.65rem] text-white/70">Düşük</span>
          <span
            aria-hidden="true"
            className="h-2 w-24 rounded-full ring-1 ring-white/25"
            style={{ background: LEGEND_GRADIENT }}
          />
          <span className="text-[0.65rem] text-white/70">Yüksek</span>
        </div>
        {readout ? (
          <p className="mt-1.5 text-xs font-medium text-white">
            {readout.name} · {readout.total.toLocaleString('tr-TR')} sonuç
          </p>
        ) : null}
        {districtsLoaded ? (
          <p className="mt-1 text-[0.65rem] text-white/70">İlçe katmanı açık</p>
        ) : null}
      </div>
    </div>
  );
}
