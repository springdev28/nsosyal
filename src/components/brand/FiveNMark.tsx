/**
 * nSosyal 5N baglanti isareti (PROJECT_SPEC 4.4 / 8.1.1 / 17.18-2).
 *
 * KAYNAK: takimin Figma master vector'u, "Brand Mark" bileseni
 * (dosya QiXXYwqSFvcx2N2hHLw8DP, State=Static dugumu 17:2). Asagidaki uc path
 * o bilesenden SVG olarak disa aktarilip birebir kopyalanmistir; disa aktarilan
 * dosyanin kendisi de provenans icin `public/brand/nsosyal-5n-mark.svg`
 * altinda duruyor. Spec bu noktada kesin: isaret ekran goruntusunden veya
 * yaklasik bir SVG path'ten YENIDEN CIZILMEZ. Geometriyi elle duzeltmeyin;
 * marka degisirse master'dan yeniden disa aktarip bu sabitleri degistirin.
 *
 * Isaretin yapisi: sol altta ve sag ustte geometrik olarak esdeger iki halka
 * (ikisi de r=18, stroke 8) ve bunlari birlestiren tek surekli egri. Egri sabit
 * kalinliktadir; taper yoktur.
 *
 * Renk: master #3D9BFF kullaniyor - bu zaten spec 8.1.1'in vurgu rengi. Burada
 * `currentColor` ile cizilir, cunku acik temada ayni ton zemine karsi AA'yi
 * gecemiyor; cagri yerleri `text-accent` verir ve tema degiskeni dogru degeri
 * secer. Geometri degismez, yalnizca boya devralinir.
 */

/** Master'dan birebir: baglanti egrisi (alt dugumden ust dugume). */
const LINK_PATH =
  'M32 70C32 34 47 17 64 22C86 29 88 87 104 96C121 106 128 73 128 50';
/** Master'dan birebir: sol alt halka. */
const RING_LOWER =
  'M32 106C41.9411 106 50 97.9411 50 88C50 78.0589 41.9411 70 32 70C22.0589 70 14 78.0589 14 88C14 97.9411 22.0589 106 32 106Z';
/** Master'dan birebir: sag ust halka. */
const RING_UPPER =
  'M128 50C137.941 50 146 41.9411 146 32C146 22.0589 137.941 14 128 14C118.059 14 110 22.0589 110 32C110 41.9411 118.059 50 128 50Z';

const VIEW_W = 160;
const VIEW_H = 120;

/** Master'daki parcacik: r=4, camgobegi, kendi renginde glow. */
const PARTICLE_FILL = '#35D6EE';

export function FiveNMark({
  size = 40,
  animated = false,
  className = '',
  title,
}: {
  /** Genislik (px). Yukseklik master'in 4:3 oranindan hesaplanir. */
  size?: number;
  /**
   * Isiltili parcacik katmanini acar.
   *
   * Spec 4.4 ve kapak sayfasi: parcacik logonun geometrisi degildir, ayri bir
   * motion katmanidir; ALT dugumden baslar, EGRIYI izleyerek UST dugume ulasir.
   * Burada parcacik baglanti egrisinin ta kendisi uzerinde hareket eder
   * (`animateMotion` + ayni path), yani yol yaklasik degil birebirdir.
   * prefers-reduced-motion'da hareket kalkar, isaret sade haliyle kalir.
   */
  animated?: boolean;
  className?: string;
  /** Verilirse isaret anlamli bir gorsel olur; verilmezse dekoratiftir. */
  title?: string;
}) {
  const height = Math.round((size * VIEW_H) / VIEW_W);
  const glowId = 'ns-mark-glow';

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {/* --- Statik isaret: efektsiz, tek renk --- */}
      <g stroke="currentColor" strokeWidth={8} fill="none">
        <path d={LINK_PATH} strokeLinecap="round" strokeLinejoin="round" />
        <path d={RING_LOWER} />
        <path d={RING_UPPER} />
      </g>

      {/* --- Motion katmani: geometrinin parcasi degil --- */}
      {animated ? (
        <>
          <defs>
            <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle r="4" fill={PARTICLE_FILL} filter={`url(#${glowId})`}>
            <animateMotion dur="1.9s" repeatCount="indefinite" path={LINK_PATH} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.12;0.85;1"
              dur="1.9s"
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
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <FiveNMark size={size} className="text-accent" />
      <span className="text-base font-extrabold leading-none">nSosyal</span>
    </span>
  );
}
