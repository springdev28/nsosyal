'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';

/**
 * Enhances a normal GET search form so changing filters keeps the current
 * viewport. Without JavaScript the form still falls back to a regular browser
 * submission; with JavaScript it uses the same Next.js navigation as filter
 * chips and asks the router not to scroll to the page heading.
 */
export function FilterSearchForm({
  action,
  children,
  className,
}: {
  action: string;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === 'string' && value) params.append(key, value);
    });

    const search = params.toString();
    router.push(search ? `${action}?${search}` : action, { scroll: false });
  }

  return (
    <form action={action} method="get" role="search" className={className} onSubmit={submit}>
      {children}
    </form>
  );
}
