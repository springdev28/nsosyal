import Link from 'next/link';

import { Avatar } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import type { WhyStoryView } from '@/types/view';

/**
 * Ana akistaki hizli hikaye seridi.
 *
 * Neden hikayesi veri modelini kullanir ama kendi, kisa ve profil halkali
 * sunumudur; Why panosunun uzun kartlarini akisa kopyalamaz.
 */
export function StoryRail({ stories }: { stories: WhyStoryView[] }) {
  return (
    <section aria-labelledby="story-rail-title" className="mb-4 border-b border-line px-1 pb-4 sm:px-3">
      <h2 id="story-rail-title" className="sr-only">Günün hikâyeleri</h2>
      <div className="story-strip scroll-x flex gap-3 pb-2" role="group" tabIndex={0} aria-label="Hikâye şeridi">
        <Link
          href="/create/why"
          className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-xl py-1 text-center text-xs text-fg-muted"
        >
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-accent bg-accent-soft text-accent transition-colors group-hover:bg-bg-hover">
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </span>
          <span className="line-clamp-2">Hikâye ekle</span>
        </Link>

        {stories.map((view) => (
          <Link
            key={view.story.id}
            href={`/explore/why/${view.story.id}`}
            className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-xl py-1 text-center text-xs text-fg-muted"
            aria-label={`${view.author.displayName}: ${view.story.title}`}
          >
            <span className="story-ring rounded-full p-[3px] transition-transform group-hover:scale-105">
              <span className="block rounded-full bg-bg p-[2px]">
                <Avatar profile={view.author} size={48} />
              </span>
            </span>
            <span className="line-clamp-2 leading-tight">{view.author.displayName}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
