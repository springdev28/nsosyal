# nSosyal 5N1K - repo rules for coding agents

You are working on a competition prototype, not a full production social network.
The team owns the product idea and must be able to read, review and defend every
line you produce. Prefer small, explainable changes over clever ones.

## Source priority

When sources conflict, use this order:

1. The team's latest explicit product decision and the current Figma master design.
2. The long-form Google Docs product specification.
3. `PROJECT_SPEC.md`, this file and `CLAUDE.md`.
4. Existing implementation.

Do not promote an implementation limitation into a product rule. If code and the
current product specification disagree, fix the code or document the gap. Do not
rewrite the specification to match an outdated implementation.

## Product goal

A mobile-first social discovery layer for science, technology and innovation
communities. It must support casual social interaction, posts, humour and short
video, as well as projects, learning, communities, location/time discovery and a
separate digital newspaper monetisation surface.

## Non-negotiable product rules

1. **Location is optional and user-controlled.** District is the finest personal
   granularity. There is no exact address and no live individual location. Not
   sharing location never blocks discovery.
2. **Community creation requires moderator approval.** Every decision is written
   to the moderation log.
3. **The Why board means the motivations and experiences that led a person to a
   field, project or achievement.** It is not a motivational quote wall.
4. **Paid placement belongs in nGazete.** Never boost sponsored content in the
   personal feed ranking. `src/lib/ranking/rank.ts` must remain unaware that
   sponsorship exists.
5. **5N is flexible context, not a required five-field form.** A post carries only
   the context it actually has.
6. **Casual posts, humour and everyday conversation are first-class content.**
7. Everything in the demo dataset is synthetic and visibly labelled as demo.
   Never imitate a real person, institution or account.
8. **Long-term profile preferences and transient intent are different systems.**
   Interests and platform goals remain editable in Settings. `Sosyalleş`,
   `Keşfet`, `Öğren`, `Üret` are temporary context switches, not the whole
   personalization model.

## Brand and 5N selector

The team-created Figma master vector is the geometry source for the nSosyal 5N1K
brand mark. Do not redraw the logo from a screenshot or approximate it with a new
SVG path.

Logo invariants:

- the two endpoint rings are geometrically equivalent;
- outer diameter, inner diameter and stroke width match;
- the connecting monoline has uniform width throughout;
- no large/small-node hierarchy and no taper;
- the static logo works without glow or particle effects;
- a particle, if used, is a separate motion layer following the line centre.

The 5N selector is not a full wheel or generic radial menu. Closed state shows the
N connection mark. Tapping it opens a **half arc** that fades to transparent at
both ends. `Ne`, `Nerede`, `Ne zaman`, `Nasıl`, `Neden` travel along this arc.
The user drags/scrolls the arc, the option near the selection point gains emphasis,
and selection produces a short snap. Then the entire selector disappears and the
functional panel replaces it. The N mark remains available to reopen the selector.
Do not keep helper text such as "çevir", "seçim noktası" or explanations of what
will happen after selection in the normal product UI.

Reduced-motion and keyboard equivalents are part of the component definition.

## Visual language

Preserve the existing nSosyal product family. Do not invent a separate neon,
rainbow or generic AI-startup design system.

Dark-first reference values in the current product documentation are approximately:

- base `#0A0F1A`
- raised `#131B28`
- sunken `#0E1420`
- selected/hover `#1A2333`
- primary text `#E9EFF7`
- secondary text `#94A3B8`
- border `#1F2937`
- accent `#3D9BFF`

If the live nSosyal source uses different exact tokens, the live source wins.
Do not assign unrelated violet/green/red/yellow identities to the five N
dimensions. Keep them in the nSosyal blue/cyan family and distinguish them through
icons, labels, position and state.

Primary UI should **show, not explain**. Long explanations of ranking, business
model, privacy architecture or why a feature exists belong in About, Help,
advertiser/admin surfaces or documentation. Sponsored labels, privacy/security
messages and validation errors remain explicit.

## Nerede map

The product is Türkiye-wide. İzmir may exist in seed data or current district
files, but it is not a special product pilot or architecture boundary.

The Nerede screen must answer: **where in Türkiye is the selected kind of activity
concentrated?**

- render the real Türkiye province map;
- support topic, entity/metric and time filters;
- show province-level density/choropleth using one blue/cyan intensity family;
- show a visible low-to-high legend;
- hover/click must expose values or counts;
- allow metrics such as communities, events, projects, institutions and, when the
  data supports it, people/posts/resources/opportunities;
