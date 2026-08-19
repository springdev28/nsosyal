/**
 * nSosyal 5N baglanti isareti (PROJECT_SPEC 8.1.1 / 17.18-2).
 *
 * !!! YER TUTUCU GEOMETRI !!!
 * Spec, isaretin takimin Figma'da urettigi MASTER VECTOR'den gelmesini ve
 * ekran goruntusunden ya da yaklasik bir SVG path'ten yeniden CIZILMEMESINI
 * sart kosuyor. O dosya bu depoda yok. Bu yuzden burada spec'in sayisal
 * kisitlarini birebir saglayan bir yer tutucu duruyor; master vector
 * geldiginde bu dosyadaki <g> icerigi onunla degistirilmelidir. Bilesenin
 * disa acik yuzeyi (props) degismek zorunda kalmaz.
 *
 * Spec'in sayisal kisitlari ve burada nasil saglandiklari:
 *
 *   "Iki halkanin dis capi, ic capi ve stroke'u AYNIDIR."
 *      -> iki <circle> de r=RING_R, strokeWidth=STROKE. Tek kaynak sabit;
 *         birini degistirmeden digerini degistirmek mumkun degil.
 *
 *   "Baglanti cizgisi bastan sona AYNI KALINLIKTADIR."
 *      -> tek bir <line>, sabit strokeWidth=STROKE, linecap="butt".
 *         Taper, degisken genislik veya gradient genislik YOK.
 *
 *   "Bir halka buyuk, digeri kucuk; bir taraf kalin, diger taraf ince
 *    tasarlanmaz."
 *      -> iki halkanin merkezleri y ekseninde ayni, yaricaplari ayni.
 *
 *   "Statik kullanimda logo effectsiz calisabilmelidir."
 *      -> varsayilan render'da filtre, glow ve gradient yok; tek renk
 *         currentColor. Isiltili parcacik AYRI bir motion katmanidir ve
 *         yalnizca `animated` ile gelir.
 */

/** Halkanin cizgi ekseni yaricapi. */
const RING_R = 11;
/** Hem halkalarin hem baglanti hattinin kalinligi. Tek kaynak. */
const STROKE = 4;

const LEFT_CX = 13;
const RIGHT_CX = 51;
const CY = 16;

/** Halkanin dis kenari: baglanti hatti tam buradan baslar ve biter. */
const RING_OUTER = RING_R + STROKE / 2;
const LINK_START = LEFT_CX + RING_OUTER;
const LINK_END = RIGHT_CX - RING_OUTER;

export function FiveNMark({
  size = 32,
  animated = false,
  className = '',
  title,
}: {
  /** Genislik (px). Yukseklik oranla hesaplanir. */
  size?: number;
  /**
   * Isiltili parcacik katmanini acar. Spec: parcacik logonun geometrisi
   * degildir, ayri bir motion katmanidir; alt dugumden baslar, baglanti
   * hattinin MERKEZINI takip eder ve varista kisa bir pulse yapar.
   * prefers-reduced-motion'da hareket yerine sade bir state kalir.
   */
  animated?: boolean;
  className?: string;
  /** Verilirse isaret anlamli bir gorsel olur; verilmezse dekoratiftir. */
  title?: string;
}) {
  const height = Math.round((size * 32) / 64);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 64 32"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {/* --- Statik isaret: tek renk, efektsiz --- */}
      <g stroke="currentColor" strokeWidth={STROKE} fill="none">
        <circle cx={LEFT_CX} cy={CY} r={RING_R} />
        <circle cx={RIGHT_CX} cy={CY} r={RING_R} />
        <line x1={LINK_START} y1={CY} x2={LINK_END} y2={CY} strokeLinecap="butt" />
      </g>

      {/* --- Motion katmani: geometrinin parcasi degil --- */}
      {animated ? (
        <circle className="ns-mark-spark" cx={LINK_START} cy={CY} r={2.4} fill="currentColor">
          <animate
            attributeName="cx"
            values={`${LINK_START};${LINK_END}`}
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" repeatCount="indefinite" />
        </circle>
      ) : null}
    </svg>
  );
}

/**
 * Isaret + kelime markasi. Gezinmede ve ust barda kullanilir.
 * Kelime markasi ayri bir metin dugumudur; isaretin icine cizilmez.
 */
export function FiveNWordmark({
  size = 30,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <FiveNMark size={size} className="text-accent" />
      <span className="text-base font-extrabold leading-none">
        nSosyal <span className="text-accent">5N</span>
      </span>
    </span>
  );
}
