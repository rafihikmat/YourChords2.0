# CLAUDE.md — AI Code Execution & Architecture Governance
> **Role Context**: Principal Design Technologist & Lead UI/UX Architect Guidelines  
> **Project**: YourChords 2.0 (Next.js 16 App Router, TypeScript, Supabase)

---

## 1. Core Engineering Principles

### 1.1 Next.js 16 App Router Architecture
- **Server Components by Default**: All components inside `app/` are React Server Components (RSC) unless interactivity (state, event listeners, hooks) explicitly demands `'use client'`.
- **Client Boundary Isolation**: Push `'use client'` down to the smallest possible leaf component. Never mark an entire page or layout as `'use client'`.
- **Server Actions & Route Handlers**:
  - Mutative operations must use Next.js Server Actions with strict input validation (e.g., Zod schemas).
  - Webhooks and public API endpoints belong in `app/api/.../route.ts` with explicit HTTP method exports (`GET`, `POST`, `PATCH`, `DELETE`).
- **Dynamic & Static Route Conventions**:
  - Use `[slug]` or `[id]` folders for dynamic routes.
  - Export static params via `generateStaticParams()` where applicable for static generation.
  - Implement custom `loading.tsx`, `error.tsx`, and `not-found.tsx` for every dynamic segment.

### 1.2 TypeScript Strictness & Type Safety
- **Strict Mode Enforced**: `noImplicitAny`, `strictNullChecks`, and `noUnusedLocals` are mandatory.
- **Absolute Prohibition of `any`**:
  - Use `unknown` with type guards or Zod parsing when handling external data.
  - Define explicit interfaces or type aliases for all component props, API payloads, and database tables.
- **Supabase Database Types**:
  - Consume generated database definitions from `lib/types/database.types.ts` (or `@/types/supabase`).
  - Cast query results cleanly using typed helpers or generic queries, never with `as any`.

### 1.3 Async / Await & Error Handling Standards
- **Explicit Return Types**: Async functions must state explicit return promises (e.g., `Promise<ChordData>`).
- **Robust Try/Catch Boundaries**:
  - Server Action and API Handler calls must wrap asynchronous logic in `try/catch` blocks.
  - Return structured response objects: `{ success: boolean; data?: T; error?: string }`.
- **Suspense & Streaming**:
  - Wrap async data-fetching RSC components in `<Suspense fallback={<SkeletonLoader />}>`.
  - Prevent blocking page loads; stream non-critical UI sections asynchronously.

### 1.4 ISR (Incremental Static Regeneration) & Caching Strategy
- **Fetch Cache Control**:
  - Leverage `fetch(url, { next: { revalidate: 3600, tags: ['chords'] } })` for granular caching.
  - Static song/chord pages must use `export const revalidate = 86400` (or dynamic revalidation via `revalidateTag` / `revalidatePath`).
- **Dynamic Rendering Opt-Out**:
  - Only use `export const dynamic = 'force-dynamic'` when accessing headers, cookies, or user authentication state on every request.
  - Do not disable caching globally without explicit architecture rationale.

---

## 2. Zero-Tolerance Rules (Anti-Slop Execution)

### 2.1 Absolute Prohibition of Placeholder Code
- **NO `// TODO` or `/* repeat here */`**: Every file written or edited must be complete, production-ready, and fully functional.
- **NO Truncated Code Output**: Do not emit `... rest of the code remains the same`. Write the entire functional file or precise replacement block.
- **NO Mock Stubs in Production**: Mock data must reside isolated in `lib/mocks/` or test suites, never inline inside production components or API endpoints.

### 2.2 Imports & Path Aliases
- Always use configured path aliases (`@/components/...`, `@/lib/...`, `@/types/...`).
- Keep imports ordered cleanly:
  1. React & Next.js core modules
  2. Third-party packages (Lucide icons, Framer Motion, Supabase)
  3. Internal components & hooks
  4. Types, utilities, and styles

---

## 3. Verification & Quality Assurance Commands

Before marking any task as complete, verify through the terminal:

```bash
# Type-check TypeScript codebase
npm run type-check # or npx tsc --noEmit

# Run Linter
npm run lint

# Validate Production Build
npm run build
```

---
*Governance Version: 2.0.0 — Enforced across all AI sessions and automated workflows.*
