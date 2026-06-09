// Runs every *.test.ts under the skill root in-process via dynamic import.
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { pathToFileURL } from "url";

const ROOT = join(import.meta.dirname, "..");

function findTests(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) findTests(full, acc);
    else if (name.endsWith(".test.ts")) acc.push(full);
  }
  return acc;
}

const files = findTests(ROOT).sort();
console.log(`Running ${files.length} test file(s):`);
for (const f of files) {
  console.log(`\n=== ${relative(ROOT, f)} ===`);
  await import(pathToFileURL(f).href);
}
