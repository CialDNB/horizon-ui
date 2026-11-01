# 01 — Overview

## Intent

x-core (MUI v5 + Emotion, 150+ components) is the shared UI library for CIAL / D&B apps. It carries two design systems (Legacy + Horizon), MUI theme override files per component, and a runtime styling cost. horizon-ui replaces it with a smaller, Horizon-only library built on shadcn/ui, reusing the design tokens already authored in x-core.

## Goals

1. Horizon DS only. No Legacy DS.
2. Reuse x-core tokens (`src/theme/tokens/*`) as the single source of truth; do not redesign them.
3. Distribute as a versioned npm package via GitHub Packages, same as x-core, so customer360 and other consumers keep one dependency.
4. Run side by side with x-core in the same app with zero visual or CSS breakage, so migration is incremental.
5. Multi-brand (cial, dnb, il) and LTR/RTL through CSS variables, not JS theme objects.
6. Zero runtime CSS-in-JS.
8. Every component is deliberately designed and tested at all four breakpoints (mobile 0, tablet 768, laptop 1280, desktop 1920 — x-core's breakpoints), with a documented per-breakpoint spec.
7. A hosted, authenticated MCP server, redeployed on every release, so AI agents anywhere get accurate component/token data (see `07-mcp-server.md`).

## Non-goals

- No big-bang migration, no automated codemod in v1.
- No Legacy DS compatibility layer.
- Not a shadcn registry / copy-paste distribution (decided: npm package only).
- Not 1:1 parity of all 150 components at launch; see migration doc for ordering.
- No MUI dependency, ever (including MUI X charts/date pickers; replacements chosen per component).

## Anti-goals (failure even if it technically works)

- Consumers must not need Tailwind configured to use the package.
- Importing horizon-ui must not restyle any existing MUI/x-core element (no global preflight leakage).
- Breaking changes to a published component API (carries over x-core rule: add a V2, don't break).

## Stack (proposed — builder's calls unless marked decided)

| Concern | Choice | Status |
|---|---|---|
| Components | shadcn/ui source (owned in repo) on Radix primitives | decided (shadcn) |
| Styling | Tailwind CSS v4, tokens as CSS variables in `@theme` | proposed |
| Variants | `class-variance-authority` + `tailwind-merge` + `clsx` | proposed (shadcn default) |
| Build | Vite library mode, ESM, `preserveModules`, d.ts via `vite-plugin-dts` | proposed |
| Docs / dev | Storybook 10 (`@storybook/react-vite`) | proposed, user asked for advice |
| Tests | Vitest + Testing Library + Storybook Vitest addon; Playwright for visual | proposed |
| Language | TypeScript 5, strict | proposed |
| Distribution | npm, GitHub Packages, scope `@cialdnb` | decided |
| Package manager | npm (match x-core) | proposed |
| React | peer `>=18` | proposed |

## Naming

`horizon-ui` chosen to continue the existing Horizon DS name. Alternatives considered: `x-ui`, `dnb-ui`. Rename is cheap before first publish.

## Component conventions (carried from x-core where still valid)

- One folder per component: `Component.tsx`, `Component.stories.tsx`, `Component.test.tsx`, `index.ts`.
- `React.forwardRef` + `displayName`; props extend native element props (replacing MUI props) and `DnbBase` (`data-did`).
- Logical CSS properties only (RTL).
- Semantic tokens only in components; never primitives (x-core rule kept).
- shadcn components are modified freely — they are our code, not a dependency. Each file notes its shadcn origin version for diffing upstream.
