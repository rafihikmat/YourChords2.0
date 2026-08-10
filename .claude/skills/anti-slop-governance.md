# YourChords 2.0 System Governance & Anti-Slop Specification

This document defines the strict engineering standards, architectural rules, and
UI/UX design specifications for the **YourChords 2.0** codebase. All
contributors, AI models, and developers must adhere to these directives without
exception.

---

## 1. PROTOKOL TATA KELOLA SISTEM (SYSTEM GOVERNANCE)

### A. Zero Blind Edits & Type Verification

- **Contract Inspection:** Before modifying any component, API route, or Server
  Action, inspect the database schema (`supabase/schema.sql` or Supabase types)
  and component interfaces.
- **Strict Interfaces:** Explicitly specify all component props, API response
  interfaces, and utility function return types. Never guess shape signatures.

### B. Strict TypeScript Safety

- **Zero `any` Policy:** The `any` type is strictly forbidden. Use proper
  generic constraints, discriminated unions, or `unknown` with type guards/Zod
  schemas.
- **Type-Only Imports:** Use `import type { ... }` for pure type/interface
  imports to ensure clean tree-shaking and runtime separation.
- **Explicit Return Types:** All public functions, hooks, and API handlers must
  declare explicit return signatures.

### C. Server Components by Default (Next.js App Router)

- **RSC First:** All files under `app/` are React Server Components (RSC) unless
  interactivity requires client hooks.
- **Leaf-Node Interactivity:** Isolate `'use client'` directives exclusively to
  the smallest leaf components requiring state (`useState`, `useEffect`, event
  listeners).
- **No Unnecessary Client Boundaries:** Do not mark container pages or static
  layout wrappers with `'use client'`.

### D. Robust Error Handling & Response Shapes

All API route handlers and Server Actions must return a unified structured
response shape:

```typescript
export type APIResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; error: string; details?: unknown };
```

Every database call, external API fetch, or mutation must be wrapped in a
`try/catch` block handling edge cases and returning appropriate HTTP status
codes.

---

## 2. ATURAN ANTI-AI SLOP (NO-AI SLOP SYSTEM)

### A. Banned Code Practices

- **No Truncation / Placeholders:** Never emit `// TODO`,
  `/* rest of code remains the same */`, `/* ... */`, or partial
  implementations. All generated code must be 100% complete, compilable, and
  production-ready.
- **No Unused Imports:** Always clean up unused icons, components, or variables.

### B. Banned Generic Aesthetics

- **Forbidden:** Bland light-mode white cards with generic drop shadows,
  high-contrast purple-to-pink generic marketing gradients, or unstyled tables.
- **Mandated Cyber-Zen Aesthetic:**
  - **Canvas Background:** Deep Obsidian (`#070a12` / `bg-slate-950`).
  - **Surfaces:** Glassmorphic cards with subtle backdrop blur
    (`bg-slate-900/80 backdrop-blur-md border border-white/10`).
  - **Neon Accents:** Electric Cyan (`#06b6d4` / `text-cyan-400`) and Cyber
    Purple (`#a855f7` / `text-purple-400`).
  - **Typography:**
    - `JetBrains Mono` for all chord notations, lyric sheets, transposer
      controls, tabulations, and code badges.
    - `Inter` / `Outfit` / `Plus Jakarta Sans` for UI headers, navigation,
      buttons, and body copy.

### C. Human-Like Microcopy

- Eliminate conversational AI filler text (e.g., "Tentu saja!", "Berikut
  adalah...", "Sebagai AI...").
- Write clear, concise, direct Indonesian/English UI microcopy for error toasts,
  empty states, and control labels.

---

## 3. CHORD ENGINE & INSTRUMENT SPECS

- **Multi-Instrument Visualizer:** All chord interactions must utilize
  `<ChordVisualizer />` or `<CyberChordDiagram />` from
  `@/components/ui/ChordVisualizer`.
- **Guitar & Piano Integration:** Support seamless switching between 🎸 Guitar
  (Fretboard 3D SVG with Barre support) and 🎹 Piano (24-key chromatic layout)
  via Cyber-Zen styled toggle buttons.
- **Audio Synthesizer:** Audio playback uses pure Web Audio API oscillators for
  low-latency frequency synthesis without external audio asset bloat.

---

## 4. CHECKLIST DOKUMENTASI & VERIFIKASI

- [x] Compilation without TypeScript or linter errors.
- [x] Zero usage of implicit or explicit `any`.
- [x] All page routes verified with responsive desktop/mobile layouts.
- [x] Full alignment with Supabase Row-Level Security (RLS) rules.
