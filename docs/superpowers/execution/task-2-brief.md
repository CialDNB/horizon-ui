### Task 2: Token port and CSS generation

**Files:**
- Create: `src/tokens/{colors,typography,spacing,borderRadius,borders,shadows,motion,iconography,index}.ts` (copied from `x-core/src/theme/tokens/`), `src/tokens/brands/{cial,dnb,il}.ts` (semantic color maps derived from `x-core/src/theme/horizon/palette-*.ts`, MUI imports removed), `scripts/build-tokens.ts`, `src/styles/tokens.css` (generated)
- Test: `scripts/__tests__/build-tokens.test.ts`

**Interfaces:**
- Produces: `buildTokensCss(): string` in `scripts/build-tokens.ts`; `brands: Record<'cial'|'dnb'|'il', SemanticPalette>` and `type SemanticPalette = Record<SemanticKey, string>` in `src/tokens/brands/index.ts` where `SemanticKey` includes `background, foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, success, warning, info, border, input, ring`.
- Consumes: Task 1 scripts config.

- [ ] **Step 1: Write failing tests** in `build-tokens.test.ts`:
  - `'emits every primitive color key'`: for each `blue[n]`, css contains `--hz-blue-${n}: ${value}`.
  - `'emits radius scale'`: css contains `--radius-lg: 20px` and `--radius-full: 100px`.
  - `'emits motion tokens'`: contains `--duration-slow: 300ms` and `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.
  - `'scopes brand variables under .hz-root, never :root'`: css has `.hz-root[data-brand='dnb']` rule and no `:root` rule containing `--primary`.
  - `'cial is the default brand'`: `.hz-root` base block has the cial `--primary`.
  - `'il typography equals cial typography'`.
- [ ] **Step 2: Run `npx vitest run scripts/__tests__/build-tokens.test.ts`; expected FAIL**
- [ ] **Step 3: Copy token files; strip MUI imports; build brand semantic maps from the x-core Horizon palettes (map `primary.main` -> `primary`, etc.; record any palette key with no semantic home in `docs/migration/token-gaps.md`)**
- [ ] **Step 4: Implement `buildTokensCss()`** emitting primitives under `.hz-root`, cial semantic vars on `.hz-root`, dnb/il overrides on `.hz-root[data-brand='…']`; `npm run build:tokens` writes `src/styles/tokens.css`.
- [ ] **Step 5: Run tests; expected PASS. Add drift check test `'committed tokens.css matches generator output'`.**
- [ ] **Step 6: Commit (only after user approval)** `feat(tokens): port Horizon tokens to CSS variables`

