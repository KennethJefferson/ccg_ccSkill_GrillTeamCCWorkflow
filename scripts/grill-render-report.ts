// JSON in: { "tree": <TreeDoc>, "manifest": <CoverageManifest>, "coverage_gaps": "<md>", "run_manifest": {...} }
// JSON out: prints the markdown to stdout.
import { readFileSync } from "fs";
import { renderReport } from "../lib/report-render.ts";

const req = JSON.parse(readFileSync(0, "utf8"));
const md = renderReport(req.tree, { manifest: req.manifest, coverage_gaps: req.coverage_gaps, run_manifest: req.run_manifest });
process.stdout.write(md);
