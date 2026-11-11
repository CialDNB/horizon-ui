### Task 1: Repository scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `.npmrc`, `.gitignore`, `.lintstagedrc`, `src/index.ts`, `src/components/index.ts`, `src/types/DnbBase.ts`
- Test: `src/__tests__/package.test.ts`

**Interfaces:**
- Produces: `DnbBase` (`export interface DnbBase { 'data-did'?: string }`) in `src/types/DnbBase.ts`; scripts `build`, `typecheck`, `lint`, `test`, `storybook`, `build:tokens`, `build:mcp-manifest`; `exports` map entries `.`, `./styles.css`, `./tokens`, `./package.json`.

- [ ] **Step 1: In `/Users/simonmor/dnb/horizon-ui` run `git init`; create `package.json` (name `@cialdnb/horizon-ui`, version `0.0.1`, `type: module`, `sideEffects: ["**/*.css"]`, `publishConfig.registry` = x-core's GitHub Packages registry, copied from `x-core/package.json`/`.npmrc`)**
- [ ] **Step 2: Write failing test `package.test.ts`** with tests `'has no mui or emotion dependency'` (assert none of `@mui/*`, `@emotion/*` in dependencies/peerDependencies) and `'src never imports mui or emotion'` (recursive read of `src/**/*.{ts,tsx}`, regex `/@mui|@emotion/` has zero matches).
- [ ] **Step 3: Run `npx vitest run src/__tests__/package.test.ts`; expected FAIL (no config yet)**
- [ ] **Step 4: Create configs.** Vite lib mode entry `src/index.ts`, ESM, `preserveModules: true`, `vite-plugin-dts`, externals `react`, `react-dom`, `react/jsx-runtime`. tsconfig strict. ESLint + Prettier per Global Constraints; `lint-staged` runs prettier + eslint.
- [ ] **Step 4a: Add the Quality Bar tooling now: strict tsconfig flags, `eslint-plugin-jsx-a11y`, `eslint-plugin-boundaries` with the layering rules, `no-default-export` for `src/`, and `src/__tests__/architecture.test.ts` with tests `'tokens and lib import no components'`, `'no deep imports across component folders'`, `'src has no default exports'`, `'public API matches snapshot'` (`Object.keys` of `src/index.ts` exports)**
- [ ] **Step 5: Run `npm install`, then `npm run typecheck && npm run build && npx vitest run`; expected: all PASS, `dist/index.js` and `dist/index.d.ts` exist**
- [ ] **Step 6: Commit (only after user approval)** `chore: scaffold horizon-ui`

