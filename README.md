# ccg_ccSkill_GrillTeamCCWorkflow

A Claude Code skill (`/grill-team-CCworkflow`) that **audits a design by interrogating it** —
relentlessly, one decision-branch at a time — and produces an audit report whose verdicts come
from a *different model family* than the panel under judgment.

> **Status:** Design complete, implementation planned. The `lib/` core, personas, prompts,
> `SKILL.md`, and tests are specified in [`PLAN.md`](./PLAN.md) but not yet built. See
> [`CHANGELOG.md`](./CHANGELOG.md).

## What it does

Launch `/grill-team-CCworkflow <subject>` and Claude (CC48) becomes a **Facilitator**:

1. Stands up a panel of interview-adapted personas (architect, skeptic, scout, +implementer).
2. Grills them with grill-me-style questions — one branch at a time, walking the decision tree.
3. For every branch, **55/Codex** (an external model, via the PI team-bridge, at max effort)
   casts the verdict and, at the end, a coverage-skeptic pass on what was missed.
4. Emits a single audit-grade `grill-report.md`.

Default subject = the sibling `cc-team-workflow` skill. Any plan/artifact can be grilled by
passing its path.

## Why it's built this way: separation of powers

An all-Claude panel judged by all-Claude is **self-audit theater** — the same base model sharing
the same blind spots. So no role both produces and judges:

| Role | Who | Produces | Cannot |
|------|-----|----------|--------|
| **Facilitator** | CC48 (Claude) | questions, panel dispatch, transcript, report | decide status; write a verdict |
| **Panel** | interview personas (Claude) | per-question answers (prose + structured claims/refutations/evidence) | self-grade |
| **Audit-judge** | **55/Codex** (external) | per-branch rulings | edit the transcript |
| **Coverage-skeptic** | **55/Codex** (external) | "what did this grill miss?" | — |

Crucially this is **mechanically enforced, not prose-enforced**: the `tree-state` module is the
*only* writer of a branch's status and **refuses to close a branch without a linked valid 55
ruling**. There is no status-forcing backdoor. That is what earns the word "audit."

## Architecture at a glance

- **Loop:** breadth-first, batch-judged. Sibling branches at one depth answer in parallel; the
  whole level is judged in one (chunked if wide) 55 call. ~20 sequential judge calls → ~6.
- **Termination:** no open branches remain, OR a hard budget trips (`budget_exhausted` is a real
  branch status, not a crash). Modes: `quick` / `standard` / `deep`.
- **Evidence:** multi-pass scouts (docs / implementation / tests-&-deferred-gaps) → citation
  verifier (snippet must appear at `path:line` in an immutable snapshot) → coverage manifest.
- **Trust boundary:** subject content is treated as untrusted data (prompt-injection safe); the
  skill hard-depends on the PI bridge + a live 55 and **fails clean** if either is missing (no
  silent downgrade to a self-graded Claude judge).

It deliberately does **not** reuse `cc-team-workflow`'s engine (that's for schema-enforced
deliverables; interviewing isn't one). It forks the persona *stances* fresh; `cc-team-workflow`
is the default *subject*, not a runtime dependency.

## Repository layout

```
DESIGN.md            # validated design spec (+ full review provenance)
PLAN.md              # task-by-task TDD implementation plan
SKILL.md             # (planned) the model-facing orchestration narrative
lib/                 # (planned) deterministic core: tree-state, budget, judge-batch,
                     #           ruling-validate, citation-verify, report-render, bridge
schemas/             # (planned) JSON schemas for interview answers, rulings, manifests
interview-personas/  # (planned) forked Q&A personas + untrusted-source guard
prompts/             # (planned) 55-side prompts: agenda-vet, judge, coverage-skeptic
tests/               # (planned) fixture-driven integration scenarios
```

## Requirements

- Node ≥ 20, run via `npx tsx` (no test framework — in-house micro harness).
- The PI **team-bridge** (`~/.claude/skills/team-workflow/scripts/team-tool.ts`) + a reachable
  55/Codex model. Without these the skill refuses to run.

## Provenance

Designed with Claude Code (Opus), adversarially reviewed twice by 55/Codex. Sibling of
[`ccg_ccSkill_CCTeamWorkflow`](https://github.com/KennethJefferson/ccg_ccSkill_CCTeamWorkflow).
See [`DESIGN.md`](./DESIGN.md) §8 for review run IDs and the finding-by-finding resolution.

## License

Not yet specified.
