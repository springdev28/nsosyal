/**
 * Ana akistaki hizli gonderi formunu ve gecici medya/5N alanlarini yonetir.
 * Gercek yazma createPost Server Action'inda kalir; bu bilesen yalnizca form
 * deneyimi ve istemci geri bildiriminden sorumludur.
 */
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { createPost, type ComposerState } from '@/actions/social';
import { Avatar, Icon, type IconName } from '@/components/ui';
import type { PostType, Topic } from '@/types/domain';
import type { CommunitySummary, ProfileSummary } from '@/types/view';

const TYPES: Array<{ value: PostType; label: string; icon: IconName; placeholder: string }> = [
  { value: 'text', label: 'Paylaşım', icon: 'text', placeholder: 'Ne paylaşmak istiyorsun?' },
  { value: 'question', label: 'Soru', icon: 'question', placeholder: 'Sorunu ve denediklerini yaz.' },
  { value: 'project_update', label: 'Proje güncellemesi', icon: 'beaker', placeholder: 'Projende ne değişti?' },
  { value: 'resource_suggestion', label: 'Kaynak', icon: 'book', placeholder: 'Kaynağı ve neden yararlı olduğunu yaz.' },
];

interface MediaPreview {
  name: string;
  type: 'image' | 'video';
  url: string;
}

/**
 * Hizli gonderi olusturucu.
 *
 * Metin, coklu medya, alternatif metin, konu, topluluk hedefi ve istege
 * bagli konumu tek akista toplar. Medya secimi hikaye seridindeki "Hikaye
 * ekle" denetiminden de acilabilir.
 */
