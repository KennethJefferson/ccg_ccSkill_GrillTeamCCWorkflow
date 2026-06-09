export type Mode = "quick" | "standard" | "deep";
export type BranchStatus = "open" | "resolved" | "contested" | "budget_exhausted" | "out_of_scope";
export type Confidence = "low" | "medium" | "high";
export type Stakes = "low" | "med" | "high";

export interface EvidenceRef { path_line: string; snippet: string; }

export interface Claim { claim: string; evidence: EvidenceRef[]; confidence: Confidence; }

export interface InterviewAnswer {
  persona: string;
  question_id: string;
  answer: string;
  claims: Claim[];
  assumptions: string[];
  refutations: string[];
  follow_up_questions: string[];
  open_unknowns: string[];
}

export interface SpawnedQuestion { question: string; rationale: string; stakes: Stakes; }

export interface Ruling {
  question_id: string;
  status: Exclude<BranchStatus, "open">;     // a ruling never yields "open"
  verdict_reason: string;
  evidence_required: string[];
  unresolved_assumptions: string[];
  rejected_alternatives: string[];
  spawned_questions: SpawnedQuestion[];
}

export interface Branch {
  id: string;
  parent_id: string | null;
  depth: number;
  question: string;
  recommended_answer: string;
  status: BranchStatus;
  rounds: number;                            // times this branch has been judged
  panel_answers: InterviewAnswer[];
  ruling: Ruling | null;                     // the LINKED 55 ruling; null until closed by one
}

export interface BudgetProfile {
  max_depth: number;
  max_questions: number;
  max_children_per_node: number;
  max_rounds_per_branch: number;
  max_agent_calls: number;
  max_branches_per_judge_batch: number;
  max_55_input_tokens: number;
  max_55_calls: number;
  max_wall_clock_ms: number;
  max_report_tokens: number;
}

export interface CoverageManifest {
  files_covered: string[];
  files_excluded: { path: string; why: string }[];
  deferred_gaps_checked: string[];
  open_unknowns: string[];
}
