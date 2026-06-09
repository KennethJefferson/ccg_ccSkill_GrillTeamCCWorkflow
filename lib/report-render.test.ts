import { renderReport } from "./report-render.ts";
import { test, assert, summarize } from "./test-helpers.ts";
import type { Branch } from "./types.ts";

function tree(branches: Branch[]) { return { mode: "standard" as const, subject: "cc-team-workflow", branches }; }
function b(id: string, status: Branch["status"], reason: string): Branch {
  return { id, parent_id: null, depth: 0, question: `Q-${id}`, recommended_answer: `Rec-${id}`,
    status, rounds: 1, panel_answers: [{ persona: "skeptic", question_id: id, answer: "panel says",
      claims: [], assumptions: [], refutations: [], follow_up_questions: [], open_unknowns: [] }],
    ruling: status === "open" ? null : { question_id: id, status: status as any, verdict_reason: reason,
      evidence_required: [], unresolved_assumptions: [], rejected_alternatives: [], spawned_questions: [] } };
}

test("report has all five sections", () => {
  const md = renderReport(tree([b("B1","resolved","clear")]),
    { manifest: { files_covered: ["a.ts"], files_excluded: [], deferred_gaps_checked: ["dual-validator"], open_unknowns: [] },
      coverage_gaps: "Nothing major missed.", run_manifest: { mode: "standard", subject: "x", budgets_spent: {}, calls_55: 6, wall_clock_ms: 1000, preflight_ok: true } });
  for (const h of ["# Grill Report","## Executive Summary","## Decision Tree","## Coverage Gaps","## Appendix","## Run Manifest"]) {
    assert(md.includes(h), `missing section: ${h}`);
  }
});

test("executive summary counts statuses", () => {
  const md = renderReport(tree([b("B1","resolved","r"), b("B2","contested","c"), b("B3","budget_exhausted","x")]),
    { manifest: { files_covered: [], files_excluded: [], deferred_gaps_checked: [], open_unknowns: [] },
      coverage_gaps: "", run_manifest: { mode: "standard", subject: "x", budgets_spent: {}, calls_55: 6, wall_clock_ms: 1, preflight_ok: true } });
  assert(/resolved.*1/i.test(md), "1 resolved");
  assert(/contested.*1/i.test(md), "1 contested");
  assert(/budget.exhausted.*1/i.test(md), "1 budget_exhausted");
});

test("each branch renders the 55 verdict verbatim", () => {
  const md = renderReport(tree([b("B1","contested","THE EXACT VERDICT TEXT")]),
    { manifest: { files_covered: [], files_excluded: [], deferred_gaps_checked: [], open_unknowns: [] },
      coverage_gaps: "", run_manifest: { mode: "standard", subject: "x", budgets_spent: {}, calls_55: 1, wall_clock_ms: 1, preflight_ok: true } });
  assert(md.includes("THE EXACT VERDICT TEXT"), "verbatim verdict present");
});

summarize();
