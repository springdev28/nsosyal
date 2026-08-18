'use client';

import { useActionState, useState } from 'react';

import { createPost, type ComposerState } from '@/actions/social';
import { Avatar, Icon, type IconName } from '@/components/ui';
import type { PostType, Topic } from '@/types/domain';
import type { CommunitySummary, ProfileSummary } from '@/types/view';

const TYPES: Array<{ value: PostType; label: string; icon: IconName; placeholder: string }> = [
  { value: 'text', label: 'Paylaşım', icon: 'text', placeholder: 'Gönderi oluşturmak için…' },
  {
    value: 'question',
    label: 'Soru',
    icon: 'question',
    placeholder: 'Neyi çözemedin? Ayrıntı verirsen daha iyi yanıt alırsın.',
  },
  {
    value: 'project_update',
    label: 'Proje güncellemesi',
    icon: 'beaker',
    placeholder: 'Ne değişti, ne bozuldu, ne öğrendin?',
  },
  {
    value: 'resource_suggestion',
    label: 'Kaynak',
    icon: 'route',
    placeholder: 'Hangi kaynak işine yaradı ve kime uygun?',
  },
];

/**
 * Gonderi olusturucu.
 *
 * Yerlesim nsosyal.com'daki olusturucudan alinmistir: avatar, tek satirlik
 * yer tutucu, altta ikon serisi ve sagda gradyan gonder dugmesi. Ek alanlar
 * (topluluk, konu, konum) yalnizca yazmaya baslayinca acilir; bos akista
 * gurultu yapmaz.
 *
 * Konum, profilde tanimli olsa bile her gonderi icin ayri secilir; sessizce
 * eklenmez (PROJECT_SPEC 11.1).
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

  const active = TYPES.find((entry) => entry.value === type) ?? TYPES[0];
  const expanded = body.trim().length > 0;

  return (
    <div className="border-b border-line px-1 py-3 sm:px-3">
      <form action={formAction}>
        <div className="flex gap-3">
          <Avatar profile={viewer} size={44} />

          <div className="min-w-0 flex-1">
            <label htmlFor="composer-body" className="sr-only">
              Gönderi metni
            </label>
            <textarea
              id="composer-body"
              name="body"
              rows={expanded ? 4 : 2}
              maxLength={2000}
              required
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={active.placeholder}
              aria-describedby="composer-count"
              className="w-full resize-none border-0 bg-transparent py-2.5 text-[1.05rem] leading-snug outline-none placeholder:text-fg-subtle"
            />

            {expanded ? (
              <div className="mb-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="composer-community" className="mb-1 block text-xs text-fg-subtle">
                    Topluluk
                  </label>
                  <select
                    id="composer-community"
                    name="communityId"
                    className="min-h-10 w-full rounded-xl bg-bg-sunken px-3 text-sm ring-1 ring-[var(--border)]"
                  >
                    <option value="">Yalnızca ana akış</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="composer-topic" className="mb-1 block text-xs text-fg-subtle">
                    Konu
                  </label>
                  <select
                    id="composer-topic"
                    name="topics"
                    className="min-h-10 w-full rounded-xl bg-bg-sunken px-3 text-sm ring-1 ring-[var(--border)]"
                  >
                    <option value="">Seçme</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {expanded && hasLocation ? (
              <label className="mb-2 flex items-center gap-2 text-sm text-fg-muted">
                <input type="checkbox" name="shareLocation" className="h-4 w-4 accent-[var(--accent)]" />
                <Icon name="mapPin" size={14} />
                Bu gönderiye konumumu ekle{locationLabel ? ` (${locationLabel})` : ''}
              </label>
            ) : null}

            {state.error ? (
              <p role="alert" className="mb-2 text-sm text-danger">
                {state.error}
              </p>
            ) : null}
            {state.message ? (
              <p role="status" className="mb-2 text-sm font-medium text-success">
                {state.message}
              </p>
            ) : null}

            <div className="flex items-center gap-1 border-t border-line pt-2">
              <fieldset className="flex min-w-0 items-center gap-0.5">
                <legend className="sr-only">Gönderi türü</legend>
                {TYPES.map((entry) => (
                  <label
                    key={entry.value}
                    title={entry.label}
                    className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${
                      type === entry.value
                        ? 'bg-accent-soft text-accent'
                        : 'text-fg-subtle hover:bg-bg-hover hover:text-fg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={entry.value}
                      checked={type === entry.value}
                      onChange={() => setType(entry.value)}
                      className="sr-only"
                    />
                    <Icon name={entry.icon} size={19} />
                    <span className="sr-only">{entry.label}</span>
                  </label>
                ))}
              </fieldset>

              <span id="composer-count" className="ml-auto text-xs text-fg-subtle">
                {body.length ? `${body.length}/2000` : ''}
              </span>

              <button
                type="submit"
                disabled={pending || body.trim().length < 2}
                className="btn-gradient inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-sm disabled:opacity-40"
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
