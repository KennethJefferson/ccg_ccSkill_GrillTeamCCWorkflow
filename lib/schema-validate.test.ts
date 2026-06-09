import { validateAgainstSchema, loadSchema } from "./schema-validate.ts";
import { test, assert, summarize } from "./test-helpers.ts";

const ruling = loadSchema("ruling");

test("valid ruling passes", () => {
  const r = validateAgainstSchema({
    question_id: "G1", status: "resolved", verdict_reason: "ok",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [], spawned_questions: []
  }, ruling);
  assert(r.ok, JSON.stringify(r));
});

test("ruling missing required field fails", () => {
  const r = validateAgainstSchema({ question_id: "G1", status: "resolved" }, ruling);
  assert(!r.ok, "should fail");
  assert(r.errors.some(e => e.includes("verdict_reason")), "names missing field: " + r.errors.join(","));
});

test("ruling with bad enum status fails", () => {
  const r = validateAgainstSchema({
    question_id: "G1", status: "approved", verdict_reason: "x",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [], spawned_questions: []
  }, ruling);
  assert(!r.ok, "bad enum should fail");
});

summarize();
