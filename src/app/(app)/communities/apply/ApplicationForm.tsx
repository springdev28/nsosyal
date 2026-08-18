'use client';

import { useActionState, useMemo, useState } from 'react';

import { submitCommunityApplication, type ApplicationState } from '@/actions/communities';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import type { District, Province, Scope, Topic } from '@/types/domain';

/**
 * Topluluk basvuru formu (PROJECT_SPEC 7.3).
 * Alanlar moderatorun karar verebilmesi icin gerekli olan minimumdur.
 */
export function ApplicationForm({
  topics,
  provinces,
  districts,
  existingNames,
}: {
  topics: Topic[];
  provinces: Province[];
  districts: District[];
  existingNames: string[];
}) {
  const [state, formAction, pending] = useActionState<ApplicationState, FormData>(
    submitCommunityApplication,
    {},
  );
  const [scope, setScope] = useState<Scope>('local');
  const [provinceCode, setProvinceCode] = useState('');
  const [name, setName] = useState('');

  const districtsForProvince = useMemo(
    () => districts.filter((district) => district.provinceCode === provinceCode),
    [districts, provinceCode],
  );

  // Basvuru sirasinda benzer topluluk uyarisi (PROJECT_SPEC 11.2 "Tekrarlanan topluluk").
  const similar = useMemo(() => {
    const normalized = name.toLocaleLowerCase('tr-TR').trim();
    if (normalized.length < 4) return [];
    const tokens = normalized.split(/\s+/).filter((token) => token.length > 3);
    return existingNames.filter((existing) => {
      const target = existing.toLocaleLowerCase('tr-TR');
      return tokens.some((token) => target.includes(token));
    });
  }, [name, existingNames]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state.message ? (
        <p role="status" className="rounded-lg border border-success/40 bg-success-soft px-3 py-2 text-sm text-success">
          {state.message} Durumu <strong>Bildirimler</strong> sayfasından takip edebilirsin.
        </p>
      ) : null}

      <Card className="space-y-4 p-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Topluluk adı
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={4}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Örn. İzmir Uydu ve Yer İstasyonu Topluluğu"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
          {similar.length > 0 ? (
            <div className="mt-2">
              <InfoNote icon="info">
                Benzer isimli topluluk(lar) zaten var: <strong>{similar.join(', ')}</strong>. Kapsamın farklıysa
                başvurabilirsin; moderatör bu farkı görmek isteyecek.
              </InfoNote>
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="rootTopicId" className="mb-1 block text-sm font-medium">
            Bağlı olduğu kök alan
          </label>
          <select
            id="rootTopicId"
            name="rootTopicId"
            required
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            <option value="">Seç…</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rationale" className="mb-1 block text-sm font-medium">
            Bu topluluk neden var olmalı?
          </label>
          <textarea
            id="rationale"
            name="rationale"
            required
            minLength={40}
            rows={4}
            aria-describedby="rationale-help"
            placeholder="Kaç kişisiniz, şu an nerede toplanıyorsunuz, bu alan olmayınca ne eksik kalıyor?"
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="rationale-help" className="mt-1 text-xs text-fg-subtle">
            Moderatörün kararı büyük ölçüde buna dayanır. Somut ol.
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Kapsam</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'local', label: 'Yerel' },
                { value: 'national', label: 'Ulusal' },
                { value: 'online', label: 'Çevrim içi' },
              ] as Array<{ value: Scope; label: string }>
            ).map((option) => (
              <label
                key={option.value}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-xl border px-4 text-sm ${
                  scope === option.value
                    ? 'border-accent bg-accent text-accent-fg font-semibold'
                    : 'border-line text-fg-muted hover:border-line-strong'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={option.value}
                  checked={scope === option.value}
                  onChange={() => setScope(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {scope === 'local' ? (
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
            <div>
              <label htmlFor="districtCode" className="mb-1 block text-sm font-medium">
                İlçe <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
              </label>
              <select
                id="districtCode"
                name="districtCode"
                disabled={districtsForProvince.length === 0}
                className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
              >
                <option value="">Seçme</option>
                {districtsForProvince.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="audience" className="mb-1 block text-sm font-medium">
            Hedef kitle
          </label>
          <select
            id="audience"
            name="audience"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            <option>Genel</option>
            <option>Başlangıç</option>
            <option>Lise öğrencisi</option>
            <option>Üniversite takımları</option>
            <option>Uzman</option>
          </select>
        </div>

        <div>
          <label htmlFor="rules" className="mb-1 block text-sm font-medium">
            Topluluk kuralları
          </label>
          <textarea
            id="rules"
            name="rules"
            required
            minLength={10}
            rows={4}
            aria-describedby="rules-help"
            defaultValue={'Sorular aptalca değildir; yeni başlayanlara alan açılır.\nReklam ve satış içeriği paylaşılmaz.\nBitmemiş ve başarısız denemeler paylaşılabilir.'}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="rules-help" className="mt-1 text-xs text-fg-subtle">
            Her satır bir kural olarak kaydedilir.
          </p>
        </div>
      </Card>

      <InfoNote icon="shield">
        Başvurun doğrudan topluluk açmaz. Moderatör inceler; onaylanırsa topluluk açılır ve sen ilk yöneticisi
        olursun. Reddedilirse gerekçeyi bildirimlerde görürsün.
      </InfoNote>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
        </Button>
      </div>
    </form>
  );
}
