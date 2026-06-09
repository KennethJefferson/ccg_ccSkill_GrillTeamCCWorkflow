import { TreeState } from "./tree-state.ts";
import { getProfile } from "./budget.ts";
import { test, assert, summarize } from "./test-helpers.ts";
import type { Ruling } from "./types.ts";

function ruling(qid: string, status: Ruling["status"], spawned: number = 0): Ruling {
  return { question_id: qid, status, verdict_reason: "because",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [],
    spawned_questions: Array.from({ length: spawned }, (_, i) => ({ question: `q${i}`, rationale: "r", stakes: "low" as const })) };
}

test("seeded root branches start open", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  const open = t.frontier();
  assert(open.length === 1 && open[0].status === "open", "one open root");
  assert(open[0].depth === 0, "root depth 0");
});

test("no status-forcing backdoor exists", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  assert(typeof (t as any).forceStatus === "undefined", "no forceStatus method");
  assert(typeof (t as any).setStatus === "undefined", "no setStatus method");
});

test("applyRuling with a mismatched branch id is rejected", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  const r = t.applyRuling("does-not-exist", ruling("does-not-exist", "resolved"));
  assert(!r.ok && r.error === "unknown_branch", r.error ?? "");
});

test("applyRuling closes the branch, links the ruling, and sets status verbatim", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  const r = t.applyRuling(b.id, ruling(b.id, "resolved"));
  assert(r.ok, r.error ?? "");
  const closed = t.get(b.id)!;
  assert(closed.status === "resolved", "status applied");
  assert(closed.ruling?.verdict_reason === "because", "ruling linked");
  assert(t.frontier().length === 0, "no longer in frontier");
});

test("a closed (resolved) branch rejects further rulings", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  t.applyRuling(b.id, ruling(b.id, "resolved"));
  const r2 = t.applyRuling(b.id, ruling(b.id, "contested"));
  assert(!r2.ok && r2.error === "already_closed", r2.error ?? "expected already_closed");
  assert(t.get(b.id)!.status === "resolved", "status unchanged");
});

test("spawned questions become child branches at depth+1, bounded by max_children_per_node", () => {
  const p = getProfile("standard"); // max_children_per_node 3
  const t = new TreeState("standard", "subj", p);
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  // Spawning happens only on a FINAL ruling; "resolved" is final and may still surface
  // follow-up sub-questions. (A "contested" ruling with rounds left reopens, not spawns.)
  t.applyRuling(b.id, ruling(b.id, "resolved", 5)); // 5 spawned, cap 3
  const kids = t.frontier();
  assert(kids.length === 3, `capped to 3, got ${kids.length}`);
  assert(kids.every(k => k.depth === 1 && k.parent_id === b.id), "children parented at depth 1");
});

test("children are NOT spawned beyond max_depth", () => {
  const p = { ...getProfile("standard"), max_depth: 1 };
  const t = new TreeState("standard", "subj", p);
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]); // depth 0
  t.applyRuling(b.id, ruling(b.id, "resolved", 2));                   // final: kids depth 1 (== max), allowed
  const kids = t.frontier();
  assert(kids.length === 2, `two children at depth 1, got ${kids.length}`);
  kids.forEach(k => t.applyRuling(k.id, ruling(k.id, "resolved", 2))); // grandkids depth 2 > max, blocked
  assert(t.frontier().length === 0, "no branches past max_depth");
});

test("a re-contesting branch freezes as contested-needs-human after max_rounds_per_branch", () => {
  const p = { ...getProfile("standard"), max_rounds_per_branch: 2 };
  const t = new TreeState("standard", "subj", p);
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  // Round 1 contested -> reopened for another round
  t.applyRuling(b.id, ruling(b.id, "contested"));
  assert(t.get(b.id)!.status === "open", "reopened after round 1");
  // Round 2 contested -> frozen (rounds == max)
  t.applyRuling(b.id, ruling(b.id, "contested"));
  assert(t.get(b.id)!.status === "contested", "frozen as contested");
  assert(t.frontier().length === 0, "not retried again");
});

test("budgetExhaustRemaining marks all open branches budget_exhausted (no ruling needed)", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  t.seed([{ question: "Q1", recommended_answer: "A1" }, { question: "Q2", recommended_answer: "A2" }]);
  t.budgetExhaustRemaining();
  assert(t.frontier().length === 0, "nothing open");
  assert(t.all().every(b => b.status === "budget_exhausted"), "all marked exhausted");
});

test("terminated() is true when no open branches remain", () => {
  const t = new TreeState("standard", "subj", getProfile("standard"));
  const [b] = t.seed([{ question: "Q1", recommended_answer: "A1" }]);
  assert(!t.terminated(), "open at start");
  t.applyRuling(b.id, ruling(b.id, "resolved"));
  assert(t.terminated(), "terminated after last branch closes");
});

summarize();
