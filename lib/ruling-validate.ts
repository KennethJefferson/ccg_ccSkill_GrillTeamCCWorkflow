import type { Ruling } from "./types.ts";
import { loadSchema, validateAgainstSchema } from "./schema-validate.ts";

export type ValidateOutcome =
  | { ok: true; rulings: Ruling[] }
  | { ok: false; action: "retry"; reason: string; raw: string; errors?: string[] };

const rulingSchema = loadSchema("ruling");

export function validateRulingBatch(raw: string, expectedIds: string[]): ValidateOutcome {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { return { ok: false, action: "retry", reason: "json_parse_error", raw }; }

  const arr: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

  for (const item of arr) {
    const v = validateAgainstSchema(item, rulingSchema);
    if (!v.ok) return { ok: false, action: "retry", reason: "schema_invalid", raw, errors: v.errors };
  }
  const rulings = arr as Ruling[];

  const got = new Set(rulings.map(r => r.question_id));
  for (const r of rulings) {
    if (!expectedIds.includes(r.question_id)) {
      return { ok: false, action: "retry", reason: "unknown_branch_id", raw };
    }
  }
  for (const id of expectedIds) {
    if (!got.has(id)) return { ok: false, action: "retry", reason: "incomplete_coverage", raw };
  }
  return { ok: true, rulings };
}
