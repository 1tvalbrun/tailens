<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Product context

tailens helps a user present the facts of their **real background** — companies,
titles, metrics, achievements — against a target, and shows how well that
background *covers* the target.

**The Source is ground truth.** The user's verified record of their own history
is the **Source**. Everything the product outputs is derived from it.

## The anti-fabrication contract (the most important rule in this repo)

**The model may only reword, reorder, and re-emphasize facts that already exist
in the user's Source. It never invents a company, title, date, metric, or
achievement — and it surfaces gaps honestly rather than papering over them.**

- No fact appears in output that isn't traceable to the Source.
- When the Source doesn't cover something the target asks for, that's a **gap** —
  show it as a gap; do not fabricate to fill it.
- "Enhancing" means better framing of true facts, never manufacturing new ones.
- This applies to every generation path (LLM prompts, exports, summaries). If a
  feature could tempt the model to invent, constrain it at the boundary.

## Honest coverage

Every claim the Source makes about a target is classified as **covered**,
**transferable**, or **gap** — and shown truthfully. This is the semantic spine
of the product and it maps directly to the color tokens below (pine / amber /
clay). Never recolor a gap as covered to look better.

---

# Stack & data flow

These are the project's chosen libraries. The repo starts as a bare Next.js app —
**install each as the feature that needs it lands**; don't assume they're present,
and check `package.json` before importing.

- **Framework:** Next.js 16 + React 19 + TypeScript, Tailwind v4.
- **Backend / data:** **Convex** (database, queries, mutations, actions).
- **LLM:** **OpenAI**. All calls server-side.
- **Document import:** **mammoth** (`.docx` → text), **unpdf** (PDF → text).
- **Document export:** **docx** (Word), **@react-pdf/renderer** (PDF).

**Data-flow rules:**

- **Parsing and document generation run in a Convex `"use node"` action** — never
  in a query or mutation. mammoth, unpdf, docx, and @react-pdf/renderer are Node
  libraries and only work in the Node runtime.
- **All API keys stay server-side** (OpenAI, any third party). Never ship a key to
  the client or inline it in a component.
- The client talks to Convex functions; Convex talks to OpenAI and the doc
  libraries. The browser never calls OpenAI directly.

---

# Frontend Code Quality

High quality means the **least code that fully solves the problem** — including
the cases that aren't the happy path — and nothing the problem doesn't yet
demand. When in doubt, write the obvious version, not the clever one.

**The rule that governs all others:** don't over-engineer or force anything.
Speculative flexibility, config for needs that don't exist, and premature
optimization are defects, not diligence. If you're forcing a pattern to fit,
stop and reconsider.

## Principles

- **Least code that fully works.** Solve the real problem with the smallest
  clear implementation — fewer lines, abstractions, dependencies — but never by
  cutting real cases. Concise ≠ terse; favor readable over compact.
- **Declarative over imperative.** Describe the desired result and let the
  framework reconcile it; don't hand-orchestrate steps or poke the DOM. Render
  from state.
- **One source of truth; derive, don't duplicate.** Compute values during render
  from existing state/props instead of storing copies you must keep in sync.
  Duplicated/synced state is the most common frontend bug source.
- **Handle every state, not just success.** Real UI has loading, empty, error,
  and edge inputs — zero items, very long strings, slow/failed network,
  unauthorized, offline. Account for them explicitly.
- **Name for the next reader.** A name should reveal what a thing is or does
  without a comment. Assume the next reader (or agent) has none of your context.
- **Comments earn their place or they go.** Warranted only when a comment says
  what the code cannot — a reason, a non-obvious constraint, a workaround and the
  bug behind it. If it restates the code, delete it. Prefer a better name or a
  smaller function over a comment that excuses confusing code.
- **Abstract on the third repetition, not the first.** Reuse once a real pattern
  has emerged; don't build generic, configurable machinery for a single caller.
- **Make invalid states unrepresentable.** Model data so bad combinations can't
  be constructed. Avoid `any`; type the boundaries (props, API responses,
  function signatures).

## React effects — read before writing any `useEffect`

Effects synchronize with **external systems** — network, DOM, subscriptions,
timers, non-React widgets. They are not for reacting to React's own data. Most
`useEffect` bugs come from using one where you didn't need it. Before writing
one, check:

- Transforming data for rendering? Compute it during render. No effect.
- Caching an expensive calculation? `useMemo`. No effect.
- Resetting all state when a prop changes? Pass a `key` to the component instead.
- Adjusting some state when a prop changes? Compute during render, or accept the
  value as-is.
