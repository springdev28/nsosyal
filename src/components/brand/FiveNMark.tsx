'use client';

import { useId } from 'react';

/**
 * Shared nSosyal connection mark. Its three paths come unchanged from Figma
 * `QiXXYwqSFvcx2N2hHLw8DP`, node 82:73, Group 1; the exported source is kept at
 * `public/brand/nsosyal-mark.svg`. Re-export the master instead of editing geometry here.
 */

/** Master connection path from the lower-left ring to the upper-right ring. */
const LINK_PATH =
  'M43.5608 124.714L43.5608 56.6766C43.5608 41.3912 55.952 29 71.2373 29C86.5227 29 98.9139 41.3912 98.9139 56.6766L98.9139 132.464C98.9139 146.961 110.666 158.714 125.164 158.714C139.661 158.714 151.414 146.961 151.414 132.464L151.414 60.2139';
/** Master upper-right ring. */
const RING_UPPER =
  'M151.414 22.7138C161.299 22.7138 169.414 30.9394 169.414 41.2138C169.414 51.4882 161.299 59.7138 151.414 59.7138C141.529 59.7138 133.414 51.4882 133.414 41.2138C133.414 30.9394 141.529 22.7138 151.414 22.7138Z';
/** Master lower-left ring. */
const RING_LOWER =
  'M43.8876 123.5C53.7722 123.5 61.8876 131.726 61.8876 142C61.8876 152.274 53.7722 160.5 43.8876 160.5C34.0029 160.5 25.8876 152.274 25.8876 142C25.8876 131.726 34.0029 123.5 43.8876 123.5Z';

const STROKE_W = 5;

/** Preserve master coordinates because `userSpaceOnUse` gradients depend on them. */
const VIEW = { x: 20, y: 17, w: 155, h: 149 } as const;

/** Color of the optional motion layer, separate from the static mark geometry. */
const PARTICLE_FILL = '#39C5E6';

export function FiveNMark({
  size = 40,
  animated = false,
  className = '',
  title,
}: {
  /** Width in pixels; height follows the master aspect ratio. */
  size?: number;
  /** Adds a separate particle that follows LINK_PATH; reduced motion hides it in globals.css. */
  animated?: boolean;
  className?: string;
  /** Makes the mark meaningful when present; otherwise SVG is decorative. */
  title?: string;
}) {
  const height = Math.round((size * VIEW.h) / VIEW.w);

  // Several marks can share a page. Stable unique gradient IDs prevent one SVG
  // from painting another or breaking when a sibling unmounts.
  const uid = useId();
  const lineId = `${uid}-line`;
  const upperId = `${uid}-upper`;
  const lowerId = `${uid}-lower`;
  const glowId = `${uid}-glow`;
  const cycleDuration = '7.2s';

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
        {/* Geometry is fixed; only the approved turquoise-to-cobalt palette is applied here. */}
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

      {/* Optional motion layer; never part of the static logo geometry. */}
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
          <path
            aria-hidden="true"
            className="ns-mark-motion-layer ns-mark-start-glow"
            d={RING_LOWER}
            stroke="#39C5E6"
            strokeWidth={STROKE_W + 2}
            filter={`url(#${glowId})`}
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;0;1;0.45;0;0"
              keyTimes="0;0.025;0.075;0.13;0.18;1"
              dur={cycleDuration}
              repeatCount="indefinite"
            />
          </path>
          <circle
            className="ns-mark-motion-layer ns-mark-particle"
            r="4.5"
            fill={PARTICLE_FILL}
            filter={`url(#${glowId})`}
          >
            <animateMotion
              dur={cycleDuration}
              repeatCount="indefinite"
              path={LINK_PATH}
              keyPoints="0;0;1;1"
              keyTimes="0;0.18;0.62;1"
              calcMode="linear"
            />
            <animate
              attributeName="opacity"
              values="0;0;1;1;0;0"
              keyTimes="0;0.17;0.20;0.59;0.63;1"
              dur={cycleDuration}
              repeatCount="indefinite"
            />
          </circle>
          <path
            aria-hidden="true"
            className="ns-mark-motion-layer ns-mark-end-glow"
            d={RING_UPPER}
            stroke="#5792FF"
            strokeWidth={STROKE_W + 2}
            filter={`url(#${glowId})`}
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;0;1;0.45;0;0"
              keyTimes="0;0.59;0.64;0.70;0.76;1"
              dur={cycleDuration}
              repeatCount="indefinite"
            />
          </path>
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
