'use client';

import Image from 'next/image';
import { useActionState } from 'react';

import { updateProfileDetails, type ProfileFormState } from '@/actions/profile';
import { Avatar, Button, Card, ErrorNote, Icon } from '@/components/ui';
import type { Profile } from '@/types/domain';

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileDetails,
    {},
  );
  const links = [...profile.links, ...Array.from({ length: Math.max(0, 4 - profile.links.length) }, () => null)].slice(0, 4);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state.message ? (
        <p role="status" className="rounded-xl border border-success/40 bg-success-soft px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="relative aspect-[3/1] min-h-28 bg-[linear-gradient(120deg,#163451,#2b66a0_52%,#4c65f6)]">
          {profile.bannerUrl ? (
            <Image src={profile.bannerUrl} alt="Mevcut profil kapak görseli" fill unoptimized className="object-cover" />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 profile-banner-pattern" />
          )}
        </div>
        <div className="flex items-end gap-3 px-4 pb-4">
          <span className="-mt-10 rounded-full bg-bg p-1.5 ring-1 ring-[var(--border)]">
            <Avatar profile={profile} size={82} />
          </span>
          <p className="pb-2 text-sm text-fg-muted">Görseller kırpılarak farklı ekranlara uyarlanır.</p>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Fotoğraf ve kapak</h2>
          <p className="mt-1 text-sm text-fg-muted">JPG, PNG veya WebP. Profil fotoğrafı en fazla 2 MB, kapak 5 MB.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileField id="avatar" label="Profil fotoğrafı" hint="Kare görsel önerilir." />
          <FileField id="banner" label="Kapak görseli" hint="3:1 oranı önerilir." />
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="inline-flex min-h-6 items-center gap-2">
            <input type="checkbox" name="removeAvatar" className="h-4 w-4 accent-[var(--accent)]" />
            Profil fotoğrafını kaldır
          </label>
          <label className="inline-flex min-h-6 items-center gap-2">
            <input type="checkbox" name="removeBanner" className="h-4 w-4 accent-[var(--accent)]" />
            Kapak görselini kaldır
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold">Profil bilgileri</h2>
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">Görünen ad</label>
          <input id="displayName" name="displayName" required minLength={2} maxLength={50} defaultValue={profile.displayName} className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3" />
          <p className="mt-1 text-xs text-fg-subtle">Kullanıcı adın değişmez: @{profile.username}</p>
        </div>
        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">Kısa tanıtım</label>
          <textarea id="bio" name="bio" rows={4} maxLength={240} defaultValue={profile.bio} className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="birthDate" className="mb-1 block text-sm font-medium">Doğum tarihi</label>
            <input id="birthDate" name="birthDate" type="date" defaultValue={profile.birthDate ?? ''} className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3" />
          </div>
          <div>
            <label htmlFor="birthDateVisibility" className="mb-1 block text-sm font-medium">Doğum tarihini kim görür?</label>
            <select id="birthDateVisibility" name="birthDateVisibility" defaultValue={profile.birthDateVisibility} className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3">
              <option value="private">Yalnızca ben</option>
              <option value="followers">Takipçilerim</option>
              <option value="public">Herkes</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Bağlantılar</h2>
          <p className="mt-1 text-sm text-fg-muted">En fazla dört bağlantı. Instagram, GitHub, LinkedIn, YouTube ve X adresleri kendi ikonuyla görünür.</p>
        </div>
        <div className="space-y-3">
          {links.map((link, index) => (
            <fieldset key={link?.id ?? `empty-${index}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[0.8fr_1.5fr]">
              <legend className="px-1 text-xs font-semibold text-fg-subtle">Bağlantı {index + 1}</legend>
              <div>
                <label htmlFor={`linkLabel-${index}`} className="mb-1 block text-xs font-medium">Etiket (isteğe bağlı)</label>
                <input id={`linkLabel-${index}`} name="linkLabel" maxLength={36} defaultValue={link?.label ?? ''} placeholder="Portfolyom" className="min-h-10 w-full rounded-lg border border-line bg-bg-raised px-3" />
              </div>
              <div>
                <label htmlFor={`linkUrl-${index}`} className="mb-1 block text-xs font-medium">Web adresi</label>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-bg-raised px-3 focus-within:border-accent">
                  <Icon name="link" size={17} className="shrink-0 text-fg-subtle" />
                  <input id={`linkUrl-${index}`} name="linkUrl" type="text" inputMode="url" defaultValue={link?.url ?? ''} placeholder="instagram.com/kullanici" className="min-h-10 min-w-0 flex-1 bg-transparent outline-none" />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Profili kaydet'}</Button>
      </div>
    </form>
  );
}

function FileField({ id, label, hint }: { id: 'avatar' | 'banner'; label: string; hint: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center gap-2 text-sm font-medium"><Icon name="camera" size={17} />{label}</label>
      <input id={id} name={id} type="file" accept="image/jpeg,image/png,image/webp" className="block min-h-11 w-full rounded-xl border border-line bg-bg-raised p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-semibold file:text-accent" />
      <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
    </div>
  );
}
