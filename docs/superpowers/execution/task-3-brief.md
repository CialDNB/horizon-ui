### Task 3: Tailwind theme, scoped base, and prefix/scope spike (Q8)

**Files:**
- Create: `src/styles/{index.css,theme.css,base.css,typography.css}`, `docs/architecture/decisions/0001-css-isolation.md`
- Modify: `vite.config.ts` (emit `dist/styles.css`)
- Test: `src/__tests__/styles.test.ts`

**Interfaces:**
- Consumes: `tokens.css` from Task 2.
- Produces: `dist/styles.css`; `@utility` classes `text-display-xl`, `text-heading-md`, `text-body-default` (all 11 `typeScale` roles from `tokens/typography.ts`, bundling size/line-height/weight/family); Tailwind color utilities `bg-primary`, `text-foreground`, etc.

- [ ] **Step 1: Spike (throwaway, 1 hour max): compile the same Button style twice, once with `@import 'tailwindcss' prefix(hz)`, once nested under `.hz-root`. Load each next to a MUI v5 page (14px html font-size) and compare. Record the winner and evidence in `0001-css-isolation.md`. Default is prefix + layer unless the spike shows authoring friction or collisions.**
- [ ] **Step 2: Write failing tests** in `styles.test.ts` against built `dist/styles.css`:
  - `'contains no global preflight'`: no selector `html`, `body`, `*`, `::before`, `::after`, `button`, `h1` at top level outside `.hz-root`.
  - `'all rules are inside @layer horizon'`.
  - `'utilities carry hz prefix'` (decision-dependent; assert per the ADR).
  - `'defines all 11 typography utilities'`.
  - `'no :root variable declarations'` (Review Focus 2).
  - `'reduced motion media query present'`.
  - `'defines tablet, laptop, desktop breakpoints at 768, 1280, 1920px and no sm/md/lg/xl'` (breakpoint tokens added to `src/tokens/breakpoints.ts` as `{ mobile: 0, tablet: 768, laptop: 1280, desktop: 1920 }`, emitted as `--breakpoint-*` in `@theme`).
- [ ] **Step 3: Run `npm run build && npx vitest run src/__tests__/styles.test.ts`; expected FAIL**
- [ ] **Step 4: Write `theme.css` (`@theme` mapping `--color-primary: var(--primary)` etc., `--spacing: 4px`, radius, shadow, duration, ease, font families) and `base.css` (`.hz-root` reset: box-sizing, `font-size: 16px`, line-height, border-color, form element normalisation; focus ring using `--ring`). Wrap everything in `@layer horizon`. Per ADR, configure prefix or scope.**
- [ ] **Step 5: Run build and tests; expected PASS**
- [ ] **Step 6: Commit (only after user approval)** `feat(styles): scoped Tailwind theme and base`

