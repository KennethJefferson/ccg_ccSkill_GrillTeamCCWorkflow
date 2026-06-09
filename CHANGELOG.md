# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file is **append-only**: new entries are added at the top under a new version
heading; existing entries are never edited or removed.

## [Unreleased]

### Added
- Design specification (`DESIGN.md`) and task-by-task implementation plan (`PLAN.md`).
- Repository documentation: `README.md`, `USAGE.md`, `CLAUDE.md`, this `CHANGELOG.md`.

### Notes
- Design was hardened through two adversarial review rounds by an external model
  (55/Codex, max effort): round 1 verdict **BLOCK** (10 findings, 2 governance
  blockers), round 2 verdict **REVISE** (6 findings, 3 HIGH). All findings accepted
  and folded in. The implementation (`lib/` core, personas, prompts, `SKILL.md`,
  tests) is planned but not yet built.

## [0.1.0] - 2026-06-09

### Added
- Initial repository. Skill scaffold, design docs, and governance architecture for
  `/grill-team-CCworkflow` — a self-interrogating audit harness in which CC48 (Claude)
  facilitates a persona panel and an external model (55/Codex, via the PI team-bridge)
  casts every branch verdict, with branch closure enforced as a mechanical contract by
  a tree-state governance kernel.

[Unreleased]: https://github.com/KennethJefferson/ccg_ccSkill_GrillTeamCCWorkflow/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KennethJefferson/ccg_ccSkill_GrillTeamCCWorkflow/releases/tag/v0.1.0
