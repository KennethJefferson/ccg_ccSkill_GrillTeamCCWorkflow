import { TreeState } from "../lib/tree-state.ts";
import { getProfile } from "../lib/budget.ts";
import { BudgetTracker } from "../lib/budget.ts";
import { chunkFrontier } from "../lib/judge-batch.ts";
import { validateRulingBatch } from "../lib/ruling-validate.ts";
import { renderReport } from "../lib/report-render.ts";
import { test, assert, summarize } from "../lib/test-helpers.ts";
import type { Ruling } from "../lib/types.ts";

function ruling(qid: string, status: Ruling["status"], spawned = 0): Ruling {
  return { question_id: qid, status, verdict_reason: `verdict-${qid}`,
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [],
    spawned_questions: Array.from({ length: spawned }, (_, i) => ({ question: `child-${qid}-${i}`, rationale: "r", stakes: "low" as const })) };
}

test("SCENARIO depth: a resolved root that spawns children grills to depth then terminates", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  const [root] = t.seed([{ question: "root?", recommended_answer: "ra" }]);
  t.applyRuling(root.id, ruling(root.id, "resolved", 2)); // 2 children at depth 1
  let guard = 0;
  while (!t.terminated() && guard++ < 50) {
    for (const b of t.frontier()) t.applyRuling(b.id, ruling(b.id, "resolved")); // leaves, no spawn
  }
  assert(t.terminated(), "terminates");
  assert(t.all().length === 3, "root + 2 children");
});

test("SCENARIO contested-freeze: a branch contested twice freezes, not infinite", () => {
  const p = { ...getProfile("standard"), max_rounds_per_branch: 2 };
  const t = new TreeState("standard", "subj", p);
  const [b] = t.seed([{ question: "q?", recommended_answer: "ra" }]);
  let guard = 0;
  while (!t.terminated() && guard++ < 10) {
    for (const x of t.frontier()) t.applyRuling(x.id, ruling(x.id, "contested"));
  }
  assert(t.get(b.id)!.status === "contested", "frozen contested");
  assert(guard <= 3, `did not loop forever (guard=${guard})`);
});

test("SCENARIO budget-exhaustion: question cap trips and remaining branches are marked", () => {
  // The grill loop spends a question per resolved branch and stops the moment the budget
  // trips, leaving later branches open. With max_questions=2 (cap allows exactly 2 spends;
  // the 3rd exceeds it per the strict-> semantics) and 4 seeded branches, the trip fires
  // mid-grill while branches remain open — which budgetExhaustRemaining() then marks.
  const p = { ...getProfile("quick"), max_questions: 2 };
  const t = new TreeState("quick", "subj", p);
  const bt = new BudgetTracker(p);
  t.seed([
    { question: "q1", recommended_answer: "a" }, { question: "q2", recommended_answer: "a" },
    { question: "q3", recommended_answer: "a" }, { question: "q4", recommended_answer: "a" },
  ]);
  for (const b of t.frontier()) {
    t.applyRuling(b.id, ruling(b.id, "resolved"));
    bt.spendQuestion();
    if (bt.tripped()) break; // check AFTER spend so the trip is caught while branches remain open
  }
  if (bt.tripped()) t.budgetExhaustRemaining();
  assert(bt.tripped() === "max_questions", "tripped on questions");
  assert(t.all().some(b => b.status === "budget_exhausted"), "remaining branches exhausted");
  assert(t.all().filter(b => b.status === "budget_exhausted").length >= 1, "at least one unreached branch marked");
});

test("SCENARIO batch-split: a wide frontier chunks into multiple judge calls", () => {
  const p = { ...getProfile("standard"), max_branches_per_judge_batch: 2, max_55_input_tokens: 9_999_999 };
  const t = new TreeState("standard", "subj", p);
  t.seed(Array.from({ length: 5 }, (_, i) => ({ question: `q${i}`, recommended_answer: "a" })));
  const chunks = chunkFrontier(t.frontier(), p);
  assert(chunks.length === 3, `5 / 2 => 3 chunks, got ${chunks.length}`);
});

test("SCENARIO parse-retry: malformed judge output signals retry; second parse applies", () => {
  const ids = ["B1"];
  const bad = validateRulingBatch("{broken", ids);
  assert(!bad.ok && bad.action === "retry", "first parse retries");
  const good = validateRulingBatch(JSON.stringify([ruling("B1", "resolved")]), ids);
  assert(good.ok, "second parse ok");
});

test("SCENARIO end-to-end render: a finished tree renders a full report", () => {
  const t = new TreeState("standard", "cc-team-workflow", getProfile("standard"));
  const [b] = t.seed([{ question: "Is the dual-validator path built?", recommended_answer: "No — deferred." }]);
  t.applyRuling(b.id, ruling(b.id, "resolved"));
  const md = renderReport(t.toJSON() as any, {
    manifest: { files_covered: ["SKILL.md"], files_excluded: [], deferred_gaps_checked: ["dual-validator"], open_unknowns: [] },
    coverage_gaps: "Synthesizer path not probed.",
    run_manifest: { mode: "standard", subject: "cc-team-workflow", budgets_spent: {}, calls_55: 3, wall_clock_ms: 1000, preflight_ok: true },
  });
  assert(md.includes("# Grill Report"), "rendered");
  assert(md.includes("verdict-" + b.id), "verbatim verdict");
  assert(md.includes("Synthesizer path not probed."), "coverage gaps present");
});

summarize();
