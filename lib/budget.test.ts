import { getProfile, BudgetTracker } from "./budget.ts";
import { test, assert, summarize } from "./test-helpers.ts";

test("standard profile has the documented caps", () => {
  const p = getProfile("standard");
  assert(p.max_depth === 4, "depth");
  assert(p.max_questions === 24, "questions");
  assert(p.max_55_calls === 18, "55 calls");
  assert(p.max_branches_per_judge_batch === 6, "batch width");
});

test("tracker reports the first cap that trips", () => {
  const t = new BudgetTracker(getProfile("quick")); // max_questions 8, max_55_calls 10
  for (let i = 0; i < 8; i++) t.spendQuestion();
  assert(t.tripped() === null, "not tripped at exactly the cap");
  t.spendQuestion();
  assert(t.tripped() === "max_questions", "trips on the 9th question");
});

test("every 55 call decrements the same counter (agenda, level, chunk, retry, coverage)", () => {
  const t = new BudgetTracker(getProfile("quick")); // max_55_calls 10
  // Spend exactly the cap (10); each spend is still within budget.
  for (let i = 0; i < 10; i++) { assert(t.tripped() === null, `call ${i}`); t.spend55(); }
  assert(t.tripped() === null, "exactly at the cap is still OK");
  t.spend55(); // the 11th call exceeds the cap
  assert(t.tripped() === "max_55_calls", "trips on the 11th 55 call");
});

test("wall clock trips against an injected clock", () => {
  let now = 1000;
  const t = new BudgetTracker(getProfile("quick"), () => now); // max_wall_clock_ms 1_800_000
  assert(t.tripped() === null, "fresh");
  now = 1000 + 1_800_001;
  assert(t.tripped() === "max_wall_clock", "trips after the window");
});

summarize();
