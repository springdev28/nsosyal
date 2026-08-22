import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, Badge, Card, DemoBadge, SectionHeader, Icon } from '@/components/ui';
import { CoverBadge } from '@/components/ui/CoverTile';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { getStore } from '@/lib/data/store';
import { formatDate } from '@/lib/time';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const story = getStore().getWhyStoryView(id);
  return { title: story ? story.story.title : 'Neden hikâyesi' };
}

/**
 * Neden hikayesi detayi (PROJECT_SPEC 6.4 - Akis C).
 * Demo senaryosunun kritik adimi: hikayeden projeye gecis.
 */
export default async function WhyStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const view = store.getWhyStoryView(id);
  if (!view) notFound();

  const { story, author, media, linkedProject, linkedCommunity } = view;
  const project = linkedProject ? store.getProjectView(linkedProject.slug) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Link href="/explore/why" className="inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"><Icon name="arrowLeft" size={15} />Neden
        </Link>
      </p>

      <Card as="article" className="p-4 sm:p-6">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-dim-neden)]">
          Neden hikâyesi
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{story.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link href={`/profile/${author.username}`} className="flex items-center gap-2 hover:underline">
            <Avatar profile={author} size={40} />
            <span>
              <span className="block font-medium">{author.displayName}</span>
              <span className="block text-sm text-fg-subtle">@{author.username}</span>
            </span>
          </Link>
          <DemoBadge />
          <span className="text-sm text-fg-subtle">
            <time dateTime={story.createdAt}>{formatDate(story.createdAt)}</time>
            {view.provinceName ? ` · ${view.provinceName}` : ''}
          </span>
          {story.featured ? <Badge tone="accent">Öne çıkan</Badge> : null}
        </div>

        {media ? (
          <div className="mt-4">
            <VideoPlayer media={media} />
          </div>
        ) : null}

        <div className="mt-4 whitespace-pre-line text-[1.02rem] leading-relaxed">{story.body}</div>

        {view.topics.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {view.topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/explore?topic=${topic.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted hover:border-line-strong"
                >
                  {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {project ? (
        <section aria-labelledby="linked-project">
          <SectionHeader
            title={<span id="linked-project">Bu hikâyenin bağlı olduğu proje</span>}
          />
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <CoverBadge seed={project.project.slug} glyph={project.project.emoji} size={56} />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">
                  <Link href={`/projects/${project.project.slug}`} className="hover:underline">
                    {project.project.title}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-fg-muted">{project.project.summary}</p>
                <p className="mt-2 text-sm text-fg-subtle">
                  {project.members.length} kişi · {project.updates.length} güncelleme
                  {project.provinceName ? ` · ${project.provinceName}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/projects/${project.project.slug}`}
                className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
              >
                Projeyi incele
              </Link>
              {project.communities[0] ? (
                <Link
                  href={`/communities/${project.communities[0].slug}`}
                  className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-bg-sunken"
                >
                  Topluluğa git
                </Link>
              ) : null}
            </div>
          </Card>
        </section>
      ) : linkedCommunity ? (
        <Card className="p-4">
          <p className="text-sm text-fg-muted">Bu hikâye bir toplulukla ilişkili.</p>
          <Link
            href={`/communities/${linkedCommunity.slug}`}
            className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            {linkedCommunity.name} topluluğuna git
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
