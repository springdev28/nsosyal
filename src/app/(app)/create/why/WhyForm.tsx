'use client';

import { useActionState, useState } from 'react';

import { createWhyStory, type WhyFormState } from '@/actions/projects';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import type { Topic } from '@/types/domain';
import type { ProjectSummary } from '@/types/view';

/** Neden hikayesi olusturma formu (PROJECT_SPEC 17.9). */
export function WhyForm({
  topics,
  projects,
  hasLocation,
  locationLabel,
}: {
  topics: Topic[];
  projects: ProjectSummary[];
  hasLocation: boolean;
  locationLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState<WhyFormState, FormData>(createWhyStory, {});
  const [body, setBody] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}

      <InfoNote icon="spark">
        Neden panosu bir motivasyon sözü duvarı değil. En iyi hikâyeler somut bir anı anlatır: hangi soruya
        cevap veremedin, ne kaybettin, neyi fark ettin?
      </InfoNote>

      <Card className="space-y-4 p-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Başlık
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={6}
            placeholder="Örn. Bu projeye neden başladım: cevaplayamadığımız bir soru"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium">
            Hikâye
          </label>
          <textarea
            id="body"
            name="body"
            required
            minLength={80}
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-describedby="body-help"
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="body-help" className="mt-1 text-xs text-fg-subtle">
            {body.length < 80 ? `${80 - body.length} karakter daha gerekiyor.` : `${body.length} karakter.`}
          </p>
        </div>

        <div>
          <label htmlFor="linkedProjectId" className="mb-1 block text-sm font-medium">
            Bağlı proje <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
          </label>
          <select
            id="linkedProjectId"
            name="linkedProjectId"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            <option value="">Bağlama</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-fg-subtle">
            Bağlarsan okuyucular hikâyeden doğrudan projeye geçebilir.
          </p>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Konular</legend>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => (
              <label
                key={topic.id}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-semibold has-[:checked]:text-accent"
              >
                <input type="checkbox" name="topics" value={topic.id} className="sr-only" />
                
                {topic.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="visibility" className="mb-1 block text-sm font-medium">
            Görünürlük
          </label>
          <select
            id="visibility"
            name="visibility"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            <option value="public">Herkese açık</option>
            <option value="community">Yalnızca topluluk</option>
            <option value="profile_only">Yalnızca profilimde</option>
          </select>
        </div>

        {hasLocation ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareLocation" className="h-5 w-5 accent-[var(--accent)]" />
            Hikâyeye konumumu ekle{locationLabel ? ` (${locationLabel})` : ''}
          </label>
        ) : null}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Hikâyeyi yayımla'}
        </Button>
      </div>
    </form>
  );
}
