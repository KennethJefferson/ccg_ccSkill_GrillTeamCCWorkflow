// Tiny test harness matching project convention (inline assert/test).
let passed = 0;
let failed = 0;
const pending: Promise<void>[] = [];

export function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

export function test(name: string, fn: () => void | Promise<void>): void {
  const p = (async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`  ✗ ${name}: ${e.message}`);
      failed++;
    }
  })();
  pending.push(p);
}

export function summarize(): void {
  Promise.all(pending).then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  }).catch((e) => {
    console.error("test harness error:", e);
    process.exit(1);
  });
}
