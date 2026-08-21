'use client';

import { useEffect, useState } from 'react';

import { formatDateTime } from '@/lib/time';

/** Sayfa acikken Istanbul saatini dakikada bir gunceller. */
export function IstanbulClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time dateTime={now.toISOString()} suppressHydrationWarning>
      {formatDateTime(now)}
    </time>
  );
}
