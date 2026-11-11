### Task 5: Storybook 9 harness

**Files:**
- Create: `.storybook/{main.ts,preview.tsx}`, `src/stories/Tokens.stories.tsx`
- Modify: `package.json` scripts (`storybook`, `build-storybook`), `vitest.config.ts` (Storybook Vitest addon project)

**Interfaces:**
- Consumes: `HorizonProvider` (Task 4), `dist`-independent `src/styles/index.css`.
- Produces: decorator applying `HorizonProvider` with toolbar globals `brand` (cial/dnb/il) and `direction` (ltr/rtl); a11y addon enabled globally with `test: 'error'`; Storybook viewports `mobile` 375x812, `tablet` 768x1024, `laptop` 1280x800, `desktop` 1920x1080 (matching the breakpoint tokens); helper `ResponsiveSpec` story component rendering the per-breakpoint spec table used by every component's `Responsive` story.

- [ ] **Step 1: Write `Tokens.stories.tsx` (colour swatches per semantic key, radius scale, spacing scale, type scale) with a `play` function asserting each semantic swatch has a non-empty computed `background-color`.**
- [ ] **Step 2: Run `npx vitest run --project storybook`; expected FAIL (no config)**
- [ ] **Step 3: Configure Storybook (`@storybook/react-vite`, addons `a11y`, `docs`, `vitest`), preview imports `src/styles/index.css`, decorator wraps stories.**
- [ ] **Step 4: Run `npx vitest run --project storybook` and `npm run build-storybook`; expected PASS, `storybook-static/` exists**
- [ ] **Step 5: Commit (only after user approval)** `chore(storybook): Storybook 9 harness with brand and RTL toolbar`

