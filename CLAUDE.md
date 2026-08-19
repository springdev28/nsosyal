# CLAUDE.md

Operational context for Claude Code in this repo. Read `PROJECT_SPEC.md` first.
`AGENTS.md` contains the expanded rules.

## Source priority

When product sources disagree:

1. latest explicit team decision and current Figma master design;
2. long-form product specification;
3. `PROJECT_SPEC.md`, `AGENTS.md`, this file;
4. existing implementation.

An existing implementation limitation is not automatically a product requirement.
Do not rewrite the specification to rationalize outdated code.

## What this is

nSosyal 5N1K is a competition prototype of a contextual social discovery layer for
science, technology and innovation communities. It combines casual social content,
communities, projects, learning, events, location/time discovery and a separate
nGazete monetization surface.

Next.js 15 App Router + React 19 + TypeScript + Tailwind 4. Supabase Postgres with
RLS is the production path. `DEMO_MODE=true` uses an in-memory synthetic dataset
with no network access.

## Commands

```bash
npm run dev
npm run verify
npm test
npm run test:e2e
npm run build && npm start
```

Do not say a check passed unless you actually ran it in the current work.

## Key paths

| Path | What |
| --- | --- |
| `src/app/(app)/` | signed-in product pages |
| `src/actions/` | Server Actions, the UI write path |
| `src/lib/data/store.ts` | DemoStore, data access |
| `src/lib/ranking/rank.ts` | explainable feed scoring |
| `src/lib/seed/` | synthetic data |
| `src/lib/time/` | Europe/Istanbul helpers |
| `src/components/ui/Icon.tsx` | UI icon system |
| `supabase/migrations/` | schema, triggers, RLS |
| `tests/unit`, `tests/e2e` | Vitest, Playwright, axe |

## Product invariants

1. Location is optional and user-controlled. No exact/live individual location.
2. Community creation requires moderator approval and audit logging.
3. Why is real motivation/background stories, not motivational quotes.
4. Paid placement lives only in nGazete. Ranking code must not learn that
   sponsorship exists.
5. 5N is optional context, never a required five-field form.
6. Casual content is first-class.
7. Demo data is synthetic and labelled demo.
8. Long-term profile goals and transient intent are separate.

## Brand and selector

Use the team-created Figma **master vector** for the logo. Do not recreate it from
screenshots or invent a new approximate path.

- two endpoint rings are equal in outer diameter, inner diameter and stroke;
- connecting monoline has uniform thickness;
- no big/small node hierarchy or taper;
- particle/glow is motion only, not required in the static mark.

5N navigation is a **half, end-fading selector**, not a full radial wheel. N opens
the half arc, options travel along it, selection snaps at the marker, then the
selector disappears and the functional panel opens. N remains available to reopen
it. Avoid persistent explanatory helper text.

## Visual rules

Preserve the existing nSosyal dark-first visual family. Do not introduce a
rainbow/neon AI-startup style. Use the nSosyal blue/cyan family for 5N states and
map density.

Primary UI should show rather than explain. Put long rationales in About, Help,
admin, advertiser or documentation surfaces.

## Nerede

The product is Türkiye-wide. Current İzmir district data is an implementation
inventory detail, not a product pilot rule.

Nerede must show province-level density/choropleth for the selected platform
metric using a single blue/cyan intensity scale, legend, hover/click values and
region details. Metrics include communities, events, projects, institutions and,
where supported, people/posts/resources/opportunities. District drill-down uses
the same architecture wherever district data exists. Always provide list
-equivalent results. Never expose exact/live personal coordinates.

## Personalization

Settings owns long-term interests, platform goals, content/feed preferences,
location/privacy, notifications, accessibility and nGazete preferences.

`Sosyalleş`, `Keşfet`, `Öğren`, `Üret` are temporary modes only. They may rebalance
ranking for the current task/session but do not replace long-term profile goals.

## nGazete

nGazete is a real digital newspaper layout: masthead, issue/date, headline
hierarchy, images, sections, columns/grid, links and editorial priority. Sponsored
placements sit inside the newspaper grid with an explicit `Sponsorlu` label.

Ads are spatial inventory. Store size/grid area, placement, issue count/duration,
package and pricing snapshot. Example dimensions such as 300x250, 728x90,
300x600, 600x400 and 970x250 are examples, not a closed list. Price is influenced
by area, placement, duration/issue count, demand and subscription discount.

Do not build a separate reader-facing `Ücretli alanlar` card list or explanatory
`Gelir modeli nasıl çalışıyor?` panel. Those explanations belong in advertiser,
admin, About or docs.

## Engineering invariants

- Keep RLS enabled. Never weaken policy to make a feature work.
- Service-role key is server-only and never `NEXT_PUBLIC_`.
- Add migrations, do not edit already-run migrations.
- No new dependency without explaining why.
- No large rewrites unless requested.
- `'use server'` files export only async functions.
- Pages load data, components take view models from `src/types/view.ts`.
- Use `src/lib/time` for date logic.

## Working method

1. Inspect relevant code and the current screen.
2. Compare implementation against `PROJECT_SPEC.md`.
3. State a short plan and files to change.
4. Implement only requested scope.
5. Run relevant verification.
6. For UI changes, inspect real mobile/desktop output for clipping, overflow,
   contrast and layout quality.
7. Report exactly what was run, failed, skipped or not run.

## Accessibility

Target WCAG 2.2 AA: keyboard operation, visible focus, accessible names, associated
form errors, no colour-only state, reduced motion, adequate touch targets, video
text/caption equivalent, map list equivalent and focusable overflow areas.

## Definition of done

A task is done only after requested behavior is implemented, relevant checks have
actually been run, and important UI changes have been visually inspected. Do not
claim the complete suite or build passes unless you verified it.