- Responding to a user action? Put the logic in the event handler, where the
  action happened — not in an effect that watches for the side effect.
- Fetching data? Prefer Convex's reactive queries (`useQuery`) over a hand-rolled
  fetching effect. If you must fetch in an effect, handle race conditions (ignore
  stale responses on cleanup).

An effect whose body only reads and writes React state, with no external system
involved, is almost always a mistake.
Reference: react.dev/learn/you-might-not-need-an-effect

## Tests — a test that can't fail protects nothing

A test earns its place only if a realistic regression in the code it covers
would make it fail. Before adding or keeping one, check:

- Does it assert observable behavior or a contract — not an implementation
  detail that can change while behavior stays correct?
- Would it actually fail if the logic broke, or does it pass no matter what
  (over-mocked, asserting only that a mock was called, snapshotting trivia)?
- Does it cover the cases that break in practice — edge inputs, error/empty
  paths, boundaries — rather than re-testing the happy path twice?

Delete or rewrite tests that can't answer these. A green suite that wouldn't
catch a regression is worse than none — it buys false confidence.

## Accessibility — build it in, don't bolt it on

- **Semantic HTML first.** `<button>` for actions, `<a>` for navigation, real
  `<label>`, headings, and lists. Native elements give keyboard and
  screen-reader behavior for free; a `<div onClick>` gives you nothing.
- **Label every control** and associate it (`htmlFor`/`id`). Images get
  meaningful `alt`, or empty `alt=""` if purely decorative.
- **Keyboard operable.** Everything usable without a mouse, with a visible focus
  indicator and logical tab order. Move focus deliberately when opening modals or
  changing routes.
- **ARIA only to fill real gaps** native HTML can't cover — a wrong role is worse
  than none.
- **Never rely on color alone** to convey meaning, and meet WCAG AA contrast.
  (Coverage state must carry a label/icon, not just pine/amber/clay.)

## Before you finish: self-review

Run this before declaring any task complete. If something fails, fix it now
rather than waiting to be told.

- [ ] Did I write more code, abstraction, or config than the problem requires? Cut it.
- [ ] Does any output rest on a fact not in the Source? (anti-fabrication contract)
- [ ] Are loading, empty, and error states handled — or only the happy path?
- [ ] Does any state duplicate something I could derive during render?
- [ ] Does every `useEffect` synchronize with an external system, or did one
      sneak in for React-only data?
- [ ] Do Convex functions have argument validators, and does node-only work run
      in a `"use node"` action?
- [ ] Does every test I added fail when the behavior it covers breaks?
- [ ] Does every comment say something the code can't? Delete the rest.
- [ ] Can a keyboard-only user complete this? Are controls labeled and contrast
      sufficient?
- [ ] Would the next reader understand this without me explaining it?

---

# Backend / Convex conventions

- **Argument validators on every function.** Every query, mutation, and action
  declares `args` with Convex validators (`v.*`). No unvalidated inputs cross the
  boundary.
- **`"use node"` boundary.** Anything using mammoth, unpdf, docx,
  @react-pdf/renderer, or the OpenAI SDK runs in a Node action (`"use node"` at
  the top of the file). Queries and mutations stay on the default runtime — keep
  them pure and fast; offload I/O and heavy work to actions.
- **`userId` on every table.** Every row is owned — carry `userId` as the auth
  seam from day one. Filter every read/write by the current user; never return
  another user's data. This is what lets auth scale cleanly to ~10k users.
- **Actions are not transactional — handle races and idempotency.** Actions can
  run concurrently and retry. Make external effects (OpenAI calls, doc
  generation, writes-after-fetch) idempotent or guarded; write results back
  through a mutation, and don't assume an action ran exactly once.
- **Keys server-side only.** OpenAI and any third-party credentials live in
  Convex environment config, never in client code.

---

# House Design System

tailens must read like a **well-funded, established product** — refined, minimal,
with real depth. Not template output. Every screen earns "this looks expensive"
through restraint, typographic craft, obsessive spacing, and subtle depth —
never through gimmicks. Clarity and calm confidence beat novelty.

## Never ship AI-slop

Do **not** reach for any of these defaults:

