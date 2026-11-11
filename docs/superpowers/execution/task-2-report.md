# Task 2 report: Token port and CSS generation

Status: DONE_WITH_CONCERNS

## TDD
RED: `npx vitest run scripts/__tests__/build-tokens.test.ts`
```
FAIL  scripts/__tests__/build-tokens.test.ts
Error: Failed to resolve import "../build-tokens" from "scripts/__tests__/build-tokens.test.ts". Does the file exist?
Test Files  1 failed (1)
```
GREEN: same command after implementation: `Tests 10 passed (10)`.
Full run (`npx vitest run`): 4 files, 21 tests passed. `npx tsc --noEmit` clean, `npx eslint .` clean, `npm run build` ok (dist/tokens/index.js + index.d.ts exist).

## Files
- src/tokens/{colors,typography,spacing,borderRadius,borders,shadows,motion,iconography,index}.ts (copied, MUI bits removed: muiShadowsArray, MUI comments; TSDoc added)
- src/tokens/brands/{types,cial,dnb,il,typography,index}.ts
- scripts/build-tokens.ts (`buildTokensCss`, writes src/styles/tokens.css when run directly), scripts/__tests__/build-tokens.test.ts
- src/styles/tokens.css (generated), docs/migration/token-gaps.md
- package.json (build:tokens -> `tsx scripts/build-tokens.ts`), vite.config.ts (second lib entry tokens/index), vitest.config.ts (include scripts), tsconfig.json (include scripts), .prettierignore (tokens.css: prettier lowercases hex, breaking verbatim values)
- src/index.ts unchanged, API snapshot unchanged.

## CSS layout
`.hz-root` holds primitives (`--hz-<scale>-<n>`, kebab-case: `--hz-light-blue-500`, `--hz-white/black`, `--hz-gradient-cial1/2`), cial semantic vars, spacing (`--spacing: 4px`), `--radius-*` plus `--radius: 20px` (lg), `--shadow-1..4`, `--border-width-*`, `--border-color-*`, `--duration-*`, `--ease-*`, `--icon-size-*`, `--dialog-width-*`, `--font-size-*`, `--line-height-*`, `--font-family`, `--font-weight-*`, `--text-<role>-{size,line-height,weight}` for the 11 roles. `.hz-root[data-brand='dnb'|'il']` override semantic vars only (typography emitted only if it differs from cial; currently identical). Nothing on `:root`. Unknown brand falls back to cial automatically.

## Semantic mapping decisions
- `<role>.main` -> role, `.contrastText` -> role-foreground, `text.primary` -> foreground, `background.default` -> background; error -> destructive.
- Derived (no x-core source): muted = blueGrey/100, muted-foreground = text.secondary, accent = primary.light, accent-foreground = primary.dark, border = borderColor.subtle, input = borderColor.default, ring = primary.main. Full table in docs/migration/token-gaps.md.
- IL values are literals from palette-il.ts (excluded from DS migration); IL background (absent in source) = grey/50.
- IL typography = dnb typography = cial typography (`brandTypography`).
- Unmapped keys (paper background, hover/light/dark, success/warning/info contrastText, lime, gradients, deprecated scales, MUI-only typography variants) recorded in token-gaps.md.

## Concerns
- D&B `foreground` is blueGrey/500 (#64748B) per DS source on #FAFAFA, roughly 4.5:1, borderline for AA body text. Needs design/a11y confirmation.
- No `success/warning/info-foreground`, `card`, `popover` keys (brief limits SemanticKey); later tasks will need them.
- Rem tokens assume 16px root; font-size scoping on .hz-root deferred (coexistence task).
- tokens.css committed with uppercase hex and excluded from prettier.

## Fix round
- 02-tokens-and-theming.md: pipeline comment and Semantic layer now say `.hz-root` / portal container, never `:root`.
- build-tokens.ts: scale keys pass through kebab() (`--font-weight-extra-bold`); tokens.css regenerated.
- WHY comment added at `--radius` emission.
- Verified: vitest full suite, typecheck, lint clean.
