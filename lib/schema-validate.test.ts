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

test("ruling with empty verdict_reason fails minLength", () => {
  const r = validateAgainstSchema({
    question_id: "G1", status: "resolved", verdict_reason: "",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [], spawned_questions: []
  }, ruling);
  assert(!r.ok, "empty verdict_reason should fail");
  assert(
    r.errors.some(e => e.includes("verdict_reason") || e.includes("minLength")),
    "names field or minLength: " + r.errors.join(",")
  );
});

test("array items recurse with correct index in path", () => {
  const r = validateAgainstSchema({
    question_id: "G1", status: "resolved", verdict_reason: "ok",
    evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [],
    spawned_questions: [
      { question: "q", rationale: "r", stakes: "high" },
      { question: "q", rationale: "r", stakes: "critical" }
    ]
  }, ruling);
  assert(!r.ok, "bad stakes enum in second item should fail");
  assert(
    r.errors.some(e => e.includes("spawned_questions[1]")),
    "error path carries array index: " + r.errors.join(",")
  );
});

const tree = loadSchema("tree");

test("tree union type parent_id accepts string|null", () => {
  const r = validateAgainstSchema({
    mode: "quick", subject: "s", branches: [
      { id: "B1", parent_id: null, depth: 0, question: "q", recommended_answer: "a", status: "open", rounds: 0, panel_answers: [], ruling: null }
    ]
  }, tree);
  assert(r.ok, JSON.stringify(r));
});

test("tree union type rejects parent_id number", () => {
  const r = validateAgainstSchema({
    mode: "quick", subject: "s", branches: [
      { id: "B1", parent_id: 42, depth: 0, question: "q", recommended_answer: "a", status: "open", rounds: 0, panel_answers: [], ruling: null }
    ]
  }, tree);
  assert(!r.ok, "numeric parent_id should fail string|null union");
});

summarize();
