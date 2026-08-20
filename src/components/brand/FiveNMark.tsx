'use client';

import { useId } from 'react';

/**
 * nSosyal baglanti isareti.
 *
 * KAYNAK: takimin Figma master dosyasi QiXXYwqSFvcx2N2hHLw8DP,
 * "00 - Cover" > "Logo Concept" > "Connected Logo Hero" > "Group 1"
 * (dugum 82:73). Asagidaki uc path o gruptan SVG olarak disa aktarilip birebir
 * kopyalanmistir; disa aktarilan dosya provenans icin
 * `public/brand/nsosyal-mark.svg` altinda durur. Renkler, takim tarafindan
 * verilen turkuaz-kobalt referansina gore geometriye dokunmadan guncellenir.
 *
 * DIKKAT - bu dosya bir kez YANLIS isaretle dolduruldu. Onceki surum ayni
 * dosyanin baska bir dugumunden ("Brand Mark / Hero", 74:2) geliyordu ve
 * gercek markanin geometrisi degildi: yumusak bir kubik S egrisiydi, tek
 * renkti ve orani 4:3'tu. Dogru isaret asagidaki gibidir:
 *
 *   - Baglanti cizgisi DUZ dikey parcalardan ve YARIM DAIRE donuslerden
 *     olusur (once yukari, tepede saga donus, asagi, dipte saga donus,
 *     yukari). Kubik "S" degildir.
 *   - Iki halka geometrik olarak esdegerdir (rx 18, ry 18.5, stroke 5) ve
 *     cizginin iki ucunda durur: sol ALTTA ve sag USTTE.
 *   - Isaret TEK RENK DEGILDIR. Cizgi turkuazdan kobalt maviye giden bir
 *     gradyan tasir; halkalar da ayni paletin uc renklerini kullanir.
 *     `currentColor` ile boyamak markayi bozar.
 *
 * Geometriyi elle duzeltmeyin. Marka geometrisi degisirse master'dan yeniden
 * disa aktarip bu sabitleri degistirin (PROJECT_SPEC 17.18/2).
 */

/** Master'dan birebir: baglanti cizgisi (sol alt halkadan sag ust halkaya). */
const LINK_PATH =
  'M43.5608 124.714L43.5608 56.6766C43.5608 41.3912 55.952 29 71.2373 29C86.5227 29 98.9139 41.3912 98.9139 56.6766L98.9139 132.464C98.9139 146.961 110.666 158.714 125.164 158.714C139.661 158.714 151.414 146.961 151.414 132.464L151.414 60.2139';
/** Master'dan birebir: sag ust halka. */
const RING_UPPER =
  'M151.414 22.7138C161.299 22.7138 169.414 30.9394 169.414 41.2138C169.414 51.4882 161.299 59.7138 151.414 59.7138C141.529 59.7138 133.414 51.4882 133.414 41.2138C133.414 30.9394 141.529 22.7138 151.414 22.7138Z';
/** Master'dan birebir: sol alt halka. */
const RING_LOWER =
  'M43.8876 123.5C53.7722 123.5 61.8876 131.726 61.8876 142C61.8876 152.274 53.7722 160.5 43.8876 160.5C34.0029 160.5 25.8876 152.274 25.8876 142C25.8876 131.726 34.0029 123.5 43.8876 123.5Z';

const STROKE_W = 5;

/**
 * Master koordinat sistemi korunur: gradyanlar `userSpaceOnUse` oldugu icin
 * path'leri tasimak boyayi da bozardi. Yalnizca viewBox, grubun gercek
 * sinirlarina (stroke dahil, birkac piksel pay ile) kirpilir.
 */
const VIEW = { x: 20, y: 17, w: 155, h: 149 } as const;

/** Ayri motion katmani: marka paletinin turkuazi, kendi renginde glow. */
const PARTICLE_FILL = '#39C5E6';

export function FiveNMark({
  size = 40,
  animated = false,
  className = '',
  title,
}: {
  /** Genislik (px). Yukseklik master'in oranindan hesaplanir. */
  size?: number;
  /**
   * Isiltili parcacik katmanini acar.
   *
   * Parcacik logonun geometrisi degildir, ayri bir motion katmanidir; ALT
   * dugumden baslar, BAGLANTI CIZGISINI izleyerek UST dugume ulasir. Burada
   * `animateMotion` cizginin ta kendisini yol olarak kullanir, yani yol
   * yaklasik degil birebirdir.
   *
   * Hareketi azaltilmis tercihte parcacik `globals.css` icindeki
   * `.ns-mark-particle` kurali ile hic boyanmaz.
   */
  animated?: boolean;
  className?: string;
  /** Verilirse isaret anlamli bir gorsel olur; verilmezse dekoratiftir. */
  title?: string;
}) {
  const height = Math.round((size * VIEW.h) / VIEW.w);

  // Ayni sayfada birden fazla isaret bulunur (gezinme, 5N tetikleyicisi,
  // secici gobegi). Gradyan kimlikleri belge genelinde benzersiz olmali;
  // aksi halde ilk tanim digerlerini de boyar ve o ornek DOM'dan kalkarsa
  // kalanlar boyasiz kalir. `useId` SSR ile istemcide ayni degeri uretir.
  const uid = useId();
  const lineId = `${uid}-line`;
  const upperId = `${uid}-upper`;
  const lowerId = `${uid}-lower`;
  const glowId = `${uid}-glow`;

  return (
    <svg
      width={size}
      height={height}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <defs>
        {/* Geometri master'dan; renkler guncel turkuaz-kobalt marka paleti. */}
        <linearGradient
          id={lineId}
          x1="43.8876"
          y1="151"
          x2="157"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#39C5E6" />
          <stop offset="0.52" stopColor="#5792FF" />
          <stop offset="1" stopColor="#3857F2" />
        </linearGradient>

        <linearGradient
          id={upperId}
          x1="151.414"
          y1="20.2138"
          x2="151.414"
          y2="62.2138"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3857F2" />
          <stop offset="1" stopColor="#5792FF" />
        </linearGradient>

        <linearGradient
          id={lowerId}
          x1="43.8876"
          y1="121"
          x2="43.8876"
          y2="163"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#39C5E6" />
          <stop offset="1" stopColor="#5792FF" />
        </linearGradient>
      </defs>

      <path d={LINK_PATH} stroke={`url(#${lineId})`} strokeWidth={STROKE_W} />
      <path d={RING_UPPER} stroke={`url(#${upperId})`} strokeWidth={STROKE_W} />
      <path d={RING_LOWER} stroke={`url(#${lowerId})`} strokeWidth={STROKE_W} />

      {/* --- Motion katmani: geometrinin parcasi degil --- */}
      {animated ? (
        <>
          <defs>
            <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            className="ns-mark-particle"
            r="4.5"
            fill={PARTICLE_FILL}
            filter={`url(#${glowId})`}
          >
            <animateMotion dur="3s" repeatCount="indefinite" path={LINK_PATH} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.1;0.88;1"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      ) : null}
    </svg>
  );
}

/**
 * Isaret + kelime markasi. Kelime markasi ayri bir metin dugumudur; isaretin
 * icine cizilmez.
 */
export function FiveNWordmark({
  size = 34,
  animated = false,
  className = '',
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <FiveNMark size={size} animated={animated} />
      <span className="text-base font-extrabold leading-none">nSosyal</span>
    </span>
  );
}
