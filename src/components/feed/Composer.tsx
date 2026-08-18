'use client';

import { useActionState, useState } from 'react';

import { createPost, type ComposerState } from '@/actions/social';
import { Button, Card, ErrorNote } from '@/components/ui';
import type { PostType, Topic } from '@/types/domain';
import type { CommunitySummary } from '@/types/view';

const TYPES: Array<{ value: PostType; label: string; placeholder: string }> = [
  { value: 'text', label: 'Paylaşım', placeholder: 'Bugün ne düşünüyorsun? Mizah da serbest.' },
  { value: 'question', label: 'Soru', placeholder: 'Neyi çözemedin? Ayrıntı verirsen daha iyi yanıt alırsın.' },
  {
    value: 'project_update',
    label: 'Proje güncellemesi',
    placeholder: 'Ne değişti, ne bozuldu, ne öğrendin?',
  },
  {
    value: 'resource_suggestion',
    label: 'Kaynak önerisi',
    placeholder: 'Hangi kaynak işine yaradı ve kime uygun?',
  },
];

/**
 * Gonderi olusturucu.
 * Konum, kullanicinin profilinde tanimli olsa bile her gonderi icin ayri ayri
 * tercih edilir; sessizce eklenmez (PROJECT_SPEC 11.1).
 */
export function Composer({
  topics,
  communities,
  hasLocation,
  locationLabel,
}: {
  topics: Topic[];
  communities: CommunitySummary[];
  hasLocation: boolean;
  locationLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState<ComposerState, FormData>(createPost, {});
  const [type, setType] = useState<PostType>('text');
  const [body, setBody] = useState('');

  const active = TYPES.find((entry) => entry.value === type) ?? TYPES[0];

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <fieldset>
          <legend className="sr-only">Gönderi türü</legend>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((entry) => (
              <label
                key={entry.value}
                className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-sm transition-colors ${
                  type === entry.value
                    ? 'border-accent bg-accent text-accent-fg font-semibold'
                    : 'border-line text-fg-muted hover:border-line-strong'
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
                {entry.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="composer-body" className="sr-only">
            Gönderi metni
          </label>
          <textarea
            id="composer-body"
            name="body"
            rows={3}
            maxLength={2000}
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={active.placeholder}
            aria-describedby="composer-count"
            className="w-full resize-y rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="composer-count" className="mt-1 text-right text-xs text-fg-subtle">
            {body.length} / 2000
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="composer-community" className="mb-1 block text-sm font-medium">
              Topluluk <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
            </label>
            <select
              id="composer-community"
              name="communityId"
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
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
            <label htmlFor="composer-topic" className="mb-1 block text-sm font-medium">
              Konu <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
            </label>
            <select
              id="composer-topic"
              name="topics"
              className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
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

        {hasLocation ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareLocation" className="h-5 w-5 accent-[var(--accent)]" />
            Bu gönderiye konumumu ekle{locationLabel ? ` (${locationLabel})` : ''}
          </label>
        ) : null}

        {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        {state.message ? (
          <p role="status" className="text-sm font-medium text-success">
            {state.message}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending || body.trim().length < 2}>
            {pending ? 'Paylaşılıyor…' : 'Paylaş'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
