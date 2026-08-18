'use client';

import { useActionState } from 'react';

import { submitAdRequest, type AdRequestState } from '@/actions/newspaper';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';

/**
 * Ilan basvuru formu (PROJECT_SPEC 7.9 "Gelir modelinin prototipte gosterimi").
 * Prototipte gercek odeme entegrasyonu YAPILMAZ; basvuru "incelemede" bekler.
 */
export function AdRequestForm({
  issueDates,
  defaultEmail,
}: {
  issueDates: Array<{ value: string; label: string }>;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState<AdRequestState, FormData>(submitAdRequest, {});

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

      <InfoNote icon="💳">
        Bu prototipte ödeme altyapısı yoktur. Başvurun “incelemede” durumunda kaydedilir; yönetici onayladığında
        seçtiğin sayıda “Sponsorlu” etiketiyle görünür.
      </InfoNote>

      <Card className="space-y-4 p-4">
        <div>
          <label htmlFor="placementType" className="mb-1 block text-sm font-medium">
            İlan türü
          </label>
          <select
            id="placementType"
            name="placementType"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            <option value="event_ad">Etkinlik ilanı</option>
            <option value="org_ad">Kurumsal ilan</option>
            <option value="project_showcase">Proje vitrini</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            İlan başlığı
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={6}
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium">
            İlan metni
          </label>
          <textarea
            id="body"
            name="body"
            required
            minLength={20}
            rows={4}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="requestedIssueDate" className="mb-1 block text-sm font-medium">
              Hedef sayı
            </label>
            <select
              id="requestedIssueDate"
              name="requestedIssueDate"
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            >
              {issueDates.map((issue) => (
                <option key={issue.value} value={issue.value}>
                  {issue.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="theme" className="mb-1 block text-sm font-medium">
              Tema <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
            </label>
            <input
              id="theme"
              name="theme"
              placeholder="Uzay, biyoteknoloji…"
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">
              İletişim e-postası
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              defaultValue={defaultEmail}
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            />
          </div>

          <div>
            <label htmlFor="linkUrl" className="mb-1 block text-sm font-medium">
              Bağlantı <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
            </label>
            <input
              id="linkUrl"
              name="linkUrl"
              placeholder="/etkinlikler/..."
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
        </Button>
      </div>
    </form>
  );
}
