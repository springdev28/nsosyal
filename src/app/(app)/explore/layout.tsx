import type { ReactNode } from 'react';

import { FiveNSelector } from '@/components/brand/FiveNSelector';

/**
 * Shared shell for the five discovery dimensions. The half-arc selector is
 * anchored to this content edge, while the chosen dimension replaces only the
 * route content; the N mark therefore stays in a predictable place.
 */
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        {/* Keep enough viewport above and below the mark for the full half arc. */}
        <div className="pointer-events-auto absolute left-0 top-[46vh]">
          <FiveNSelector />
        </div>
      </div>

      {/* Reserve the strip occupied by the persistent N mark. */}
      <div className="pl-14 sm:pl-16">{children}</div>
    </div>
  );
}
