### Task 7: Coexistence harness (anti-goal gate)

**Files:**
- Create: `coexistence/{index.html,main.tsx,vite.config.ts}`, `coexistence/tests/coexistence.spec.ts` (Playwright), `playwright.config.ts`
- Modify: `package.json` (`test:coexistence`; dev-dependencies only: `@mui/material`, `@emotion/react`, `@emotion/styled` in this harness, never in `src/`)

**Interfaces:**
- Consumes: built `dist` and `dist/styles.css`; a MUI v5 theme with `htmlFontSize: 14` mirroring x-core Legacy.

- [ ] **Step 1: Write failing Playwright tests:**
  - `'importing horizon styles does not change MUI Button computed styles'`: capture computed `font-size`, `padding`, `border-radius`, `background-color`, `font-family`, `line-height` of an MUI `Button` and an MUI `Typography` and `body` with and without `styles.css` loaded; assert deep equality.
  - `'horizon Button renders identically at html font-size 14px and 16px'`: bounding box width/height equal within 1px.
  - `'no horizontal overflow at 320px for the harness page'` and `'breakpoint variants switch exactly at 768, 1280 and 1920px'` (resize viewport to 767/768, 1279/1280, 1919/1920 and assert a probe element's computed style flips).
  - `'horizon Dialog and MUI Dialog stack in intended order'`: horizon overlay above MUI modal (z-index scale from Task 11) and both clickable.
  - `'horizon inside dir=rtl subtree and MUI in ltr do not affect each other'`.
- [ ] **Step 2: Run `npm run test:coexistence`; expected FAIL**
- [ ] **Step 3: Build the harness page rendering MUI and horizon components side by side; fix any leakage found by adjusting `base.css`/layer ordering (document in the ADR).**
- [ ] **Step 4: Run; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `test: coexistence harness with MUI`

---

## Phase B — Component library

