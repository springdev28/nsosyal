/**
 * Ayarlarin istemci etkilesimini yonetir; form state'i yalnizca taslaktir.
 * Kalici degerler updateSettings action'inda dogrulanip DemoStore'a yazilir.
 */
'use client';

import { useActionState, useMemo, useState } from 'react';

import { updateSettings, type SettingsState } from '@/actions/auth';
import { resolveFollowRequest } from '@/actions/profile';
import { Avatar, Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import { GOALS } from '@/lib/personalization/goals';
import type {
  ConnectedAccountProvider,
  District,
  GoalKey,
  IntentMode,
  LocationVisibility,
  MessageRequestPermission,
  PhotoTaggingPermission,
  Province,
} from '@/types/domain';
import type { ProfileSummary } from '@/types/view';

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
  followRequests,
}: {
  provinces: Province[];
  districts: District[];
  districtDataProvinces: readonly string[];
  initial: {
    intentMode: IntentMode | null;
    goalKeys: GoalKey[];
    locationVisibility: LocationVisibility;
    provinceCode: string | null;
    districtCode: string | null;
    reducedMotion: boolean;
    publicationReservationVisible: boolean;
    publicationMessages: 'everyone' | 'connections' | 'none';
    publicationAnonymousByDefault: boolean;
    isPrivate: boolean;
    photoTagging: PhotoTaggingPermission;
    discoverableByEmail: boolean;
    discoverableByPhone: boolean;
    messageRequests: MessageRequestPermission;
    messageQualityFilter: boolean;
    sensitiveMediaWarnings: boolean;
    imageDescriptionReminder: boolean;
    mutedWords: string[];
    connectedAccounts: ConnectedAccountProvider[];
  };
  followRequests: ProfileSummary[];
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
        <h2 className="text-lg font-semibold">Akış tercihi</h2>
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

      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Gizlilik ve güvenlik</h2>
          <p className="mt-1 text-sm text-fg-muted">Paylaşımlarını, etiketlenmeyi ve sana kimlerin ulaşabileceğini yönet.</p>
        </div>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="isPrivate" defaultChecked={initial.isPrivate} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Hesabımı gizli tut</span><span className="mt-0.5 block text-sm text-fg-muted">Yeni takipçiler onay ister; paylaşımlarını yalnızca onayladıkların görür.</span></span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium" htmlFor="photoTagging">Fotoğraflarda kim etiketleyebilir?
            <select id="photoTagging" name="photoTagging" defaultValue={initial.photoTagging} className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3">
              <option value="everyone">Herkes</option><option value="following">Takip ettiklerim</option><option value="none">Hiç kimse</option>
            </select>
          </label>
          <label className="text-sm font-medium" htmlFor="messageRequests">Kim mesaj isteği gönderebilir?
            <select id="messageRequests" name="messageRequests" defaultValue={initial.messageRequests} className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3">
              <option value="everyone">Herkes</option><option value="following">Takip ettiklerim</option><option value="none">Hiç kimse</option>
            </select>
          </label>
        </div>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="messageQualityFilter" defaultChecked={initial.messageQualityFilter} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Mesaj isteği kalite filtresi</span><span className="mt-0.5 block text-sm text-fg-muted">Yinelenen veya şüpheli istekleri ayrı bir alanda tutar.</span></span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="sensitiveMediaWarnings" defaultChecked={initial.sensitiveMediaWarnings} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Hassas medya uyarılarını göster</span><span className="mt-0.5 block text-sm text-fg-muted">İşaretlenen görseller açılmadan önce uyarı gösterilir.</span></span>
        </label>

        {followRequests.length > 0 ? (
          <section aria-labelledby="follow-requests-heading" className="rounded-xl border border-line p-3">
            <h3 id="follow-requests-heading" className="font-semibold">Takip istekleri</h3>
            <ul className="mt-2 space-y-2">
              {followRequests.map((profile) => (
                <li key={profile.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-bg-sunken p-2">
                  <Avatar profile={profile} size={38} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{profile.displayName}</span><span className="block truncate text-xs text-fg-subtle">@{profile.username}</span></span>
                  <form action={resolveFollowRequest} className="flex gap-2">
                    <input type="hidden" name="requesterId" value={profile.id} />
                    <button type="submit" name="decision" value="deny" className="min-h-9 rounded-full border border-line px-3 text-xs font-semibold">Reddet</button>
                    <button type="submit" name="decision" value="approve" className="min-h-9 rounded-full bg-accent px-3 text-xs font-semibold text-accent-fg">Onayla</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Card>

      <Card className="space-y-4 p-4">
        <div><h2 className="text-lg font-semibold">Keşfedilebilirlik</h2><p className="mt-1 text-sm text-fg-muted">Hesabının rehber eşleştirmelerinde kullanılıp kullanılmayacağını seç.</p></div>
        <label className="flex items-start gap-3"><input type="checkbox" name="discoverableByEmail" defaultChecked={initial.discoverableByEmail} className="mt-1 h-5 w-5 accent-[var(--accent)]" /><span><span className="font-medium">E-posta adresimle bulunabilirim</span><span className="mt-0.5 block text-sm text-fg-muted">E-postanı bilen kişiler hesabını önerilerde görebilir.</span></span></label>
        <label className="flex items-start gap-3"><input type="checkbox" name="discoverableByPhone" defaultChecked={initial.discoverableByPhone} className="mt-1 h-5 w-5 accent-[var(--accent)]" /><span><span className="font-medium">Telefon numaramla bulunabilirim</span><span className="mt-0.5 block text-sm text-fg-muted">Telefonunu bilen kişiler hesabını önerilerde görebilir.</span></span></label>
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
        <h2 className="text-lg font-semibold">Konum paylaşımı</h2>

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
          <input type="checkbox" name="imageDescriptionReminder" defaultChecked={initial.imageDescriptionReminder} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Görsel açıklaması hatırlatıcısı</span><span className="mt-0.5 block text-sm text-fg-muted">Görsel paylaşırken alternatif metin eklemeni hatırlatır.</span></span>
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

      <Card className="space-y-4 p-4">
        <div><h2 className="text-lg font-semibold">Bağlı hesaplar ve oturum</h2><p className="mt-1 text-sm text-fg-muted">Bu prototip gerçek OAuth bağlantısı kurmaz; seçimler demo durumunu göstermek içindir.</p></div>
        <fieldset>
          <legend className="sr-only">Bağlı giriş hesapları</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['google', 'apple'] as const).map((provider) => (
              <label key={provider} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-bg-raised p-3">
                <input type="checkbox" name="connectedAccounts" value={provider} defaultChecked={initial.connectedAccounts.includes(provider)} className="h-5 w-5 accent-[var(--accent)]" />
                <span><span className="block font-medium">{provider === 'google' ? 'Google' : 'Apple'}</span><span className="block text-xs text-fg-subtle">Demo giriş bağlantısı</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="rounded-xl bg-bg-sunken p-3 ring-1 ring-[var(--border)]"><p className="font-medium">Bu cihaz</p><p className="mt-0.5 text-sm text-fg-muted">Web oturumu · İstanbul saat dilimi · şimdi etkin</p></div>
        <div>
          <label htmlFor="mutedWords" className="mb-1 block text-sm font-medium">Sessize alınan kelimeler</label>
          <textarea id="mutedWords" name="mutedWords" rows={3} defaultValue={initial.mutedWords.join(', ')} placeholder="virgülle ayır" className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2" />
          <p className="mt-1 text-xs text-fg-subtle">En fazla 30 kelime veya etiket.</p>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Yayın Atölyesi</h2>
          <p className="mt-1 text-sm text-fg-muted">Gazete alanı rezervasyonlarında kimliğini ve iletişim tercihlerini yönet.</p>
        </div>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="publicationReservationVisible" defaultChecked={initial.publicationReservationVisible} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Rezervasyonlarda profilimi göster</span><span className="mt-0.5 block text-sm text-fg-muted">Kapalıysa diğer kullanıcılar rezervasyonu görür ancak hesabını göremez.</span></span>
        </label>

        <label className="block text-sm font-medium" htmlFor="publicationMessages">
          Rezervasyon üzerinden mesaj isteği
          <select id="publicationMessages" name="publicationMessages" defaultValue={initial.publicationMessages} className="mt-1 block w-full rounded-xl border border-line bg-bg-raised px-3 py-2">
            <option value="everyone">Herkes</option>
            <option value="connections">Yalnızca bağlantılarım</option>
            <option value="none">Hiç kimse</option>
          </select>
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="publicationAnonymousByDefault" defaultChecked={initial.publicationAnonymousByDefault} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          <span><span className="font-medium">Yeni taslakları anonim başlat</span><span className="mt-0.5 block text-sm text-fg-muted">Her taslakta ayrıca değiştirebilirsin.</span></span>
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
