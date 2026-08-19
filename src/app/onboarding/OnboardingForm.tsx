'use client';

import { useActionState, useMemo, useState } from 'react';

import { completeOnboarding, type OnboardingState } from '@/actions/auth';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import type { District, IntentMode, LocationVisibility, Province, Topic } from '@/types/domain';

/**
 * Onboarding akisi (PROJECT_SPEC 17.4).
 *
 * Tasarim kararlari:
 * - Butun adimlar tek bir <form> icinde durur ve gizlenirken DOM'dan
 *   kaldirilmaz; boylece geri/ileri gezinme hicbir veriyi kaybetmez.
 * - Konum adimi hicbir zaman zorlayici gorunmez, faydasi acikca anlatilir.
 * - Her adim klavye ile tamamen kullanilabilir, hatalar alanlarla iliskilidir.
 */

const STEPS = ['İlgi alanları', 'Konum', 'Niyet', 'Profil'] as const;

const INTENT_OPTIONS: Array<{ value: IntentMode; label: string; description: string; icon: string }> = [
  {
    value: 'sosyallesme',
    label: 'Sosyalleş',
    description: 'Takip ettiklerin, topluluk sohbetleri, mizah ve gündelik paylaşımlar öne çıkar.',
    icon: '💬',
  },
  {
    value: 'kesfet',
    label: 'Keşfet',
    description: 'Yeni hesaplar, yeni topluluklar, kısa videolar ve yerel içerik çeşitliliği artar.',
    icon: '🧭',
  },
  {
    value: 'ogren',
    label: 'Öğren',
    description: 'Nasıl kaynakları, açıklayıcı içerikler ve soru-cevap öne çıkar.',
    icon: '📚',
  },
  {
    value: 'uret',
    label: 'Üret',
    description: 'Projeler, ilerleme günlükleri, geri bildirim çağrıları ve etkinlikler öne çıkar.',
    icon: '🛠️',
  },
];

const LOCATION_OPTIONS: Array<{ value: LocationVisibility; label: string; description: string }> = [
  {
    value: 'hidden',
    label: 'Konum paylaşmıyorum',
    description: 'Haritayı yine de kullanabilirsin; sadece yerel kişi sonuçlarında görünmezsin.',
  },
  {
    value: 'province',
    label: 'Yalnızca il',
    description: 'Şehrindeki topluluk, kurum ve etkinlik önerileri güçlenir.',
  },
  {
    value: 'district',
    label: 'İl ve ilçe',
    description: 'Yürüme mesafesindeki etkinlikleri ve yerel toplulukları daha isabetli görürsün.',
  },
  {
    value: 'online_only',
    label: 'Yalnızca çevrim içi',
    description: 'Fiziksel konum yerine çevrim içi topluluk ve etkinlikler öne çıkar.',
  },
];