- selecting a province opens region details;
- district drill-down uses the same architecture wherever district data exists;
- never show exact or live user coordinates;
- provide an equivalent accessible result list.

Density is not population. It is a count or normalized score of selected platform
entities. A current lack of district GeoJSON for a province is an implementation
gap, not a product rule.

## nGazete

nGazete is a real digital newspaper surface, not a generic card grid.

Reader experience includes masthead, issue/date, headline hierarchy, hero/article
images, sections, columns/grid, links and editorial priority/layout variants.
Sponsored placements live **inside the newspaper layout** and are clearly labelled
`Sponsorlu`; do not create a separate generic `Ücretli alanlar` card section.

Advertising is spatial inventory. Example sizes include 300x250, 728x90, 300x600,
600x400 and 970x250, but the system must also store responsive grid span/aspect
ratio. Price depends on area/size, placement prominence, issue count/duration,
demand and subscription discount. Single issue, four-issue, recurring monthly or
weekly and organization packages may exist. A subscription is a defined
size/placement/frequency entitlement, not unlimited space.

Advertiser input should support creative image, alt text, target URL, requested
size/grid area, placement, issue range/count, package and pricing snapshot.
Payment never changes personal feed ranking.

## Personalization

Onboarding sets initial values only. Users can later edit:

- interests;
- long-term platform goals;
- content/feed preferences;
- location/privacy;
- notifications;
- accessibility;
- nGazete preferences.

Long-term goals can include socializing, meeting people, communities, events,
projects, sharing projects, collaborators, learning, resources, developments,
local ecosystem, institutions, opportunities, casual discussion, creation stories
and knowledgeable people.

Transient `Sosyalleş`, `Keşfet`, `Öğren`, `Üret` modes may temporarily rebalance
ranking but never replace long-term preferences.

## Engineering rules

- Next.js App Router + TypeScript + Tailwind + Supabase. No other framework.
- Keep RLS enabled. Never weaken a policy to make something work.
- Never expose the service-role key to the browser or prefix it with
  `NEXT_PUBLIC_`.
- Prefer simple, explainable prototype logic over unnecessary ML.
- Avoid large rewrites unless explicitly requested. Do not rewrite modules the
  user did not ask about.
- Explain why a new dependency is needed before adding it.
- Migrations are ordered. Never edit a migration that already ran, add a new one.
- Do not add production features outside the requested demo scope on your own.
- When in doubt, read `PROJECT_SPEC.md` and compare the existing code against it.

## Working method

1. Inspect the relevant files, current screen and existing patterns first.
2. Compare current implementation with the product contract.
3. State a short plan and list files you will change.
4. Implement only the requested scope, in small changes.
5. Run `npm run verify` and the E2E tests that cover what you touched.
6. For UI work, inspect the result at real mobile and desktop viewports. Do not
   assume code matching JSX means visual correctness.
7. Summarise what changed and exactly what you verified.

Never say a test passed unless you actually ran it in the current work.

## House style

- Source comments are in Turkish without Turkish-specific characters
  (`ç ğ ı ö ş ü` -> `c g i o s u`) and explain **why**, not what. User-facing
  strings use proper Turkish with full diacritics.
- Comment density matches the surrounding file.
- Components take view models from `src/types/view.ts`; pages do the data loading.
- All reads and mutations go through `DemoStore` (`src/lib/data/store.ts`), never
  through ad-hoc module state.
- Dates use `src/lib/time`; the product day boundary is Europe/Istanbul.
- Icons come from `src/components/ui/Icon.tsx`. Do not use emoji as UI furniture.

## Accessibility is part of done

Target WCAG 2.2 AA. Every change must preserve:

- keyboard operation and visible focus;
- accessible names on icon-only controls;
- form labels and associated errors;
- state that is not communicated by colour alone;
- reduced-motion behaviour;
- touch targets of at least 24 px;
- text equivalent for video;
- list equivalent for the map;
- focusable overflow/scroll containers where required.

Colour changes must be measured against the actual surface in both supported
appearance modes.

## Before you finish

- run the relevant verification commands;
- inspect important UI changes visually;
- keep the working branch demoable;
- report failed, skipped and unrun checks separately;
- do not claim `main` or the whole test suite is green unless it was actually
  verified.
