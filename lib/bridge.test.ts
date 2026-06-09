import { dispatch55, type BridgeRunner } from "./bridge.ts";
import { test, assert, summarize } from "./test-helpers.ts";

function fakeRunner(responses: string[]): BridgeRunner {
  let i = 0;
  return async () => ({ ok: true, result: { ok: true, value: { status: "completed", artifact_text: responses[i++] } } });
}

test("returns the model text on success", async () => {
  const r = await dispatch55({ runId: "R", nodeId: "n", prompt: "hi", projectCwd: "C:\\p" }, fakeRunner(["RULING JSON"]));
  assert(r.ok && r.text === "RULING JSON", JSON.stringify(r));
});

test("surfaces a bridge error envelope as fail-clean", async () => {
  const runner: BridgeRunner = async () => ({ ok: false, error: { code: "x", message: "boom" } });
  const r = await dispatch55({ runId: "R", nodeId: "n", prompt: "hi", projectCwd: "C:\\p" }, runner);
  assert(!r.ok && r.error.includes("boom"), JSON.stringify(r));
});

test("fails clean when the inner manager envelope reports ok:false", async () => {
  const runner: BridgeRunner = async () => ({ ok: true, result: { ok: false, error: { message: "node exploded" } } });
  const r = await dispatch55({ runId: "R", nodeId: "n", prompt: "hi", projectCwd: "C:\\p" }, runner);
  assert(!r.ok && r.error.includes("node exploded"), JSON.stringify(r));
});

test("fails clean when there is no text in the result", async () => {
  const runner: BridgeRunner = async () => ({ ok: true, result: { ok: true, value: { status: "completed" } } });
  const r = await dispatch55({ runId: "R", nodeId: "n", prompt: "hi", projectCwd: "C:\\p" }, runner);
  assert(!r.ok && r.error.includes("no text"), JSON.stringify(r));
});

test("fails clean on a malformed inner envelope (ok:true but no value field)", async () => {
  const runner: BridgeRunner = async () => ({ ok: true, result: { ok: true } });
  const r = await dispatch55({ runId: "R", nodeId: "n", prompt: "hi", projectCwd: "C:\\p" }, runner);
  assert(!r.ok && r.error.includes("malformed inner envelope"), JSON.stringify(r));
});

summarize();
