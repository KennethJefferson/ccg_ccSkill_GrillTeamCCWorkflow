import type { Mode, BudgetProfile } from "./types.ts";

const PROFILES: Record<Mode, BudgetProfile> = {
  quick:    { max_depth: 2, max_questions: 8,  max_children_per_node: 2, max_rounds_per_branch: 1,
              max_agent_calls: 30,  max_branches_per_judge_batch: 4, max_55_input_tokens: 40_000,
              max_55_calls: 9, max_wall_clock_ms: 30 * 60_000,  max_report_tokens: 6_000 },
  standard: { max_depth: 4, max_questions: 24, max_children_per_node: 3, max_rounds_per_branch: 2,
              max_agent_calls: 96,  max_branches_per_judge_batch: 6, max_55_input_tokens: 60_000,
              max_55_calls: 18, max_wall_clock_ms: 120 * 60_000, max_report_tokens: 15_000 },
  deep:     { max_depth: 6, max_questions: 60, max_children_per_node: 4, max_rounds_per_branch: 3,
              max_agent_calls: 240, max_branches_per_judge_batch: 8, max_55_input_tokens: 80_000,
              max_55_calls: 40, max_wall_clock_ms: 6 * 60 * 60_000, max_report_tokens: 40_000 },
};

export function getProfile(mode: Mode): BudgetProfile {
  return { ...PROFILES[mode] };
}

export type TripReason =
  | "max_questions" | "max_agent_calls" | "max_55_calls" | "max_depth" | "max_wall_clock" | null;

export class BudgetTracker {
  private questions = 0;
  private agentCalls = 0;
  private calls55 = 0;
  private maxDepthSeen = 0;
  private readonly start: number;
  constructor(private readonly p: BudgetProfile, private readonly clock: () => number = () => 0) {
    this.start = clock();
  }
  spendQuestion(): void { this.questions++; }
  spendAgentCall(): void { this.agentCalls++; }
  spend55(): void { this.calls55++; }
  observeDepth(d: number): void { if (d > this.maxDepthSeen) this.maxDepthSeen = d; }

  snapshot(): Record<string, number> {
    return { questions: this.questions, agentCalls: this.agentCalls, calls55: this.calls55,
             maxDepthSeen: this.maxDepthSeen, elapsed_ms: this.clock() - this.start };
  }

  tripped(): TripReason {
    if (this.questions > this.p.max_questions) return "max_questions";
    if (this.agentCalls > this.p.max_agent_calls) return "max_agent_calls";
    if (this.calls55 > this.p.max_55_calls) return "max_55_calls";
    if (this.maxDepthSeen > this.p.max_depth) return "max_depth";
    if (this.clock() - this.start > this.p.max_wall_clock_ms) return "max_wall_clock";
    return null;
  }
}
