'use client';

import { useActionState, useState } from 'react';

import { createProject, type ProjectFormState } from '@/actions/projects';
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from '@/lib/media/constraints';
import { Button, Card, ErrorNote, InfoNote } from '@/components/ui';
import type { Topic } from '@/types/domain';
import type { CommunitySummary } from '@/types/view';

const STATUSES = [
  { value: 'fikir', label: 'Fikir aşaması' },
  { value: 'prototip', label: 'Prototip' },
  { value: 'test', label: 'Test' },
  { value: 'yayinda', label: 'Yayında' },
];

/** Proje olusturma formu ve pitch videosu yukleme (PROJECT_SPEC 6.5 - Akis D). */
export function ProjectForm({
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
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(createProject, {});
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError(null);
    setFileName(null);
    if (!file) return;

    // Sunucu tarafinda tekrar dogrulanir; bu yalnizca hizli geri bildirim.
    if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
      setFileError('Yalnızca MP4 veya WebM kabul ediliyor.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setFileError(`Dosya çok büyük (${Math.round(file.size / (1024 * 1024))} MB). Sınır 50 MB.`);
      event.target.value = '';
      return;
    }
    setFileName(`${file.name} · ${Math.round(file.size / 1024)} KB`);
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}

      <Card className="space-y-4 p-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Proje adı
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={4}
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
        </div>

        <div>
          <label htmlFor="summary" className="mb-1 block text-sm font-medium">
            Kısa açıklama
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            minLength={20}
            rows={2}
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Durum
          </label>
          <select
            id="status"
            name="status"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-fg-subtle">
            Bitmemiş proje paylaşmak burada normaldir. “Fikir aşaması” tamamen geçerli bir durumdur.
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
                <span aria-hidden="true">{topic.emoji}</span>
                {topic.name}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <label htmlFor="whyText" className="mb-1 block text-sm font-medium">
            Neden bu projeye başladın?
          </label>
          <textarea
            id="whyText"
            name="whyText"
            required
            minLength={30}
            rows={5}
            aria-describedby="why-help"
            placeholder="Hangi an, hangi problem veya hangi eksiklik seni buna itti?"
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="why-help" className="mt-1 text-xs text-fg-subtle">
            Bu metin proje sayfasının Neden sekmesinde ve Neden panosunda görünebilir.
          </p>
        </div>

        <div>
          <label htmlFor="howText" className="mb-1 block text-sm font-medium">
            Nasıl geliştiriyorsun? <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
          </label>
          <textarea
            id="howText"
            name="howText"
            rows={3}
            placeholder="Yöntem, araçlar, kullandığın kaynaklar."
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="needs" className="mb-1 block text-sm font-medium">
            Neye ihtiyacın var? <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
          </label>
          <input
            id="needs"
            name="needs"
            placeholder="Geri bildirim, iş birliği, belirli bir uzmanlık…"
            className="min-h-11 w-full rounded-xl border border-line bg-bg-raised px-3"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Pitch videosu (isteğe bağlı)</h2>
        <InfoNote icon="🎬">
          En fazla {MAX_VIDEO_SECONDS} saniye, 50 MB, MP4 veya WebM. Prototipte videolar dönüştürülmez; küçük
          bir dosya yükle.
        </InfoNote>

        <div>
          <label htmlFor="pitch" className="mb-1 block text-sm font-medium">
            Video dosyası
          </label>
          <input
            id="pitch"
            name="pitch"
            type="file"
            accept="video/mp4,video/webm"
            onChange={onFileChange}
            aria-describedby="pitch-help"
            className="w-full rounded-xl border border-line bg-bg-raised p-2 text-sm"
          />
          <p id="pitch-help" className="mt-1 text-xs text-fg-subtle">
            {fileName ?? 'Henüz dosya seçilmedi.'}
          </p>
          {fileError ? (
            <p role="alert" className="mt-1 text-sm text-danger">
              {fileError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="pitchTranscript" className="mb-1 block text-sm font-medium">
            Videonun metin karşılığı
          </label>
          <textarea
            id="pitchTranscript"
            name="pitchTranscript"
            rows={3}
            aria-describedby="transcript-help"
            className="w-full rounded-xl border border-line bg-bg-raised px-3 py-2"
          />
          <p id="transcript-help" className="mt-1 text-xs text-fg-subtle">
            Erişilebilirlik için önemli: sesi duyamayan veya videoyu açamayan kullanıcılar bunu okur.
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Bağlı topluluklar</legend>
          {communities.length === 0 ? (
            <p className="text-sm text-fg-subtle">
              Henüz bir topluluğa üye değilsin. Projeni sonradan topluluklara bağlayabilirsin.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {communities.map((community) => (
                <label
                  key={community.id}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-semibold has-[:checked]:text-accent"
                >
                  <input type="checkbox" name="communities" value={community.id} className="sr-only" />
                  <span aria-hidden="true">{community.emoji}</span>
                  {community.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        {hasLocation ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareLocation" className="h-5 w-5 accent-[var(--accent)]" />
            Projeye konumumu ekle{locationLabel ? ` (${locationLabel})` : ''}
          </label>
        ) : null}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Kaydediliyor…' : 'Projeyi oluştur'}
        </Button>
      </div>
    </form>
  );
}
