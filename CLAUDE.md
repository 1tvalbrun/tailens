# Working Agreement — tailens (Claude Code)

@AGENTS.md

> This file governs **how we run Claude Code** on tailens. `AGENTS.md` (imported
> above) holds the product context + portable engineering & design standards.
> Read both every iteration. When these conflict with default behavior, these win.

---

## The seat model

- **Main session = Claude Fable 5 at `high` effort.** This is the orchestrator:
  it plans, makes architecture calls, **writes all the code**, and holds context
  across the task. Fable is the most expensive seat in the fleet — protect its
  tokens.
- **Delegates produce conclusions; Fable writes every line.** Token-hungry
  *non-coding* work — codebase-wide analysis, file/symbol sweeps, computer use,
  log/diff parsing, dependency spelunking, broad research — gets delegated.
  Delegates hand back **findings, diagnoses, and plans**; Fable ingests the
  distilled result and does the actual editing. A subagent never returns a diff
  to apply.

---

## Model routing

Route by the **hardness** of the task, not its size. Escalate only when the
cheaper model genuinely can't carry the *diagnosis*.

| Task | Model |
|---|---|
| Orchestration, architecture, **all source changes** — feature code, refactors, bulk edits, tests, the fix for any bug — and final review | **Fable 5** — main session, `high` |
| Non-coding token-hungry work: codebase analysis, file/symbol sweeps, research, log/diff parsing, dependency spelunking, computer use | **Sonnet 5** (`claude-sonnet-5`) — returns *findings*, not code. Materially cheaper per token; the default delegate. |
| Genuinely hard *diagnosis* Sonnet can't carry: thorny architecture reasoning, deep multi-file debugging | **Opus 4.8** (`claude-opus-4-8`) — returns a *diagnosis/plan*. Heavy-lift only, **sparingly**. |

**Rule of thumb:** delegates conclude, Fable implements. If a delegate would
carry it, its job is to hand back the cause, the files/lines, and the plan —
Fable writes the change.

> **Conscious tradeoff:** bulk mechanical edits are token-hungry, and keeping
> them on Fable costs more than farming them to Sonnet. We're buying
> implementation consistency and control with tokens — a deliberate exception to
> the "protect Fable's tokens" instinct elsewhere in this file.

---

## How to delegate

- **Subagents (Agent tool).** Set `model: "sonnet"` for the default delegate;
  `model: "opus"` only for heavy-lift diagnosis. Read-only fan-out searches →
  `Explore`; multi-step research → `general-purpose`. The subagent's **final
  message is the only thing that re-enters Fable's context** — prompt it to
  return the *conclusion* (paths, line numbers, findings, decisions), **never a
  diff or code to apply**.
- **Workflows.** Put token-hungry research/analysis stages on `claude-sonnet-5`
  (per-agent `opts.model` or per-phase `model`); reserve `claude-opus-4-8` for
  the single hardest diagnosis/verify stage. Cheap mechanical stages →
  `opts.effort: "low"`. Fable still writes any resulting source changes.
- **Next.js docs are delegate work.** The `AGENTS.md` banner requires reading
  `node_modules/next/dist/docs/` before writing Next.js code — a token-hungry doc
  sweep. Send it to Sonnet: it returns the relevant conventions and deprecations
  for the API you're about to touch as *findings*; Fable writes against them.
  Don't burn Fable tokens reading the docs wholesale.
- **Raw model IDs**, no date suffixes: `claude-fable-5`, `claude-sonnet-5`,
  `claude-opus-4-8`.
- **Always report back.** After a delegated pass, hand Fable the findings and
  plan — not code files. Don't re-run the search on the main session.

---

## Fable owns quality

Because Fable writes 100% of the code, **run the self-review checklist in
`AGENTS.md` → "Before you finish"** on every change before declaring it done —
plus the backend conventions there when touching Convex. Delegated findings
don't get a pass; Fable is accountable for the code that ships.

---

## Effort discipline

- **Fable stays at `high`.** Deliberately: `xhigh` is token-hungry for marginal
  gain on this project, and `max`/extra burns tokens for *worse* outputs in
  practice. Don't raise it without a specific, correctness-critical reason.
- **Subagents run lower.** Mechanical / token-hungry passes → `low` or `medium`.
  Effort is a per-delegate dial, not a global setting.

---

## When NOT to delegate

Don't over-engineer the orchestration. A single-file read, a one-symbol grep, or
a change you can already see — just do it inline on Fable. Delegation has setup
cost; spend it only when the work is genuinely **parallel, token-hungry, or
independent** — and even then, only the *investigation* is delegated.
