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
 * - Dolgular nufus gibi bir metrigi temsil etmez; yalnizca sonuc var/yok ve
 *   hover/secili durumlarini gosterir.
 * - Harita klavye kullanicilari icin tek basina yeterli degildir; sayfadaki
 *   liste gorunumu ayni sonuclari erisilebilir bicimde sunar (8.3).
 * - Bireysel kullanicilar hicbir zaman kesin koordinatla gosterilmez (11.1).
 */

export interface ProvinceMetric {
  code: string;
  name: string;
  total: number;
}

export function TurkeyMap({
  metrics,
  selectedProvince,
  selectedDistrict,
  pilotProvinceCode,
  onSelectProvince,
  onSelectDistrict,
}: {
  metrics: ProvinceMetric[];
  selectedProvince: string | null;
  selectedDistrict: string | null;
  pilotProvinceCode: string;
  onSelectProvince: (code: string | null) => void;
  onSelectDistrict: (code: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [districtsLoaded, setDistrictsLoaded] = useState(false);

  // Callback'ler her renderda degisebilir; harita olaylari icin sabit referans tutuyoruz.
  const selectProvinceRef = useRef(onSelectProvince);
  const selectDistrictRef = useRef(onSelectDistrict);
  selectProvinceRef.current = onSelectProvince;
  selectDistrictRef.current = onSelectDistrict;

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
      center: [35.2, 39.0],
      zoom: 4.6,
      minZoom: 3.6,
      maxZoom: 9,
      attributionControl: false,
      // Kucuk ekranlarda sayfa kaydirmayi engellememesi icin.
      cooperativeGestures: true,
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
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#35b8a9',
              ['boolean', ['feature-state', 'hover'], false],
              '#2d6a7f',
              ['>', ['coalesce', ['feature-state', 'total'], 0], 0],
              '#1f3f66',
              '#16294a',
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
              '#eafaf7',
              '#3a5480',
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

    const setHover = (code: string | null) => {
      if (hovered && hovered !== code) {
        map.setFeatureState({ source: 'provinces', id: hovered }, { hover: false });
      }
      hovered = code;
      if (code) map.setFeatureState({ source: 'provinces', id: code }, { hover: true });
    };

    map.on('mousemove', 'province-fill', (event) => {
      const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
      const code = feature?.properties?.code as string | undefined;
      map.getCanvas().style.cursor = 'pointer';
      setHover(code ?? null);
    });

    map.on('mouseleave', 'province-fill', () => {
      map.getCanvas().style.cursor = '';
      setHover(null);
    });

    map.on('click', 'province-fill', (event) => {
      const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
      const code = feature?.properties?.code as string | undefined;
      if (code) selectProvinceRef.current(code);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sonuc sayilarini feature-state olarak isle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const metric of metrics) {
      map.setFeatureState({ source: 'provinces', id: metric.code }, { total: metric.total });
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
      map.easeTo({ center: [35.2, 39.0], zoom: 4.6, duration: 600 });
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

    const shouldShow = selectedProvince === pilotProvinceCode;

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
        const response = await fetch('/geo/izmir-districts.geojson');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const districts = await response.json();
        if (cancelled || !mapRef.current) return;

        map.addSource('districts', { type: 'geojson', data: districts, promoteId: 'code' });
        map.addLayer({
          id: 'district-fill',
          type: 'fill',
          source: 'districts',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#ffb54a',
              ['boolean', ['feature-state', 'hover'], false],
              '#66d2c4',
              '#189b8d',
            ],
            'fill-opacity': 0.85,
          },
        });
        map.addLayer({
          id: 'district-line',
          type: 'line',
          source: 'districts',
          paint: {
            'line-color': '#eafaf7',
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
  }, [selectedProvince, pilotProvinceCode, ready]);

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

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line">
      <div
        ref={containerRef}
        className="h-[52dvh] min-h-[320px] w-full bg-ink-950 md:h-[60dvh]"
        // Harita gorsel bir yardimcidir; ayni sonuclar sayfadaki listede de var.
        role="img"
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

      {selectedProvince === pilotProvinceCode ? (
        <p className="absolute bottom-2 left-2 rounded-lg bg-ink-950/85 px-2.5 py-1.5 text-xs text-white">
          İlçe katmanı açık · pilot il
        </p>
      ) : null}
    </div>
  );
}
