import type { ReactNode } from 'react';

import { FiveNSelector } from '@/components/brand/FiveNSelector';

/**
 * Kesfet kabugu.
 *
 * 5N secici burada yasar, gezinme kolonunda degil. Sebep geometrik: secici
 * YARIM bir dairedir (spec 4.4/2), yani duz kenari bir duvara yaslanmak
 * zorundadir. O duvar Kesfet'in sol kenaridir; yay oradan saga dogru acilir ve
 * panelin uzerine yayilir.
 *
 * Isaret sticky bir kutuda durur: boyut secildikten sonra panel degisir ama
 * isaret ayni yerde kalir, yani kullanici baska bir boyuta gecmek istediginde
 * tekrar ayni noktaya basar (spec 4.4/7).
 */
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        {/* Dikeyde ekranin ortasina yakin: yarim yayin ustu de alti da sigsin. */}
        <div className="pointer-events-auto absolute left-0 top-[46vh]">
          <FiveNSelector />
        </div>
      </div>

      {/* Isaretin kapladigi seride icerik girmesin. */}
      <div className="pl-14 sm:pl-16">{children}</div>
    </div>
  );
}
