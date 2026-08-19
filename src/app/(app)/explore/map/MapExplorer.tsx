'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import type { ProvinceMetric } from '@/components/map/TurkeyMap';

/**
 * Harita, MapLibre'i yalnizca tarayicida yukler. SSR sirasinda `window`
 * erisimi olmadigi icin bilesen client-only sinirda tutulur (PROJECT_SPEC 17.6).
 */
const TurkeyMap = dynamic(() => import('@/components/map/TurkeyMap').then((mod) => mod.TurkeyMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[52dvh] min-h-[320px] items-center justify-center rounded-[var(--radius-card)] border border-line bg-bg-sunken md:h-[60dvh]">
      <p className="text-sm text-fg-muted">Harita yükleniyor…</p>
    </div>
  ),
});

export function MapExplorer({
  metrics,
  selectedProvince,
  selectedDistrict,
  pilotProvinceCode,
}: {
  metrics: ProvinceMetric[];
  selectedProvince: string | null;
  selectedDistrict: string | null;
  pilotProvinceCode: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const push = useCallback(
    (next: URLSearchParams) => {
      router.push(`/explore/map?${next.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleProvince = useCallback(
    (code: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      // Il degistiginde onceki ilce secimi anlamini yitirir.
      next.delete('district');
      if (code) next.set('province', code);
      else next.delete('province');
      push(next);
    },
    [push, searchParams],
  );

  const handleDistrict = useCallback(
    (code: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (code) next.set('district', code);
      else next.delete('district');
      push(next);
    },
    [push, searchParams],
  );

  return (
    <TurkeyMap
      metrics={metrics}
      selectedProvince={selectedProvince}
      selectedDistrict={selectedDistrict}
      pilotProvinceCode={pilotProvinceCode}
      onSelectProvince={handleProvince}
      onSelectDistrict={handleDistrict}
    />
  );
}
