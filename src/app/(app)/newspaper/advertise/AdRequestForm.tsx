'use client';

import { useActionState, useState } from 'react';

import { submitAdRequest, type AdRequestState } from '@/actions/newspaper';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import {
  AD_PLACEMENTS,
  formatPrice,
  placementByCode,
  priceFor,
  SUBSCRIPTION_PLANS,
  subscriptionByPlan,
  type SubscriptionPlan,
} from '@/lib/newspaper/inventory';

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

  // Fiyat, secim degistikce aninda yeniden hesaplanir. Amac bir odeme ekrani
  // degil, hesabin ACIKLANABILIR olmasi (PROJECT_SPEC 7.9): reklamveren hangi
  // katsayinin fiyati nasil degistirdigini tek bakista gorur.
  const [placementCode, setPlacementCode] = useState(AD_PLACEMENTS[3].code);
  const [plan, setPlan] = useState<SubscriptionPlan>('tek-sayi');

  const placement = placementByCode(placementCode);
  const subscription = subscriptionByPlan(plan);
  const price =
    placement && subscription
      ? priceFor({
          placementCode: placement.code,
          issueCount: subscription.issueCount,
          subscriptionPlan: subscription.plan,
        })
      : null;

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

      <InfoNote icon="megaphone">
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
            <label htmlFor="requestedPlacement" className="mb-1 block text-sm font-medium">
              Yerleşim alanı
            </label>
            <select
              id="requestedPlacement"
              name="requestedPlacement"
              value={placementCode}
              onChange={(event) => setPlacementCode(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            >
              {AD_PLACEMENTS.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subscriptionPlan" className="mb-1 block text-sm font-medium">
              Yayın paketi
            </label>
            <select
              id="subscriptionPlan"
              name="subscriptionPlan"
              value={plan}
              onChange={(event) => setPlan(event.target.value as SubscriptionPlan)}
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
            >
              {SUBSCRIPTION_PLANS.map((entry) => (
                <option key={entry.plan} value={entry.plan}>
                  {entry.label} · {entry.issueCount} sayı
                </option>
              ))}
            </select>
            {subscription ? (
              <p className="mt-1 text-xs text-fg-subtle">{subscription.note}</p>
            ) : null}
          </div>
        </div>

        {placement && price ? (
          <div className="rounded-xl border border-line bg-bg-sunken p-3">
            <p className="text-sm font-semibold">
              Örnek hesap: {formatPrice(price.total)}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-muted sm:grid-cols-3">
              <div>
                <dt className="inline">Taban:</dt> <dd className="inline">{formatPrice(price.basePrice)}</dd>
              </div>
              <div>
                <dt className="inline">Alan ({placement.widthPx}×{placement.heightPx}):</dt>{' '}
                <dd className="inline">×{price.areaFactor}</dd>
              </div>
              <div>
                <dt className="inline">Yerleşim:</dt> <dd className="inline">×{price.placementFactor}</dd>
              </div>
              <div>
                <dt className="inline">Yayın sayısı:</dt> <dd className="inline">×{price.issueCount}</dd>
              </div>
              <div>
                <dt className="inline">Talep:</dt> <dd className="inline">×{price.demandFactor}</dd>
              </div>
              <div>
                <dt className="inline">Abonelik:</dt>{' '}
                <dd className="inline">×{price.subscriptionDiscount}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-fg-subtle">
              Grid alanı: {placement.gridColumnSpan} kolon × {placement.gridRowSpan} satır. Prototip
              başlangıç değerleri; gerçek tahsilat yoktur.
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="requestedIssueStart" className="mb-1 block text-sm font-medium">
              İlk sayı
            </label>
            <select
              id="requestedIssueStart"
              name="requestedIssueStart"
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

        <div>
          <label htmlFor="creativeAlt" className="mb-1 block text-sm font-medium">
            Görsel alt metni <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
          </label>
          <input
            id="creativeAlt"
            name="creativeAlt"
            placeholder="Görselde ne görünüyor?"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
          <p className="mt-1 text-xs text-fg-subtle">
            Kreatif görsel yüklendiğinde ekran okuyucular bu metni okur.
          </p>
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
