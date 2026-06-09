import { verifyCitation, verifyAnswerCitations } from "./citation-verify.ts";
import { test, assert, summarize } from "./test-helpers.ts";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function snapshotWith(rel: string, lines: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "grill-snap-"));
  const full = join(dir, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, lines.join("\n"));
  return dir;
}

test("citation with a matching snippet at the line is valid", () => {
  const snap = snapshotWith("a.ts", ["line one", "const x = 42;", "line three"]);
  const r = verifyCitation(snap, { path_line: "a.ts:2", snippet: "const x = 42;" });
  assert(r.ok, JSON.stringify(r));
});

test("citation whose snippet is NOT at that line is rejected (false claim)", () => {
  const snap = snapshotWith("a.ts", ["line one", "const x = 42;"]);
  const r = verifyCitation(snap, { path_line: "a.ts:1", snippet: "const x = 42;" });
  assert(!r.ok, "snippet is on line 2, not 1");
  assert(r.reason === "snippet_not_at_line", r.reason);
});

test("citation to a missing file is rejected", () => {
  const snap = snapshotWith("a.ts", ["x"]);
  const r = verifyCitation(snap, { path_line: "ghost.ts:1", snippet: "x" });
  assert(!r.ok && r.reason === "file_not_found", r.reason);
});

test("malformed path_line is rejected", () => {
  const snap = snapshotWith("a.ts", ["x"]);
  const r = verifyCitation(snap, { path_line: "a.ts", snippet: "x" });
  assert(!r.ok && r.reason === "bad_path_line", r.reason);
});

test("verifyAnswerCitations partitions valid vs dropped claims", () => {
  const snap = snapshotWith("a.ts", ["alpha", "beta"]);
  const answer: any = { claims: [
    { claim: "good", evidence: [{ path_line: "a.ts:1", snippet: "alpha" }], confidence: "high" },
    { claim: "bad",  evidence: [{ path_line: "a.ts:2", snippet: "WRONG" }], confidence: "high" },
  ] };
  const r = verifyAnswerCitations(snap, answer);
  assert(r.valid_claims.length === 1 && r.valid_claims[0].claim === "good", "kept good");
  assert(r.dropped.length === 1 && r.dropped[0].claim === "bad", "dropped bad");
});

summarize();