- System/`Inter`/`Roboto`/`Arial` for everything, or Tailwind's default type scale.
- Purple-on-white (or purple-on-dark) gradients.
- Generic Tailwind `gray-*` / `slate-*` ramps — use the neutral tokens below.
- Blanket `shadow-lg` / `shadow-xl` — use the elevation system below.
- Emoji as UI icons; cookie-cutter card grids with no hierarchy.

## Type

Self-host the Fontshare faces (they are not on Google Fonts — don't use
`next/font/google` for them). Geist Mono via the `geist` package or self-hosted.

- **Display / headings — General Sans** (Fontshare)
- **UI / body — Switzer** (Fontshare)
- **Data / metrics / mono — Geist Mono** (or JetBrains Mono)
- **Scale (px):** `12 / 14 / 16 / 20 / 28 / 40 / 56`. Tighten letter-spacing at
  **28 and up** (`-0.01em` → `-0.02em` as size grows). Body stays at default
  tracking with a comfortable measure.

## Color

Exact tokens — do not eyeball substitutes. Drop into Tailwind v4 `@theme` in your
global stylesheet.

```css
@theme {
  /* Base / neutrals */
  --color-paper:      #F5F6F4; /* app background */
  --color-surface:    #FFFFFF; /* cards */
  --color-surface-2:  #FBFBFA; /* raised */
  --color-ink:        #171A1C; /* primary text */
  --color-ink-2:      #5B625F; /* secondary text */
  --color-ink-3:      #8A918D; /* muted / labels */
  --color-line:       #E5E7E3; /* borders */
  --color-line-2:     #EEF0EC; /* dividers */

  /* Coverage semantics — RESERVED for covered / transferable / gap ONLY */
  --color-covered:        #17513B; /* Pine */
  --color-covered-tint:   #E7F0EA;
  --color-covered-border: #CBE0D2;
  --color-transferable:        #87591A; /* Amber */
  --color-transferable-tint:   #F6ECD7;
  --color-transferable-border: #E7D4AD;
  --color-gap:        #A23B37; /* Clay */
  --color-gap-tint:   #F4E7E5;
  --color-gap-border: #E7C9C5;
  --color-meter-pine:  #17513B;
  --color-meter-amber: #C79A4A;
  --color-meter-clay:  #A23B37;

  /* Sidebar / dark chrome */
  --color-sidebar:         #14181A;
  --color-sidebar-raised:  #1B2124;
  --color-sidebar-text:    #A7AFAB;
  --color-sidebar-active:  #EAF2EC;
  --color-accent:          #6FBF95; /* Mint — logo / active in dark chrome */

  /* Primary action / brand */
  --color-brand:        #17513B; /* Pine */
  --color-brand-hover:  #1C6349;
}
```

**Color rules:**

- **Pine / Amber / Clay are semantic, not decorative.** Use them *only* for
  covered / transferable / gap states and meter fills. Never as generic accents,
  button colors, or link colors.
- **Pine is the primary action / brand** color; **Mint** is the accent used only
  in the dark sidebar chrome (logo, active item).
- Neutrals carry the whole UI. Reach for a color only when it means something.

## Depth & elevation

Depth is a **system**, not per-component guesswork. Hairline borders + layered,
low-opacity shadows — never the heavy default shadow.

- **e0 — flat:** `--color-paper`, no shadow.
- **e1 — cards:** `--color-surface`, `1px solid --color-line`,
  `0 1px 2px rgba(23,26,28,.04)`.
- **e2 — raised / popovers / menus:** add `0 4px 12px rgba(23,26,28,.06)`.
- Dark chrome uses `--color-sidebar-raised` for elevation instead of shadow.

## Motion

- **150–250ms**, `ease-out` or a gentle spring. Animate `transform` and
  `opacity` only.
- Purposeful only: enters/exits and state changes. No decorative loops, no
  parallax, no attention-seeking animation.
- Always honor `prefers-reduced-motion: reduce`.

## Charts, meters & KPI tiles

Coverage meters and metric tiles are core to this product. If a **`dataviz`
skill** resolves in your environment, use it. If it doesn't, apply these
essentials directly (don't skip them because the skill is missing):

- One meaningful color per series, mapped to the coverage tokens above
  (pine = covered, amber = transferable, clay = gap) — never decorative color.
- Label axes and series directly; avoid legends that force a lookup.
- Numbers in **Geist Mono**; align decimals.
- Verify contrast holds in both light and dark chrome.
- No chartjunk — no 3D, no gradients-for-decoration, no gratuitous animation.

Coverage state must never rely on color alone — pair it with a label or icon.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