export function Composer({
  viewer,
  topics,
  communities,
  hasLocation,
  locationLabel,
}: {
  viewer: ProfileSummary;
  topics: Topic[];
  communities: CommunitySummary[];
  hasLocation: boolean;
  locationLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState<ComposerState, FormData>(createPost, {});
  const [type, setType] = useState<PostType>('text');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'topics' | 'audience' | 'location' | null>(null);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [audience, setAudience] = useState<'public' | 'community'>('public');
  const [communityId, setCommunityId] = useState('');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [shareLocation, setShareLocation] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const active = TYPES.find((entry) => entry.value === type) ?? TYPES[0];
  const expanded = open || body.trim().length > 0 || media.length > 0;
  const canSubmit = body.trim().length >= 2 || media.length > 0;

  useEffect(() => {
    const draft = window.localStorage.getItem('nsosyal-composer-draft');
    if (draft) setBody(draft);
  }, []);

  useEffect(() => {
    if (body) window.localStorage.setItem('nsosyal-composer-draft', body);
    else window.localStorage.removeItem('nsosyal-composer-draft');
  }, [body]);

  useEffect(() => {
    if (!state.message) return;
    setBody('');
    setOpen(false);
    setPanel(null);
    setCommunityId('');
    setTopicIds([]);
    setShareLocation(false);
    setMedia((items) => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  }, [state.message]);

  useEffect(
    () => () => {
      media.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [media],
  );

  function selectMedia(files: FileList | null) {
    setMedia((items) => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
      return Array.from(files ?? [])
        .slice(0, 4)
        .map((file) => ({
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: URL.createObjectURL(file),
        }));
    });
    if (files?.length) setOpen(true);
  }

  function clearMedia() {
    setMedia((items) => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  }

  function togglePanel(next: typeof panel) {
    setOpen(true);
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <div id="composer" className="border-b border-line px-1 py-3 sm:px-3">
      <form action={formAction} className="rounded-2xl transition-colors focus-within:bg-bg-raised/45">
        <div className="flex gap-3 p-2 sm:p-3">
          <Avatar profile={viewer} size={44} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="composer-type" className="sr-only">Gönderi türü</label>
              <select
                id="composer-type"
                name="type"
                value={type}
                onChange={(event) => {
                  setType(event.target.value as PostType);
                  setOpen(true);
                }}
                className="min-h-9 rounded-full border border-line bg-bg-sunken px-3 text-xs font-semibold text-fg"
              >
                {TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>{entry.label}</option>
                ))}
              </select>
              <span className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs text-fg-muted">
                <Icon name={audience === 'public' ? 'globe' : 'users'} size={14} />
                {audience === 'public' ? 'Herkes' : 'Topluluk'}
              </span>
            </div>

            <label htmlFor="composer-body" className="sr-only">Gönderi metni</label>
            <textarea
              id="composer-body"
              name="body"
              rows={expanded ? 4 : 2}
              maxLength={2000}
              value={body}
              onFocus={() => setOpen(true)}
              onChange={(event) => setBody(event.target.value)}
              placeholder={active.placeholder}
              aria-describedby="composer-count"
              className="mt-1 w-full resize-none border-0 bg-transparent py-2.5 text-[1.05rem] leading-snug outline-none placeholder:text-fg-subtle"
            />

            <input
              ref={mediaInputRef}
              id="composer-media"
              name="media"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              multiple
              className="sr-only"
              onChange={(event) => selectMedia(event.currentTarget.files)}
            />

            {media.length ? (
              <div className="mb-3 rounded-2xl border border-line bg-bg-sunken p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{media.length} medya</p>
                  <button type="button" onClick={clearMedia} className="min-h-8 rounded-full px-3 text-xs text-danger hover:bg-danger-soft">
                    Kaldır
                  </button>
                </div>
                <ul className={`grid gap-2 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {media.map((item) => (
                    <li key={`${item.name}-${item.url}`} className="relative aspect-video overflow-hidden rounded-xl bg-black">
                      {item.type === 'video' ? (
                        <video src={item.url} muted controls className="h-full w-full object-cover" aria-label={`${item.name} önizlemesi`} />
                      ) : (
                        // Tarayicinin yerel onizleme URL'si; gonderilmeden once ag istegi yapmaz.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={`${item.name} önizlemesi`} className="h-full w-full object-cover" />
                      )}
                    </li>
                  ))}
                </ul>
                <label htmlFor="composer-media-alt" className="mt-3 block text-xs font-medium">Medya açıklaması</label>
                <input
                  id="composer-media-alt"
                  name="mediaAlt"
                  required
                  maxLength={500}
                  placeholder="Görselde veya videoda ne var?"
                  className="mt-1 min-h-10 w-full rounded-xl border border-line bg-bg-raised px-3 text-sm"
                />
              </div>
            ) : null}

            {expanded ? (
              <div className="mb-3 flex flex-wrap gap-1.5" role="toolbar" aria-label="Gönderi araçları">
                <label
                  htmlFor="composer-media"
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-accent hover:bg-accent-soft"
                >
                  <Icon name="image" size={17} /> Medya
                </label>
                <ToolButton icon="tag" label="Konu" pressed={panel === 'topics'} onClick={() => togglePanel('topics')} />
                <ToolButton icon="users" label="Hedef" pressed={panel === 'audience'} onClick={() => togglePanel('audience')} />
                {hasLocation ? (
                  <ToolButton icon="mapPin" label="Konum" pressed={panel === 'location'} onClick={() => togglePanel('location')} />
                ) : null}
              </div>
            ) : null}

            {panel === 'topics' ? (
              <fieldset className="mb-3 rounded-2xl border border-line bg-bg-sunken p-3">
                <legend className="px-1 text-xs font-semibold">Konular</legend>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((topic) => (
                    <label key={topic.id} className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-semibold has-[:checked]:text-accent">
                      <input
                        type="checkbox"
                        name="topics"
                        value={topic.id}
                        checked={topicIds.includes(topic.id)}
                        onChange={(event) => setTopicIds((ids) => event.target.checked ? [...ids, topic.id] : ids.filter((id) => id !== topic.id))}
                        className="sr-only"
                      />
                      {topic.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : topicIds.map((id) => <input key={id} type="hidden" name="topics" value={id} />)}

            {panel === 'audience' ? (
              <fieldset className="mb-3 grid gap-2 rounded-2xl border border-line bg-bg-sunken p-3 sm:grid-cols-2">
                <legend className="px-1 text-xs font-semibold">Kim görebilir?</legend>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg-raised px-3 text-sm has-[:checked]:border-accent">
                  <input type="radio" name="visibility" value="public" checked={audience === 'public'} onChange={() => setAudience('public')} className="accent-[var(--accent)]" />
                  <Icon name="globe" size={16} /> Herkes
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg-raised px-3 text-sm has-[:checked]:border-accent">
                  <input type="radio" name="visibility" value="community" checked={audience === 'community'} onChange={() => setAudience('community')} className="accent-[var(--accent)]" />
                  <Icon name="users" size={16} /> Topluluk
                </label>
                {audience === 'community' ? (
                  <div className="sm:col-span-2">
                    <label htmlFor="composer-community" className="mb-1 block text-xs text-fg-subtle">Topluluk</label>
                    <select
                      id="composer-community"
                      name="communityId"
                      required
                      value={communityId}
                      onChange={(event) => setCommunityId(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3 text-sm"
                    >
                      <option value="">Seç</option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>{community.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </fieldset>
            ) : (
              <>
                <input type="hidden" name="visibility" value={audience} />
                {communityId ? <input type="hidden" name="communityId" value={communityId} /> : null}
              </>
            )}

            {panel === 'location' && hasLocation ? (
              <label className="mb-3 flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-line bg-bg-sunken px-3 text-sm">
                <input
                  type="checkbox"
                  name="shareLocation"
                  checked={shareLocation}
                  onChange={(event) => setShareLocation(event.target.checked)}
                  className="h-5 w-5 accent-[var(--accent)]"
                />
                <Icon name="mapPin" size={16} />
                {locationLabel ?? 'Profil konumunu ekle'}
              </label>
            ) : shareLocation ? <input type="hidden" name="shareLocation" value="on" /> : null}

            {state.error ? <p role="alert" className="mb-2 text-sm text-danger">{state.error}</p> : null}
            {state.message ? <p role="status" className="mb-2 text-sm font-medium text-success">{state.message}</p> : null}

            <div className="flex items-center gap-2 border-t border-line pt-2">
              <span id="composer-count" className="text-xs text-fg-subtle">{body.length}/2000</span>
              {body ? <span className="text-xs text-fg-subtle">Taslak kaydedildi</span> : null}
              <button
                type="submit"
                disabled={pending || !canSubmit}
                className="btn-gradient ml-auto inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm disabled:opacity-40"
              >
                <Icon name="spark" size={16} />
                {pending ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  pressed,
  onClick,
}: {
  icon: IconName;
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
        pressed ? 'bg-accent-soft font-semibold text-accent' : 'text-fg-muted hover:bg-bg-hover hover:text-fg'
      }`}
    >
      <Icon name={icon} size={17} /> {label}
    </button>
  );
}
