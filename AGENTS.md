# AGENTS.md — AI Agent Collaboration & Operating Protocol
> **Role Context**: Lead Agentic Architect & System Integrator Standards  
> **Target Scope**: Multi-agent setups, IDE assistants, automated code agents, subagents

---

## 1. Core Operating Workflow

### 1.1 Mandatory Context Inspection (Read Before Write)
- **Zero Blind Edits**: Before generating or modifying any code, the agent MUST explicitly inspect relevant context using reading tools (`view_file`, `grep_search`, `list_dir`).
- **Dependency & Symbol Verification**: Verify type definitions, component prop interfaces, imported utility functions, and Supabase client bindings before introducing changes.
- **Never Infer Schemas**: Database schema columns, API payloads, and state properties must be confirmed directly from source files (e.g., `@/lib/supabase/client.ts`, database types).

### 1.2 Refactoring & Code Mutation Standards
- **Surgical, Minimal Edits**: Perform exact line replacements rather than rewriting entire files unless creating a new file or performing a total component overhaul.
- **Preserve Existing API Contracts**: Function signatures, prop interfaces, and exported types must remain backwards compatible unless explicitly instructed.
- **Atomic Work Units**: Make modular, single-responsibility edits. Test or lint each step before proceeding to downstream components.

### 1.3 Token & Context Efficiency
- **Targeted Code Replacement**: Use precise line ranges and exact string replacements (`replace_file_content` / `multi_replace_file_content`).
- **Eliminate Redundant File Views**: Avoid re-reading unchanged files repeatedly. Retain active state context in working memory or scratchpads.
- **Concise & Direct Communications**: Present high-level technical summaries of actions taken without repeating entire raw file outputs.

---

## 2. Backend & State Integrity Guarantees

### 2.1 Supabase Backend Integration (Zero Breaking Changes)
- **Authentication & Auth State**: Never modify `@/lib/supabase/` auth wrappers, SSR cookie handlers, or middleware route matchers without explicit approval.
- **Database Schemas & RLS**: Respect Row-Level Security policies and existing database table names/columns (`songs`, `chords`, `artists`, `user_favorites`, etc.).
- **Client Instantiation**: Maintain strict separation between Server Supabase Client (`createClient` for RSC/Actions) and Browser Supabase Client (`createBrowserClient`).

### 2.2 State Management & Hooks Integrity
- **Zustand & React Context Protection**: Do not alter global store contracts (`useAuthStore`, `useChordStore`, `usePlayerStore`) or mutate state out-of-band.
- **Pure Hooks**: Custom React hooks (`useTranspose`, `useAutoScroll`, `useSupabaseQuery`) must remain deterministic, side-effect free, and properly cleaned up in `useEffect`.

---

## 3. Verification & Safety Protocols

### 3.1 Verification Checklist
Every agent turn must pass this verification loop prior to concluding:

1. **Static Analysis**: Run TypeScript check (`npx tsc --noEmit`) to guarantee zero syntax or type regressions.
2. **Lint Cleanliness**: Validate code with ESLint (`npm run lint`).
3. **Build Check**: Ensure no server/client hydration errors or broken dynamic imports occur during `npm run build`.

### 3.2 Error Diagnosis & Logging Rule
- **Read Full Tracebacks**: When a command or test fails, read the full un-truncated error log before forming a hypothesis.
- **No Masking Exceptions**: Never resolve errors by wrapping broken code in empty `try/catch` blocks, returning dummy fallbacks, or commenting out type checks.

---
*Governance Version: 2.0.0 — Binding operational protocol for all AI assistants.*
