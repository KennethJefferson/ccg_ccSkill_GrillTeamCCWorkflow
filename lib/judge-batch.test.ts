import { buildDigest, chunkFrontier, estimateTokens } from "./judge-batch.ts";
import { getProfile } from "./budget.ts";
import { test, assert, summarize } from "./test-helpers.ts";
import type { Branch } from "./types.ts";

function branch(id: string, answers = 2): Branch {
  return { id, parent_id: null, depth: 0, question: `Question ${id}?`,
    recommended_answer: "Recommended.", status: "open", rounds: 0,
    panel_answers: Array.from({ length: answers }, (_, i) => ({
      persona: ["architect","skeptic","scout"][i % 3], question_id: id, answer: "ans",
      claims: [{ claim: "c", evidence: [{ path_line: "f.ts:1", snippet: "s" }], confidence: "medium" }],
      assumptions: [], refutations: ["maybe wrong"], follow_up_questions: [], open_unknowns: [] })),
    ruling: null };
}

test("digest includes question, recommended answer, and panel claims/refutations", () => {
  const d = buildDigest(branch("B1"));
  assert(d.includes("Question B1?"), "has question");
  assert(d.includes("Recommended."), "has recommended answer");
  assert(d.includes("maybe wrong"), "has refutation");
});

test("chunkFrontier respects the branch-count cap", () => {
  const p = { ...getProfile("standard"), max_branches_per_judge_batch: 3, max_55_input_tokens: 10_000_000 };
  const frontier = Array.from({ length: 7 }, (_, i) => branch(`B${i}`));
  const chunks = chunkFrontier(frontier, p);
  assert(chunks.length === 3, `7 / cap 3 => 3 chunks, got ${chunks.length}`);
  assert(chunks[0].length === 3 && chunks[2].length === 1, "3+3+1");
});

test("chunkFrontier splits earlier when token cap is the binding constraint", () => {
  const big = branch("BIG");
  big.question = "Q".repeat(9000); // ~9200-char digest => ~2300 tokens, over the 2000 cap
  const p = { ...getProfile("standard"), max_branches_per_judge_batch: 99, max_55_input_tokens: 2000 };
  const chunks = chunkFrontier([big, branch("B2"), branch("B3")], p);
  assert(chunks.length >= 2, `token cap forces a split, got ${chunks.length} chunks`);
});

test("a single branch over the token cap still yields its own chunk (never dropped)", () => {
  const huge = branch("HUGE");
  huge.question = "Q".repeat(50000);
  const p = { ...getProfile("standard"), max_branches_per_judge_batch: 99, max_55_input_tokens: 1000 };
  const chunks = chunkFrontier([huge], p);
  assert(chunks.length === 1 && chunks[0].length === 1, "oversized branch is isolated, not lost");
});

summarize();
