import type { Branch, BudgetProfile } from "./types.ts";

/** Cheap, dependency-free token estimate: ~4 chars/token. */
export function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

/** A compact per-branch digest for the judge — question + recommendation + panel positions, not raw everything. */
export function buildDigest(b: Branch): string {
  const lines: string[] = [];
  lines.push(`### Branch ${b.id} (depth ${b.depth})`);
  lines.push(`Question: ${b.question}`);
  lines.push(`CC48 recommended answer: ${b.recommended_answer}`);
  for (const a of b.panel_answers) {
    lines.push(`- [${a.persona}] ${a.answer}`);
    if (a.claims.length) lines.push(`  claims: ${a.claims.map(c => `${c.claim} (${c.evidence.map(e => e.path_line).join("; ")})`).join(" | ")}`);
    if (a.refutations.length) lines.push(`  refutations: ${a.refutations.join(" | ")}`);
    if (a.open_unknowns.length) lines.push(`  open_unknowns: ${a.open_unknowns.join(" | ")}`);
  }
  return lines.join("\n");
}

/** Partition the frontier into judge batches bounded by BOTH the count cap and the token cap.
 *  An oversized single branch is never split or dropped — it gets its own chunk. */
export function chunkFrontier(frontier: Branch[], p: BudgetProfile): Branch[][] {
  const chunks: Branch[][] = [];
  let cur: Branch[] = [];
  let curTokens = 0;
  for (const b of frontier) {
    const t = estimateTokens(buildDigest(b));
    const wouldExceedCount = cur.length + 1 > p.max_branches_per_judge_batch;
    const wouldExceedTokens = cur.length > 0 && curTokens + t > p.max_55_input_tokens;
    if (cur.length > 0 && (wouldExceedCount || wouldExceedTokens)) {
      chunks.push(cur); cur = []; curTokens = 0;
    }
    cur.push(b);
    curTokens += t;
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
}
