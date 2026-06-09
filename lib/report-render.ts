import type { Branch, BranchStatus, CoverageManifest } from "./types.ts";

interface TreeDoc { mode: string; subject: string; branches: Branch[]; }
interface RenderExtras {
  manifest: CoverageManifest;
  coverage_gaps: string;
  run_manifest: Record<string, unknown>;
}

export function renderReport(tree: TreeDoc, extras: RenderExtras): string {
  const counts: Record<BranchStatus, number> = {
    open: 0, resolved: 0, contested: 0, budget_exhausted: 0, out_of_scope: 0,
  };
  for (const b of tree.branches) counts[b.status]++;

  const out: string[] = [];
  out.push(`# Grill Report — ${tree.subject}`, "");
  out.push(`## Executive Summary`, "");
  out.push(`- Mode: ${tree.mode}`);
  out.push(`- resolved: ${counts.resolved}`);
  out.push(`- contested (needs human): ${counts.contested}`);
  out.push(`- budget_exhausted: ${counts.budget_exhausted}`);
  out.push(`- out_of_scope: ${counts.out_of_scope}`);
  out.push(`- open (unreached): ${counts.open}`, "");

  out.push(`## Decision Tree`, "");
  for (const b of tree.branches) {
    out.push(`### ${b.id} — ${b.status}  _(depth ${b.depth})_`);
    out.push(`**Question:** ${b.question}`);
    out.push(`**CC48 recommended:** ${b.recommended_answer}`);
    if (b.panel_answers.length) {
      out.push(`**Panel:**`);
      for (const a of b.panel_answers) {
        const cites = a.claims.flatMap(c => c.evidence.map(e => e.path_line));
        out.push(`- _${a.persona}_: ${a.answer}${cites.length ? `  \`[${cites.join(", ")}]\`` : ""}`);
        if (a.refutations.length) out.push(`  - refutes: ${a.refutations.join("; ")}`);
      }
    }
    if (b.ruling) {
      out.push(`**55 ruling (${b.ruling.status}):** ${b.ruling.verdict_reason}`);
      if (b.ruling.evidence_required.length) out.push(`  - evidence required: ${b.ruling.evidence_required.join("; ")}`);
    } else {
      out.push(`**55 ruling:** _(none — branch not closed by a ruling)_`);
    }
    out.push("");
  }

  out.push(`## Coverage Gaps`, "");
  out.push(extras.coverage_gaps || "_(none reported)_", "");
  out.push(`Files covered: ${extras.manifest.files_covered.length}; excluded: ${extras.manifest.files_excluded.length}; deferred-gaps checked: ${extras.manifest.deferred_gaps_checked.join(", ") || "none"}.`, "");

  out.push(`## Appendix — Raw Panel Exchanges`, "");
  for (const b of tree.branches) {
    out.push(`<details><summary>${b.id}</summary>`, "");
    out.push("```json", JSON.stringify(b.panel_answers, null, 2), "```", "</details>", "");
  }

  out.push(`## Run Manifest`, "");
  out.push("```json", JSON.stringify(extras.run_manifest, null, 2), "```");

  return out.join("\n");
}
