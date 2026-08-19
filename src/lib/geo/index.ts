import type { District, Province } from '@/types/domain';
import { DISTRICTS, PILOT_PROVINCE_CODE, PROVINCES } from './regions.generated';

export { DISTRICTS, PILOT_PROVINCE_CODE, PROVINCES };

const PROVINCE_BY_CODE = new Map(PROVINCES.map((p) => [p.code, p]));
const DISTRICT_BY_CODE = new Map(DISTRICTS.map((d) => [d.code, d]));

export function provinceByCode(code: string | null | undefined): Province | null {
  if (!code) return null;
  return PROVINCE_BY_CODE.get(code) ?? null;
}

export function districtByCode(code: string | null | undefined): District | null {
  if (!code) return null;
  return DISTRICT_BY_CODE.get(code) ?? null;
}

export function provinceName(code: string | null | undefined): string | null {
  return provinceByCode(code)?.name ?? null;
}

export function districtName(code: string | null | undefined): string | null {
  return districtByCode(code)?.name ?? null;
}

export function districtsOfProvince(provinceCode: string): District[] {
  return DISTRICTS.filter((district) => district.provinceCode === provinceCode);
}

/** Pilot il disinda ilce verisi yoktur; arayuz bunu kullaniciya acikca soyler. */
export function hasDistrictData(provinceCode: string | null | undefined): boolean {
  return provinceCode === PILOT_PROVINCE_CODE;
}

/** Insan okunur konum etiketi. Konum yoksa null doner - "gizli" yazmayiz. */
export function locationLabel(
  provinceCode: string | null | undefined,
  districtCode?: string | null,
): string | null {
  const province = provinceName(provinceCode);
  if (!province) return null;
  const district = districtName(districtCode);
  return district ? `${province} / ${district}` : province;
}

/** Türkiye geneli harita baslangic gorunumu. */
export const TURKEY_BOUNDS: [[number, number], [number, number]] = [
  [25.5, 35.5],
  [45.0, 42.5],
];
