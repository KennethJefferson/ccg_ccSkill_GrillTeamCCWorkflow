import { readFileSync } from "fs";
import { join } from "path";

export interface ValidationResult { ok: boolean; errors: string[]; }
type Schema = any;

const SCHEMA_DIR = join(import.meta.dirname, "..", "schemas");

export function loadSchema(name: string): Schema {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, `${name}.schema.json`), "utf8"));
}

export function validateAgainstSchema(value: unknown, schema: Schema, path = "$"): ValidationResult {
  const errors: string[] = [];
  walk(value, schema, path, errors);
  return { ok: errors.length === 0, errors };
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (Number.isInteger(v)) return "integer";
  return typeof v;
}

function matchesType(v: unknown, t: string): boolean {
  if (t === "number") return typeof v === "number" && Number.isFinite(v);
  if (t === "integer") return Number.isInteger(v);
  return typeOf(v) === t;
}

function walk(v: unknown, schema: Schema, path: string, errors: string[]): void {
  if (schema.enum && !schema.enum.includes(v)) {
    errors.push(`${path}: ${JSON.stringify(v)} not in enum [${schema.enum.join(",")}]`);
    return;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t: string) => matchesType(v, t))) {
      errors.push(`${path}: expected ${types.join("|")}, got ${typeOf(v)}`);
      return;
    }
  }
  if (typeof v === "string" && typeof schema.minLength === "number" && v.length < schema.minLength) {
    errors.push(`${path}: string shorter than minLength ${schema.minLength}`);
  }
  if (typeOf(v) === "object" && schema.properties) {
    for (const req of schema.required ?? []) {
      if (!(req in (v as object))) errors.push(`${path}.${req}: required field missing`);
    }
    for (const [k, sub] of Object.entries(schema.properties)) {
      if (k in (v as any)) walk((v as any)[k], sub, `${path}.${k}`, errors);
    }
  }
  if (Array.isArray(v) && schema.items) {
    v.forEach((item, i) => walk(item, schema.items, `${path}[${i}]`, errors));
  }
}
