'use client';

import { useActionState, useMemo, useState } from 'react';

import { updateSettings, type SettingsState } from '@/actions/auth';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import { GOALS } from '@/lib/personalization/goals';
import type { District, GoalKey, IntentMode, LocationVisibility, Province } from '@/types/domain';

const LOCATION_OPTIONS: Array<{ value: LocationVisibility; label: string; description: string }> = [
  { value: 'hidden', label: 'Paylaşmıyorum', description: 'Haritayı yine kullanabilirsin.' },
  { value: 'province', label: 'Yalnızca il', description: 'Şehir düzeyinde yerel öneriler.' },
  { value: 'district', label: 'İl ve ilçe', description: 'En isabetli yerel keşif.' },
  { value: 'online_only', label: 'Yalnızca çevrim içi', description: 'Fiziksel konum kullanılmaz.' },
];

const INTENTS: Array<{ value: IntentMode; label: string }> = [
  { value: 'sosyallesme', label: 'Sosyalleş' },
  { value: 'kesfet', label: 'Keşfet' },
  { value: 'ogren', label: 'Öğren' },
  { value: 'uret', label: 'Üret' },
];

/** Ayarlar (PROJECT_SPEC 6.1 ekran 22): gizlilik, konum, erisilebilirlik, gazete. */
export function SettingsForm({
  provinces,
  districts,
  districtDataProvinces,
  initial,
}: {
  provinces: Province[];
  districts: District[];
  districtDataProvinces: readonly string[];
  initial: {
    bio: string;
    intentMode: IntentMode | null;
    goalKeys: GoalKey[];
    locationVisibility: LocationVisibility;
    provinceCode: string | null;
    districtCode: string | null;
    reducedMotion: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(updateSettings, {});
  const [visibility, setVisibility] = useState<LocationVisibility>(initial.locationVisibility);
  const [provinceCode, setProvinceCode] = useState(initial.provinceCode ?? '');

  const districtsForProvince = useMemo(
    () => districts.filter((district) => district.provinceCode === provinceCode),
    [districts, provinceCode],
  );

  const needsProvince = visibility === 'province' || visibility === 'district';

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state.message ? (
        <p
          role="status"
          className="rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm text-success"
        >
          {state.message}
        </p>
      ) : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">Profil</h2>
        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">
            Kısa tanıtım
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={240}
            defaultValue={initial.bio}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="intentMode" className="mb-1 block text-sm font-medium">
            Varsayılan akış modu
          </label>
          <select
            id="intentMode"
            name="intentMode"
            defaultValue={initial.intentMode ?? ''}
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3 sm:max-w-xs"
          >
            {/* Spec 7.10: hicbir mod secmeden de kisisellestirilmis akis kullanilabilir. */}
            <option value="">Mod seçme, amaçlarıma göre kişiselleştir</option>
            {INTENTS.map((intent) => (
              <option key={intent.value} value={intent.value}>
                {intent.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-fg-subtle">
            Anlık moddur; aşağıdaki amaçlarını değiştirmez.
          </p>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">Platform amaçların</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            Birden fazla seçebilirsin. Akış sıralaman bunlara göre kurulur.
          </p>
        </div>

        <fieldset>
          <legend className="sr-only">Platform amaçları</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => (
              <li key={goal.key}>
                <label className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-bg-raised p-3 transition-colors hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input
                    type="checkbox"
                    name="goalKeys"
                    value={goal.key}
                    defaultChecked={initial.goalKeys.includes(goal.key)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{goal.label}</span>
                    <span className="block text-xs text-fg-subtle">{goal.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">Konum ve gizlilik</h2>

        <InfoNote icon="lock">
          Kesin adres ve canlı konum hiçbir zaman toplanmaz. Haritada bireysel kullanıcılar koordinatla
          gösterilmez. Konumunu istediğin an kaldırabilirsin.
        </InfoNote>

        <fieldset>
          <legend className="sr-only">Konum görünürlüğü</legend>
          <div className="space-y-2">
            {LOCATION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                  visibility === option.value
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-bg-raised hover:border-line-strong'
                }`}
              >
                <input
                  type="radio"
                  name="locationVisibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="mt-1 h-5 w-5 accent-[var(--accent)]"
                />
                <span>
                  <span className="font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-sm text-fg-muted">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {needsProvince ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="provinceCode" className="mb-1 block text-sm font-medium">
                İl
              </label>
              <select
                id="provinceCode"
                name="provinceCode"
                value={provinceCode}
                onChange={(event) => setProvinceCode(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
              >
                <option value="">Seç…</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {visibility === 'district' ? (
              <div>
                <label htmlFor="districtCode" className="mb-1 block text-sm font-medium">
                  İlçe
                </label>
                <select
                  id="districtCode"
                  name="districtCode"
                  defaultValue={initial.districtCode ?? ''}
                  disabled={districtsForProvince.length === 0}
                  className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
                >
                  <option value="">Seç…</option>
                  {districtsForProvince.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {provinceCode && !districtDataProvinces.includes(provinceCode) ? (
                  <p className="mt-1 text-xs text-fg-subtle">
                    Bu il için ilçe sınırı henüz yüklü değil; il düzeyinde kalabilirsin.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">Erişilebilirlik ve gazete</h2>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="reducedMotion"
            defaultChecked={initial.reducedMotion}
            className="mt-1 h-5 w-5 accent-[var(--accent)]"
          />
          <span>
            <span className="font-medium">Hareketi ve bekleme sürelerini azalt</span>
            <span className="mt-0.5 block text-sm text-fg-muted">
              Açıkken gazete kapağındaki 3 saniyelik kapatma beklemesi uygulanmaz ve animasyonlar azaltılır.
              Sistemindeki “hareketi azalt” tercihi de aynı etkiyi yapar.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="newspaperAutoOpen" className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span>
            <span className="font-medium">Günün gazetesini bir daha göster</span>
            <span className="mt-0.5 block text-sm text-fg-muted">
              Bugünün sayısını kapattıysan bir sonraki sayfa geçişinde tekrar açılır.
            </span>
          </span>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Ayarları kaydet'}
        </Button>
      </div>
    </form>
  );
}
