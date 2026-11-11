# Task 1 report: repository scaffold

Commit: ffd7606 chore: scaffold horizon-ui (branch feat/foundation). No push, no Co-Authored-By.

## TDD evidence
- Step 3 (package.test.ts): did NOT go RED. `npx vitest run src/__tests__/package.test.ts` passed 2/2 (npx fetched vitest) because there are no forbidden deps/imports; the plan's "expected FAIL" assumed a missing config, which vitest does not require.
- Step 4a (architecture.test.ts, written before src/index.ts existed): RED, "public API matches snapshot" failed: `Cannot find module '/src/index'` (3 passed, 1 failed). GREEN after creating src/index.ts + configs.
- Mutation checks: temporarily added src/lib importing components, a default export in src/lib, and components/A importing ../B/B. The architecture tests failed on each (caught initially a regex gap: deep-import check ignored relative specifiers, default-export regex was line-anchored; both fixed). ESLint flagged lib->component and default export. Temp files removed.
- Final: `npm run typecheck` 0 errors, `npm run lint` 0 errors, `npm run build` OK (dist/index.js, dist/index.d.ts exist), `npx vitest run` 2 files / 6 tests pass, prettier --check clean.

## Files
package.json, package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts (jsdom), eslint.config.js (flat; typescript-eslint strict, jsx-a11y strict, boundaries layering, no-restricted-exports for defaults), .prettierrc, .prettierignore (docs, README, lockfile), .npmrc (`${NODE_AUTH_TOKEN}`, no token), .lintstagedrc, src/index.ts, src/components/index.ts, src/types/DnbBase.ts, src/__tests__/package.test.ts, src/__tests__/architecture.test.ts.

## Versions / decisions
vite 8, vitest 4, typescript 5, eslint 9 (jsx-a11y does not support 10), tailwindcss 4 (devDep, not yet used), react/react-dom 19 dev + peer >=18, tsx, lint-staged (prettier + eslint --fix). No husky hook installed (not in brief).
publishConfig copied from x-core: `{"@cialdnb:registry": "https://npm.pkg.github.com"}`.

## Concerns
- Scripts `storybook`, `build:tokens`, `build:mcp-manifest` are placeholders that echo and exit 1 until later tasks implement them.
- eslint-plugin-boundaries pinned to v5 (v7 emits deprecation warnings for the old config syntax); added eslint-import-resolver-typescript so it resolves .ts imports. `boundaries/entry-point` did not flag a deep cross-component import in my mutation test; the architecture.test.ts deep-import check covers it, but the lint rule is not effective yet.
- Architecture tests for tokens/lib/components are glob-based but have no real files to scan yet (only verified via mutation). Snapshot is `[]` and must be updated by later tasks.
- `exports` entries `./styles.css` and `./tokens` point at dist files not produced yet.
- npm audit reports 13 moderate vulnerabilities in dev dependency tree (not addressed).
- prettier accidentally reformatted docs once; reverted before commit (docs untouched).

## Fix report (review round 1)
Commit: fix: enforce entry-point boundaries and lint all files
1. boundaries/entry-point: `default: 'disallow'`, `rules: [{ target: ['component'], allow: ['**/index.ts'] }]`. New src/__tests__/eslint-boundaries.test.ts runs ESLint (Node API) on fixtures written to a gitignored `.tmp-hz-lint-*` dir inside the repo (removed in afterAll; os tmpdir and node_modules locations were silently ignored by ESLint/boundaries). Proves: `A -> ../B/B` flagged (boundaries/entry-point), `C -> ../B` clean, lib->component flagged (boundaries/element-types), clean lib file passes. Note: fixtures use `import` statements; boundaries does not check `export ... from`.
2. Type-test convention: `src/**/*.test-d.ts` may use `@ts-expect-error` with a description (min 10 chars); ban remains elsewhere. tsconfig includes src so typecheck covers them; vitest include is `*.test.*` only so they are not executed; excluded from dts build. Example: src/types/DnbBase.test-d.ts.
3. `lint` is now `eslint .` (root configs covered; existing ignores kept). Reported nothing for root files. .lintstagedrc already runs eslint --fix on staged files at any path.
4. Removed vacuous `toBeGreaterThanOrEqual(0)` in architecture.test.ts (deep-import behaviour is covered by the lint fixture test).
Verification: `npm run typecheck && npm run lint` clean; vitest 3 files / 10 tests pass (eslint-boundaries.test.ts, architecture.test.ts, package.test.ts); build OK; prettier clean.

## Fix report (review round 2)
Commit: fix: scope entry-point rule to components only
- NEW-1: entry-point now has a second rule allowing `**` for targets tokens, lib, provider, primitives, types, root; components still `**/index.ts` only. eslint-boundaries.test.ts gained fixture D (component importing types/DnbBase, lib/cn, tokens/color directly) which must pass. RED proof: with the new rule removed, that test failed (1 failed / 4 passed); restored, 5/5 pass. `A -> ../B/B` still flagged; `C -> ../B` passes; lib->component flagged.
- NEW-2: separate `{ ignores: ['.tmp-hz-lint-*'] }` entry in eslint.config.js. It also hid the fixtures from the test, so the test loads the config array, filters that one entry out, and passes it via `overrideConfigFile: true, overrideConfig`.
- .lintstagedrc unchanged: `*.{ts,tsx,js,json,css,md}` -> prettier --write, `*.{ts,tsx,js}` -> eslint --fix. lint-staged passes explicit staged file paths, so root configs (eslint.config.js, vite/vitest configs) are linted regardless of the `eslint .` script scope.
- tsconfig `include` is `["src", "vite.config.ts", "vitest.config.ts"]`, covering src/**/*.test-d.ts. Proof: deleting the `@ts-expect-error` line in src/types/DnbBase.test-d.ts made `tsc --noEmit` print `src/types/DnbBase.test-d.ts(5,31): error TS2322: Type 'number' is not assignable to type 'string'.`; reverted.
- Verification: typecheck exit 0, `eslint .` clean, vitest 3 files / 11 tests pass (eslint-boundaries, architecture, package), prettier clean.
