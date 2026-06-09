---
name: grill-team-CCworkflow
description: Self-interrogating audit harness. CC48 facilitates a panel of interview-adapted personas (Claude) that grill a subject one decision-branch at a time; 55/Codex (external family, via the PI team-bridge) casts every branch verdict at max effort. Branch closure is a mechanical contract — no branch closes without a linked 55 ruling. Use to stress-test a design/plan/skill and get an audit report. Default subject = the cc-team-workflow skill.
---

# grill-team-CCworkflow

**You are CC48, the Facilitator. You generate questions, dispatch the panel, and assemble
the transcript. You DO NOT decide branch status and you DO NOT write any verdict.** The
verdict is 55's, via the bridge. This separation is the whole point — honor it.

## Invariant (do not violate)
Branch status is written ONLY by `lib/tree-state.ts` via `applyRuling`, and only with a
valid 55 ruling linked to that branch. There is no other way to close a branch. If you find
yourself wanting to mark something resolved yourself — stop. Send it to 55.

## Inputs
`/grill-team-CCworkflow <subject-path?> [--mode quick|standard|deep]`
- No subject → default to `~/.claude/skills/cc-team-workflow`.
- Default mode → `standard`.

## Phase 0 — Preflight (fail-clean)
1. Resolve subject path + mode; load the budget profile (`lib/budget.ts getProfile`).
2. Take an immutable evidence snapshot: copy the subject tree into
   `<project>/__solutions/<slug>/evidence/snapshot/`. All citations verify against THIS.
3. Run `scripts/grill-preflight.ts` with the team-tool path, `$PI_REPO_ROOT`, and the
   subject path. If `ok:false` → ABORT and tell the user exactly what's missing. Do NOT
   substitute a Claude judge.
4. Create the bridge run: `team_create` with a one-node team (`model: codex`). Keep the
   `run_id`; reuse it for every 55 call (agenda-vet, each judge chunk, coverage).

## Phase 1 — Multi-pass evidence
1. Deterministic inventory: list the snapshot tree + grep key symbols → file list + exclusions.
2. Dispatch THREE Claude scouts in parallel (Agent tool): docs / implementation /
   tests-&-deferred-gaps. Prepend `interview-personas/_untrusted-source.md` to each.
   Seed the deferred-gaps scout with the subject's known gaps if any (for cc-team-workflow:
   dual-validator min-score, synthesizer/competitive path, Phase 12 git — all deferred).
3. For each scout answer, run `scripts/grill-verify-citations.ts` against the snapshot;
   keep only `valid_claims`. Record dropped claims in the coverage manifest.
4. Write `evidence/coverage-manifest.json` and a compact `evidence/index.json`.

## Phase 2 — Agenda seed + 55 vet
1. Derive seed questions from the verified evidence (the subject's real decision points).
2. Fill `prompts/agenda-vet.md` (inventory + exclusions + seed questions) and dispatch to 55.
   Parse its JSON array; add any returned branches to the seed set.
3. Seed the tree: `new TreeState(mode, subject, profile)` then `seed(...)`.

## Phase G — Grill loop (breadth-first, batch-judged)
Loop while `!tree.terminated()` and `budget.tripped() === null`:
1. `frontier = tree.frontier()`. For each branch derive ONE question + your recommended
   answer; select panel = {architect, skeptic, scout} + a question-typed add (implementer
   for build/cost questions).
2. Dispatch the panel in parallel (Agent tool, interview schema, `_untrusted-source.md`
   prepended, only question-relevant excerpts from the index). Validate each answer against
   `schemas/interview-answer.schema.json`; re-prompt once on failure. Verify citations;
   keep valid claims. `tree.attachPanel(id, answers)`. Decrement `spendAgentCall` per call.
3. Chunk the frontier: `chunkFrontier(frontier, profile)`. For each chunk:
   - Build digests (`buildDigest`), fill `prompts/judge.md`, dispatch to 55
     (`spend55()` each call).
   - Validate with `validateRulingBatch(raw, chunkIds)`. On `action:"retry"` → re-prompt
     ONCE (another `spend55()`), preserving the raw output to `raw/`. Still invalid → abort
     that chunk clean and mark its branches contested-needs-human.
   - `tree.applyRuling(id, ruling)` for each. `spendQuestion()` per branch; `observeDepth`.
4. Re-check budget; if tripped, break.
After the loop: `tree.budgetExhaustRemaining()` to mark anything still open.

## Phase F — Coverage + report
1. Fill `prompts/coverage-skeptic.md` (tree + manifest), dispatch to 55, capture markdown.
2. Build the run manifest (mode, `budget.snapshot()`, 55 call count, elapsed, preflight ok).
3. Render: pipe `{tree, manifest, coverage_gaps, run_manifest}` to
   `scripts/grill-render-report.ts`; write stdout to
   `<project>/__solutions/<slug>/grill-report.md`. Also write `tree.json`.
4. `team_finalize` the bridge run. Tell the user where the report is + the headline counts.

## Error policy
If 55 is unreachable mid-run, or a chunk fails validation twice, or the bridge errors:
do NOT fabricate a ruling. Mark affected branches contested-needs-human, note it in the
report, and surface it. Failing clean beats a fake audit.
