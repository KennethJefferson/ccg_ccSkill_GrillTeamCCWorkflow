import { validateRulingBatch } from "./ruling-validate.ts";
import { test, assert, summarize } from "./test-helpers.ts";

const expected = ["B1", "B2"];

function r(qid: string, status = "resolved") {
  return { question_id: qid, status, verdict_reason: "ok",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [], spawned_questions: [] };
}

test("a well-formed batch covering all expected branches passes", () => {
  const out = validateRulingBatch(JSON.stringify([r("B1"), r("B2")]), expected);
  assert(out.ok, JSON.stringify(out));
  if (out.ok) assert(out.rulings.length === 2, "two rulings");
});

test("malformed JSON => retry, raw preserved", () => {
  const out = validateRulingBatch("[not json", expected);
  assert(!out.ok && out.action === "retry", "retry");
  assert(out.raw === "[not json", "raw preserved");
});

test("a ruling for an unknown branch id fails", () => {
  const out = validateRulingBatch(JSON.stringify([r("B1"), r("GHOST")]), expected);
  assert(!out.ok && out.reason === "unknown_branch_id", out.reason ?? "");
});

test("a chunk missing a required branch fails (incomplete coverage)", () => {
  const out = validateRulingBatch(JSON.stringify([r("B1")]), expected);
  assert(!out.ok && out.reason === "incomplete_coverage", out.reason ?? "");
});

test("a disallowed status value fails schema", () => {
  const out = validateRulingBatch(JSON.stringify([r("B1","approved"), r("B2")]), expected);
  assert(!out.ok && out.reason === "schema_invalid", out.reason ?? "");
});

test("a single ruling object (not array) is accepted when one branch is expected", () => {
  const out = validateRulingBatch(JSON.stringify(r("B1")), ["B1"]);
  assert(out.ok, JSON.stringify(out));
});

summarize();