export function OnboardingForm({
  topics,
  provinces,
  districts,
  districtDataProvinces,
  defaultUsername,
  defaultBio,
}: {
  topics: Topic[];
  provinces: Province[];
  districts: District[];
  districtDataProvinces: readonly string[];
  defaultUsername: string;
  defaultBio: string;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, {});
  const [step, setStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<LocationVisibility>('hidden');
  const [provinceCode, setProvinceCode] = useState('');

  const districtsForProvince = useMemo(
    () => districts.filter((district) => district.provinceCode === provinceCode),
    [districts, provinceCode],
  );

  const needsProvince = visibility === 'province' || visibility === 'district';
  const canContinue =
    step === 0
      ? selectedTopics.length >= 3
      : step === 1
        ? !needsProvince || Boolean(provinceCode)
        : true;

  function toggleTopic(id: string) {
    setSelectedTopics((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <ol className="flex items-center gap-2" aria-label="Onboarding adımları">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1">
            <span
              aria-hidden="true"
              className={`h-1.5 rounded-full ${index <= step ? 'bg-accent' : 'bg-bg-sunken'}`}
            />
            <span className={`text-xs ${index === step ? 'font-semibold text-accent' : 'text-fg-subtle'}`}>
              {index + 1}. {label}
              {index === step ? <span className="sr-only"> (bulunduğun adım)</span> : null}
            </span>
          </li>
        ))}
      </ol>

      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}

      {/* --- 1. İlgi alanları --- */}
      <Card className={`p-4 ${step === 0 ? '' : 'hidden'}`}>
        <fieldset>
          <legend className="text-lg font-semibold">Neyle ilgileniyorsun?</legend>
          <p className="mt-1 text-sm text-fg-muted">
            En az 3 alan seç. Bunlar akışını ve önerilen toplulukları belirler, istediğin zaman
            değiştirebilirsin.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {topics.map((topic) => {
              const checked = selectedTopics.includes(topic.id);
              return (
                <label
                  key={topic.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    checked ? 'border-accent bg-accent-soft' : 'border-line bg-bg-raised hover:border-line-strong'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="topics"
                    value={topic.id}
                    checked={checked}
                    onChange={() => toggleTopic(topic.id)}
                    className="mt-1 h-5 w-5 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-medium">
                      
                      {topic.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-fg-muted">{topic.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <p className="mt-3 text-sm" aria-live="polite">
            {selectedTopics.length < 3
              ? `${3 - selectedTopics.length} alan daha seç.`
              : `${selectedTopics.length} alan seçtin.`}
          </p>
        </fieldset>
      </Card>

      {/* --- 2. Konum --- */}
      <Card className={`p-4 ${step === 1 ? '' : 'hidden'}`}>
        <fieldset>
          <legend className="text-lg font-semibold">Konum paylaşmak ister misin?</legend>
          <p className="mt-1 text-sm text-fg-muted">
            Tamamen isteğe bağlı. Paylaşmasan da haritayı ve tüm keşif özelliklerini kullanabilirsin.
          </p>

          <div className="mt-4 space-y-2">
            {LOCATION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
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

          {needsProvince ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                    className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
                    disabled={districtsForProvince.length === 0}
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
                      Bu il için ilçe sınırı henüz yüklü değil; il düzeyi seçebilirsin.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <InfoNote icon="lock">
              Kesin adres veya canlı konum hiçbir zaman istenmez ve haritada bireysel kullanıcı koordinatı
              gösterilmez. Konumunu istediğin an ayarlardan kaldırabilirsin.
            </InfoNote>
          </div>
        </fieldset>
      </Card>

      {/* --- 3. Niyet modu --- */}
      <Card className={`p-4 ${step === 2 ? '' : 'hidden'}`}>
        <fieldset>
          <legend className="text-lg font-semibold">Bugün buraya ne için geldin?</legend>
          <p className="mt-1 text-sm text-fg-muted">
            Akış modunu belirler. Ana akışın üstünden istediğin zaman değiştirebilirsin.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {INTENT_OPTIONS.map((option, index) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg-raised p-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft hover:border-line-strong"
              >
                <input
                  type="radio"
                  name="intentMode"
                  value={option.value}
                  defaultChecked={index === 0}
                  className="mt-1 h-5 w-5 accent-[var(--accent)]"
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <span aria-hidden="true">{option.icon}</span>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-fg-muted">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* --- 4. Profil --- */}
      <Card className={`p-4 ${step === 3 ? '' : 'hidden'}`}>
        <h2 className="text-lg font-semibold">Seni nasıl tanıyalım?</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium">
              Kullanıcı adı
            </label>
            <input
              id="username"
              name="username"
              defaultValue={defaultUsername}
              required
              pattern="[a-z0-9._]{3,24}"
              aria-describedby="username-help"
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            />
            <p id="username-help" className="mt-1 text-xs text-fg-subtle">
              3-24 karakter; küçük harf, rakam, nokta ve alt çizgi.
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium">
              Kısa tanıtım <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={240}
              defaultValue={defaultBio}
              aria-describedby="bio-help"
              className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
            />
            <p id="bio-help" className="mt-1 text-xs text-fg-subtle">
              CV yazmana gerek yok. Neyle uğraştığın ve neyi merak ettiğin yeter.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          tone="ghost"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
        >
          ← Geri
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue}>
            Devam →
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? 'Kaydediliyor…' : 'Akışa git'}
          </Button>
        )}
      </div>

      {!canContinue && step === 0 ? (
        <p className="text-center text-sm text-fg-subtle">Devam etmek için en az 3 ilgi alanı seç.</p>
      ) : null}
    </form>
  );
}
