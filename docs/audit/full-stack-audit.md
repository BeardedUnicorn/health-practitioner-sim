# Full-Stack Audit Report

## Scope
- Client: React + TypeScript app under `/Users/mike/code/nurse-trainer/src`
- Desktop runtime: Tauri + Rust under `/Users/mike/code/nurse-trainer/src-tauri`
- Focus: composition architecture, reliability, React 19 migration, and local quality gates

## Baseline Command Snapshot (Before Refactor)
- `yarn lint`: failed with 14 errors (unused state, case-block declarations, constant-condition streaming loops, unused props/params, JSX unescaped apostrophes)
- `yarn build`: failed on TypeScript errors in app + coach + message + profession config
- `cargo check`: passing
- `cargo clippy --all-targets --all-features -- -D warnings`: passing

## Findings

### P0 Build and Lint Instability
- Evidence
  - Type/lint blockers were present in app/session messaging/coach/config paths in pre-refactor runs.
  - Core failures included build-breaking unused declarations and streaming loop lint violations.
- Impact
  - Local verification was not trustworthy, and refactors could not be safely validated.
- Fix Strategy
  - Replace failing code paths and remove unused state/props.
  - Consolidate stream parsing in shared utilities.
  - Add tests and a single local `verify` gate.

### P1 Composition and State Architecture Risk
- Evidence
  - Session orchestration and screen routing were tightly coupled in one monolithic root component.
  - Message rendering and chat behavior mixed multiple mode branches in monolithic components.
- Impact
  - High change risk, hard testing boundaries, and frequent prop drilling.
- Fix Strategy
  - Introduce provider contracts (`state/actions/meta`) for app/session/coach.
  - Split monolith into `AppShell`, `SessionWorkspace`, conversation variants, and composer variants.

### P1 Async Duplication and Reliability Gaps
- Evidence
  - Coach panel and inline suggestions previously duplicated prompt/parse/request logic.
  - Streaming and completion parsing logic was repeated across flows.
- Impact
  - Increased race-condition risk and inconsistent error handling.
- Fix Strategy
  - Introduce shared LLM utilities (`client`, `stream-parser`, `json-parser`).
  - Centralize coach suggestion fetch/parse logic in `useCoachSuggestions`.

### P2 Tauri Boundary Minimalism
- Evidence
  - Placeholder command surface and permissive connect CSP policy.
- Impact
  - Weak runtime introspection and over-broad network policy.
- Fix Strategy
  - Replace placeholder command with `runtime_info` contract.
  - Add frontend runtime adapter with web fallback.
  - Restrict CSP connect policy to localhost HTTP + HTTPS-only remote.

## Roadmap-to-Implementation Mapping

### 1) Audit Artifact
- Added: `/Users/mike/code/nurse-trainer/docs/audit/full-stack-audit.md`

### 2) Stabilize Baseline + React 19
- Updated deps and scripts in `/Users/mike/code/nurse-trainer/package.json`
- Migrated runtime to React 19-compatible dependency set
- Kept root rendering on `createRoot` in `/Users/mike/code/nurse-trainer/src/main.tsx`

### 3) Provider Composition for App + Session
- Added app contracts
  - `/Users/mike/code/nurse-trainer/src/app/state/app-types.ts`
  - `/Users/mike/code/nurse-trainer/src/app/state/app-reducer.ts`
  - `/Users/mike/code/nurse-trainer/src/app/state/app-context.tsx`
- Added session contracts/runtime
  - `/Users/mike/code/nurse-trainer/src/features/session/state/session-reducer.ts`
  - `/Users/mike/code/nurse-trainer/src/features/session/state/session-context.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/hooks/useSessionRuntime.ts`
- Thin composition root
  - `/Users/mike/code/nurse-trainer/src/App.tsx`
  - `/Users/mike/code/nurse-trainer/src/app/AppShell.tsx`

### 4) Explicit Composition Variants for Session UI
- Added
  - `/Users/mike/code/nurse-trainer/src/features/session/components/SessionWorkspace.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/SessionToolbar.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/Composer.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/conversation/SinglePatientConversation.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/conversation/CouplesConversation.tsx`
- Removed monoliths
  - `/Users/mike/code/nurse-trainer/src/components/ChatContainer.tsx`
  - `/Users/mike/code/nurse-trainer/src/components/Message.tsx`

### 5) Unified Coach Logic + Reliability Utilities
- Added
  - `/Users/mike/code/nurse-trainer/src/features/coach/state/coach-context.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/coach/hooks/useCoachSuggestions.ts`
  - `/Users/mike/code/nurse-trainer/src/features/coach/components/CoachPanel.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/coach/components/InlineCoach.tsx`
  - `/Users/mike/code/nurse-trainer/src/shared/llm/json-parser.ts`
  - `/Users/mike/code/nurse-trainer/src/shared/llm/client.ts`
  - `/Users/mike/code/nurse-trainer/src/shared/llm/stream-parser.ts`
- Removed old coach monolith
  - `/Users/mike/code/nurse-trainer/src/components/Coach.tsx`

### 6) Tauri Hardening + Adapter
- Updated command surface + tests
  - `/Users/mike/code/nurse-trainer/src-tauri/src/lib.rs`
- Added frontend adapter
  - `/Users/mike/code/nurse-trainer/src/integrations/tauri/runtime-info.ts`
- Tightened CSP
  - `/Users/mike/code/nurse-trainer/src-tauri/tauri.conf.json`

### 7) Targeted Critical-Path Tests
- Added harness
  - `/Users/mike/code/nurse-trainer/vitest.config.ts`
  - `/Users/mike/code/nurse-trainer/src/test/setup.ts`
- Added test files
  - `/Users/mike/code/nurse-trainer/src/shared/llm/__tests__/stream-parser.test.ts`
  - `/Users/mike/code/nurse-trainer/src/features/session/state/__tests__/session-reducer.test.ts`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/__tests__/SessionWorkspace.test.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/session/components/conversation/__tests__/conversation-variants.test.tsx`
  - `/Users/mike/code/nurse-trainer/src/features/coach/hooks/__tests__/useCoachSuggestions.test.ts`
  - `/Users/mike/code/nurse-trainer/src/integrations/tauri/__tests__/runtime-info.test.ts`

### 8) Local Quality Gate
- Added scripts in `/Users/mike/code/nurse-trainer/package.json`
  - `test`
  - `test:run`
  - `verify`

## Current Verification Snapshot (After Refactor)
- `yarn lint`: pass
- `yarn build`: pass
- `yarn test:run`: pass (12 tests)
- `cargo fmt -- --check`: pass
- `cargo clippy --all-targets --all-features -- -D warnings`: pass
- `cargo test`: pass
- `cargo check`: pass
- `yarn verify`: pass
