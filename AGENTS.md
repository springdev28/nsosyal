# nSosyal 5N — repo rules for coding agents

You are working on a competition prototype, not a full production social network.
The team owns the product idea and must be able to read, review and defend every
line you produce. Prefer small, explainable changes over clever ones.

## Product goal

A mobile-first social discovery layer for science, technology and innovation
communities. It must support casual social interaction (posts, humour, short
video) as well as projects, learning, communities, location/time discovery, and a
separate digital newspaper monetisation surface.

## Non-negotiable product rules

1. **Location is optional and user-controlled.** District is the finest granularity;
   there is no exact address and no live location. Not sharing a location never
   blocks discovery — it only keeps the user out of local-people results.
2. **Community creation requires moderator approval.** Every decision is written to
   the moderation log.
3. **The Why board means the motivations and experiences that led a person to a
   field, project or achievement.** It is not a motivational quote wall.
4. **Paid placement belongs in the newspaper.** Never boost sponsored content in the
   personal feed ranking. `src/lib/ranking/rank.ts` must stay unaware that
   sponsorship exists — a unit test asserts this by reading its source.
5. **5N is a flexible context model, not a mandatory five-field form.** A post
   carries only the context it actually has.
6. **Casual posts, humour and everyday conversation are first-class content.**
7. Everything in the demo dataset is synthetic and is labelled `demo` in the UI.
   Never imitate a real person, institution or account.

## Engineering rules

- Next.js App Router + TypeScript + Tailwind + Supabase. No other framework.
- Keep RLS enabled. Never weaken a policy to make something work.
- Never expose the service-role key to the browser and never prefix it with
  `NEXT_PUBLIC_`.
- Prefer simple, explainable prototype logic over unnecessary ML.
- Avoid large rewrites unless explicitly requested. Do not rewrite modules the user
  did not ask about.
- Explain why a new dependency is needed before adding it.
- Migrations are ordered and reversible; never edit a migration that already ran —
  add a new one.
- Do not add production features that are outside the demo scope on your own.
- When in doubt, read `PROJECT_SPEC.md` and the existing code instead of guessing.

## Working method

1. Inspect the relevant files and existing patterns first.
2. State a short plan and list the files you will change.
3. Implement only the requested scope, in small commits.
4. Run `npm run verify` (typecheck + lint + unit tests) and the E2E tests that cover
   what you touched.
5. Summarise what changed and what you verified.

## House style

- Source comments are in Turkish, without Turkish-specific characters
  (`ç ğ ı ö ş ü` → `c g i o s u`), and explain **why**, not what. User-facing strings
  are proper Turkish with full diacritics.
- Comment density matches the surrounding file; do not annotate obvious code.
- Components take view models from `src/types/view.ts`; pages do the data loading.
- All reads and mutations go through `DemoStore` (`src/lib/data/store.ts`), never
  through ad-hoc module state.
- Dates are handled with `src/lib/time`; the product's day boundary is
  Europe/Istanbul, not the server's local timezone.
- Icons come from `src/components/ui/Icon.tsx`. Do not use emoji as UI furniture —
  emoji render differently per platform and cannot be sized or coloured reliably.
  (Emoji used *as content*, e.g. a project's glyph, is fine.)

## Accessibility is part of "done"

Target WCAG 2.2 AA. Every change must preserve:

- keyboard operation and a visible focus indicator;
- accessible names on icon-only controls;
- form labels and error messages associated with their field;
- state that is not communicated by colour alone;
- reduced-motion behaviour;
- touch targets of at least 24 px;
- the text equivalent for video and the list equivalent for the map.

Colour changes must be verified by computing the contrast ratio against the actual
surface — including the light theme, which Playwright emulates by default, and the
dark theme, which is the product's default look.

## Before you finish

- `npm run verify` passes.
- `npm run test:e2e` passes for the flows you touched.
- `main` (and the working branch) is still demoable: `npm run build && npm start`
  serves a working app with `DEMO_MODE=true` and no network access.
