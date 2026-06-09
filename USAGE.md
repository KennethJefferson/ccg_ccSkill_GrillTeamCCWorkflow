# Usage

> **Note:** the runnable skill is not built yet (see [`CHANGELOG.md`](./CHANGELOG.md)). This
> document describes how it will be invoked and operated once implemented per
> [`PLAN.md`](./PLAN.md).

## Invocation

```
/grill-team-CCworkflow [<subject-path>] [--mode quick|standard|deep]
```

- `<subject-path>` — directory or file to audit. **Omit** to default to the installed
  `cc-team-workflow` skill (`~/.claude/skills/cc-team-workflow`).
- `--mode` — interrogation depth/budget. Default `standard`.

### Examples

```
/grill-team-CCworkflow
    → grill the default subject (cc-team-workflow) in standard mode.

/grill-team-CCworkflow --mode deep
    → exhaustive grill of the default subject.

/grill-team-CCworkflow E:\path\to\some\design --mode quick
    → fast grill of an arbitrary artifact.
```

## Modes

| | quick | standard | deep |
|---|---|---|---|
| max tree depth | 2 | 4 | 6 |
| max questions | 8 | 24 | 60 |
| max 55 (judge) calls | 10 | 18 | 40 |
| wall-clock budget | 30 min | 120 min | 6 h |

`quick` is for a fast sanity sweep; `deep` for an exhaustive audit. Any budget that trips
ends the run cleanly and marks remaining branches `budget_exhausted` in the report.

## Prerequisites (checked at preflight; the skill aborts if missing)

1. **PI team-bridge** — `~/.claude/skills/team-workflow/scripts/team-tool.ts` present, and
   `$PI_REPO_ROOT` resolves (default `E:\Workspace.Dev.ClaudeCode.Environments\PI`).
2. **A reachable 55/Codex model** — the external judge. The skill does **not** fall back to a
   Claude judge; a self-graded run would not be an audit.

If preflight fails it tells you exactly what is missing and stops.

## What you get

A run writes to `<project>/__solutions/<subject-slug>/`:

```
grill-report.md          ← the deliverable
  ├─ Executive Summary   (settled / contested-needs-human / budget-exhausted counts + top holes)
  ├─ Decision Tree       (per branch: question, panel answers w/ citations, 55's verdict, status)
  ├─ Coverage Gaps       (55's "what was missed" pass)
  ├─ Appendix            (raw panel exchanges)
  └─ Run Manifest        (mode, budgets spent, 55 call count, timing)
evidence/                ← immutable subject snapshot + coverage manifest + scout findings
tree.json                ← machine-readable decision tree
rounds/level-NN/         ← per-level questions, panel answers, 55 rulings
raw/55-*.md              ← verbatim 55 transcripts
```

## How to read a report

- **resolved** — the panel + evidence settled it and 55 could not refute it.
- **contested (needs human)** — panelists conflicted or 55 refuted the recommended answer, and
  it did not converge within the round budget. These are your real decision points.
- **budget_exhausted** — the grill ran out of budget before reaching this branch. Re-run with a
  higher mode to push further.
- **Coverage Gaps** — read this section even if everything resolved; it is where 55 flags what
  the grill never asked.

## Running the tests (for contributors)

```bash
npm test     # runs every *.test.ts via scripts/run-all-tests.ts (npx tsx)
```

The deterministic core is unit-tested (TDD). Model behavior is validated by a live `quick`-mode
smoke run, not mocked into a green checkmark.
