import type { Branch, BudgetProfile, Mode, Ruling, InterviewAnswer } from "./types.ts";

export interface ApplyResult { ok: boolean; error?: "unknown_branch" | "already_closed"; }
interface SeedSpec { question: string; recommended_answer: string; }

export class TreeState {
  private branches = new Map<string, Branch>();
  private seq = 0;
  constructor(
    private readonly mode: Mode,
    private readonly subject: string,
    private readonly profile: BudgetProfile,
  ) {}

  private newId(prefix = "B"): string { return `${prefix}${++this.seq}`; }

  seed(specs: SeedSpec[]): Branch[] {
    return specs.map(s => this.insert(null, 0, s.question, s.recommended_answer));
  }

  private insert(parent_id: string | null, depth: number, question: string, recommended_answer: string): Branch {
    const b: Branch = {
      id: this.newId(), parent_id, depth, question, recommended_answer,
      status: "open", rounds: 0, panel_answers: [], ruling: null,
    };
    this.branches.set(b.id, b);
    return b;
  }

  get(id: string): Branch | undefined { return this.branches.get(id); }
  all(): Branch[] { return [...this.branches.values()]; }
  frontier(): Branch[] { return this.all().filter(b => b.status === "open"); }
  terminated(): boolean { return this.frontier().length === 0; }

  attachPanel(id: string, answers: InterviewAnswer[]): void {
    const b = this.branches.get(id);
    if (b) b.panel_answers = answers;
  }

  /** The ONLY path to a closed status. Refuses unknown branches; applies the ruling's status verbatim.
   *  A branch is re-rulable only while its status is "open". Any terminal status (including a FROZEN
   *  "contested", which is only ever set when rounds have run out) is final and rejects further rulings. */
  applyRuling(branchId: string, ruling: Ruling): ApplyResult {
    const b = this.branches.get(branchId);
    if (!b) return { ok: false, error: "unknown_branch" };
    if (b.status !== "open") return { ok: false, error: "already_closed" };
    b.rounds++;

    // Contested + still has rounds left => reopen for another grilling round, do NOT spawn yet.
    if (ruling.status === "contested" && b.rounds < this.profile.max_rounds_per_branch) {
      b.status = "open";
      b.ruling = ruling;
      return { ok: true };
    }

    // Otherwise the ruling is final for this branch.
    b.status = ruling.status;
    b.ruling = ruling;

    // Spawn children (bounded) for any final ruling that produced follow-ups.
    const childDepth = b.depth + 1;
    if (childDepth <= this.profile.max_depth) {
      const capped = ruling.spawned_questions.slice(0, this.profile.max_children_per_node);
      for (const sq of capped) this.insert(b.id, childDepth, sq.question, sq.rationale);
    }
    return { ok: true };
  }

  budgetExhaustRemaining(): void {
    for (const b of this.branches.values()) {
      if (b.status === "open") b.status = "budget_exhausted";
    }
  }

  toJSON(): object {
    return { mode: this.mode, subject: this.subject, branches: this.all() };
  }
}
