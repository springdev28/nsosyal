'use client';

import { useSyncExternalStore } from 'react';

/**
 * Sunucu ve ilk hydration renderi ayni sonucu vermelidir. Bos abonelik,
 * hydration tamamlaninca tarayici snapshot'inin okunmasina izin verir; bu
 * sayede bilesenler `mounted` state'i icin bir effect zinciri kurmaz.
 */
const subscribeToHydration = () => () => undefined;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

/** Sistem hareket tercihi degistiginde acik arayuzler de aninda uyarlanir. */
function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false);
}
