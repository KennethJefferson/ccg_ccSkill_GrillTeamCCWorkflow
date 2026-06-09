import { readFileSync, existsSync } from "fs";
import { join, isAbsolute } from "path";
import type { EvidenceRef, Claim, InterviewAnswer } from "./types.ts";

export type CiteReason = "ok" | "bad_path_line" | "file_not_found" | "line_out_of_range" | "snippet_not_at_line";
export interface CiteResult { ok: boolean; reason: CiteReason; }

export function verifyCitation(snapshotRoot: string, ref: EvidenceRef): CiteResult {
  const m = /^(.*):(\d+)$/.exec(ref.path_line);
  if (!m) return { ok: false, reason: "bad_path_line" };
  const rel = m[1];
  const lineNo = parseInt(m[2], 10);
  const full = isAbsolute(rel) ? rel : join(snapshotRoot, rel);
  if (!existsSync(full)) return { ok: false, reason: "file_not_found" };
  const lines = readFileSync(full, "utf8").split(/\r?\n/);
  if (lineNo < 1 || lineNo > lines.length) return { ok: false, reason: "line_out_of_range" };
  const target = lines[lineNo - 1];
  // Snippet must appear at the cited line (normalized whitespace, substring match).
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  if (!norm(target).includes(norm(ref.snippet))) return { ok: false, reason: "snippet_not_at_line" };
  return { ok: true, reason: "ok" };
}

export interface AnswerCiteResult { valid_claims: Claim[]; dropped: Claim[]; }

export function verifyAnswerCitations(snapshotRoot: string, answer: Pick<InterviewAnswer, "claims">): AnswerCiteResult {
  const valid_claims: Claim[] = [];
  const dropped: Claim[] = [];
  for (const c of answer.claims) {
    const allOk = c.evidence.length > 0 && c.evidence.every(e => verifyCitation(snapshotRoot, e).ok);
    (allOk ? valid_claims : dropped).push(c);
  }
  return { valid_claims, dropped };
}
