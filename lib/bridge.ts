import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface BridgeEnvelope { ok: boolean; result?: any; error?: { code: string; message: string }; }
export type BridgeRunner = (request: object) => Promise<BridgeEnvelope>;

export interface Dispatch55Args { runId: string; nodeId: string; prompt: string; projectCwd: string; timeoutMs?: number; }
export type Dispatch55Result = { ok: true; text: string } | { ok: false; error: string };

/** Extract the model's text from a completed dispatch result (inline text or artifact response.md). */
function extractText(value: any): string | null {
  if (typeof value?.artifact_text === "string") return value.artifact_text;       // test/inline path
  if (typeof value?.artifact_path === "string") {                                 // real bridge path
    const p = join(value.artifact_path, "response.md");
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  return null;
}

export async function dispatch55(args: Dispatch55Args, runner: BridgeRunner): Promise<Dispatch55Result> {
  const request = {
    tool: "team_dispatch_node",
    project_cwd: args.projectCwd,
    params: {
      run_id: args.runId, node_id: args.nodeId, prompt: args.prompt,
      model_override: "codex",
      ...(args.timeoutMs ? { timeout_override: args.timeoutMs } : {}),
    },
  };
  let env: BridgeEnvelope;
  try { env = await runner(request); }
  catch (e: any) { return { ok: false, error: `bridge runner threw: ${e?.message ?? e}` }; }

  if (!env.ok) return { ok: false, error: `bridge error: ${env.error?.message ?? "unknown"}` };
  // team-tool wraps the manager's own envelope: result.ok / result.value
  const inner = env.result;
  if (inner && inner.ok === false) return { ok: false, error: `dispatch failed: ${inner.error?.message ?? "unknown"}` };
  // Inner is the manager's Result envelope: { ok:true, value:{...} }. A truthy ok:true
  // with no value is a protocol violation — surface it precisely rather than silently
  // falling back (which would just degrade to the vaguer "no text" error downstream).
  if (inner && inner.ok !== false && inner.value === undefined) {
    return { ok: false, error: "malformed inner envelope: ok:true but no value field" };
  }
  const value = inner?.value ?? inner;
  const text = extractText(value);
  if (text === null) return { ok: false, error: "no text in dispatch result (no artifact_text/response.md)" };
  return { ok: true, text };
}
