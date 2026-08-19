# CLAUDE.md

Working context for Claude Code in this repo. `AGENTS.md` holds the same rules in
long form; this file is the operational short version. Read `PROJECT_SPEC.md` before
changing product behaviour.

## What this is

nSosyal 5N — a competition prototype of a contextual social discovery layer for
science, technology and innovation communities. Next.js 15 App Router + React 19 +
TypeScript + Tailwind 4. Supabase Postgres with RLS is the production path;
`DEMO_MODE=true` (the default) runs everything from an in-memory synthetic dataset
with no network access.

## Commands

```bash
npm run dev            # dev server
npm run verify         # typecheck + lint + unit tests — run this after every change
npm test               # Vitest only
npm run test:e2e       # Playwright (builds and starts the app itself)
npm run build && npm start
```

E2E notes: all specs share one server-side store, so Playwright runs with
`workers: 1` and each test POSTs `/api/demo/reset` first. The sandbox's Chromium is
pinned via `executablePath` in `playwright.config.ts`; do not run
`playwright install`.

## Where things live

| Path | What |
| --- | --- |
| `src/app/(app)/` | Signed-in pages (feed, explore, communities, projects, newspaper, admin) |
| `src/actions/` | Server Actions — the only write path from the UI |
| `src/lib/data/store.ts` | `DemoStore`: every read and mutation goes through it |
| `src/lib/ranking/rank.ts` | Explainable feed scoring |
| `src/lib/seed/` | Synthetic dataset generators |
| `src/lib/time/` | Europe/Istanbul date helpers |
| `src/components/ui/Icon.tsx` | The icon set — no emoji as UI furniture |
| `supabase/migrations/` | Schema, triggers, RLS |
| `tests/unit`, `tests/e2e` | Vitest, Playwright + axe |

## Product invariants (do not break these)

1. Location is optional, user-controlled, district-level at finest.
2. Community creation needs moderator approval and is logged.
3. The Why board is real motivation stories, not motivational quotes.
4. Paid placement lives only in the newspaper. `rank.ts` must not learn that
   sponsorship exists — `tests/unit/ranking.test.ts` reads its source to enforce this.
5. 5N is optional context, never a required five-field form.
6. Casual content is first-class.
7. Seed data is synthetic and labelled `demo`; never imitate a real person or
   institution.

## Engineering invariants

- Keep RLS enabled; never weaken a policy to make a feature work.
- The service-role key is server-only and never `NEXT_PUBLIC_`.
- Add migrations, never edit ones that already ran.
- No new dependency without saying why.
- No large rewrites unless asked.
- `'use server'` files may only export async functions — put constants elsewhere
  (see `src/lib/media/constraints.ts`).

## Style

- Comments in Turkish without diacritics (`ç ğ ı ö ş ü` → `c g i o s u`), explaining
  **why**. UI strings in proper Turkish with diacritics.
- Match the comment density of the file you are editing.
- Pages load data; components take view models from `src/types/view.ts`.
- Use `src/lib/time` for anything date-shaped — the product day is Europe/Istanbul.

## Accessibility is part of "done"

WCAG 2.2 AA. Keyboard operation, visible focus, accessible names on icon buttons,
labelled form errors, no colour-only state, reduced motion, ≥24 px targets, text
equivalent for video, list equivalent for the map, focusable scroll containers.

Colour work is measured, not eyeballed: compute the ratio against the real surface
in **both** themes. Playwright emulates the light theme by default while dark is the
product default, and `tests/e2e/accessibility.spec.ts` scans both.

## Definition of done

`npm run verify` passes, the E2E flows you touched pass, and
`npm run build && npm start` still serves a working demo with no network.
