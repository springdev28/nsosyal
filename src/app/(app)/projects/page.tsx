import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, ChipRow, EmptyState, FilterChip, SectionHeader } from '@/components/ui';
import { getStore } from '@/lib/data/store';

export const metadata: Metadata = { title: 'Projeler' };

/** Proje listesi (PROJECT_SPEC 7.8). */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; q?: string }>;
}) {
  const params = await searchParams;
  const store = getStore();

  const topics = store.getTopics();
  const topic = params.topic ? store.getTopicBySlug(params.topic) : null;
  const projects = store.listProjects({ topicId: topic?.id ?? null, query: params.q });

  const href = (slug: string | null) => {
    const search = new URLSearchParams();
    if (slug) search.set('topic', slug);
    if (params.q) search.set('q', params.q);
    const value = search.toString();
    return value ? `/projects?${value}` : '/projects';
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        as="h1"
        title="Projeler"
        description="Sadece bitmiş işler değil; fikirden denemeye, ilerlemeden sonuca kadar süreç."
        action={
          <Link
            href="/create/project"
            className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Proje oluştur
          </Link>
        }
      />

      <form action="/projects" method="get" role="search" className="flex gap-2">
        {params.topic ? <input type="hidden" name="topic" value={params.topic} /> : null}
        <label htmlFor="project-q" className="sr-only">
          Proje ara
        </label>
        <input
          id="project-q"
          name="q"
          type="search"
          defaultValue={params.q ?? ''}
          placeholder="Ara: rüzgâr, roket, erişilebilirlik…"
          className="min-h-11 flex-1 rounded-xl border border-line bg-bg-raised px-3"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
        >
          Ara
        </button>
      </form>

      <ChipRow label="Konu">
        <FilterChip href={href(null)} active={!topic}>
          Tüm konular
        </FilterChip>
        {topics.map((entry) => (
          <FilterChip key={entry.id} href={href(entry.slug)} active={topic?.id === entry.id}>
            <span aria-hidden="true">{entry.emoji}</span> {entry.name}
          </FilterChip>
        ))}
      </ChipRow>

      {projects.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="Bu filtrede proje yok"
          description="Konuyu değiştirebilir veya kendi projeni oluşturabilirsin."
          action={
            <Link href="/create/project" className="text-sm font-semibold text-accent underline">
              Proje oluştur
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="text-2xl">
                    {project.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">
                      <Link href={`/projects/${project.slug}`} className="hover:underline">
                        {project.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-fg-subtle">{statusLabel(project.status)}</p>
                  </div>
                </div>
                <p className="mt-2 flex-1 text-sm text-fg-muted">{project.summary}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'fikir':
      return 'Fikir aşaması';
    case 'prototip':
      return 'Prototip';
    case 'test':
      return 'Test';
    case 'yayinda':
      return 'Yayında';
    case 'arsiv':
      return 'Arşiv';
    default:
      return status;
  }
}
