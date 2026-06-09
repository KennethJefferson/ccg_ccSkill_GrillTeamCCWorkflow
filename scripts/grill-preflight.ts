// JSON in: { "team_tool_path": "<abs>", "pi_repo_root": "<abs>", "subject_path": "<abs>" }
// JSON out: { ok, checks: {bridge, pi_repo, subject}, message }
import { existsSync } from "fs";
import { readFileSync } from "fs";

const raw = readFileSync(0, "utf8");
const req = JSON.parse(raw || "{}");
const checks = {
  bridge: !!req.team_tool_path && existsSync(req.team_tool_path),
  pi_repo: !!req.pi_repo_root && existsSync(req.pi_repo_root),
  subject: !!req.subject_path && existsSync(req.subject_path),
};
const ok = checks.bridge && checks.pi_repo && checks.subject;
const message = ok
  ? "preflight ok"
  : `preflight FAILED: ${Object.entries(checks).filter(([,v]) => !v).map(([k]) => k).join(", ")} missing. ` +
    `55 is the only judge; refusing to run without the bridge.`;
process.stdout.write(JSON.stringify({ ok, checks, message }));
process.exit(ok ? 0 : 1);
