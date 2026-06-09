// JSON in: { "snapshot_root": "<abs>", "answer": <InterviewAnswer> }
// JSON out: { valid_claims: [...], dropped: [...] }
import { readFileSync } from "fs";
import { verifyAnswerCitations } from "../lib/citation-verify.ts";

const req = JSON.parse(readFileSync(0, "utf8"));
const r = verifyAnswerCitations(req.snapshot_root, req.answer);
process.stdout.write(JSON.stringify(r));
