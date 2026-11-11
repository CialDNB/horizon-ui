### Task 6: Button vertical slice

**Files:**
- Create: `src/components/Button/{Button.tsx,Button.stories.tsx,Button.test.tsx,index.ts}`
- Modify: `src/components/index.ts`, `src/index.ts`

**Interfaces:**
- Consumes: `cn`, `DnbBase`, theme utilities.
- Produces: `Button` (`React.forwardRef<HTMLButtonElement, ButtonProps>`), `ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & DnbBase & { variant?: 'primary'|'secondary'|'tertiary'|'destructive'|'ghost'|'link'; size?: 'sm'|'md'|'lg'; loading?: boolean; asChild?: boolean }`, `buttonVariants` (cva). Port variant names and sizes from x-core `Button`/`ButtonV2` (builder reads `x-core/src/components/ButtonV2` and the Figma link for exact sizes; record deviations in `docs/migration/component-map.md`). Radius is `lg` (20px), per token rule for interactive elements.

- [ ] **Step 0: Design pass before code: run `/impeccable craft` for Button against the Figma link and Horizon DS (all variants, sizes, states, three brands, RTL). The approved look is the acceptance target for the stories; finish the task with `/impeccable audit` and `polish`.**
- [ ] **Step 1: Write failing tests in `Button.test.tsx`:** `'has role button and accessible name from children'`, `'is keyboard activatable with Enter and Space'`, `'disabled button is not focusable and does not fire onClick'`, `'loading sets aria-busy and blocks onClick'`, `'forwards ref and data-did'`, `'asChild renders the child element with button styles'`, `'displayName is Button'`, and at the four viewports `'is at least 44px tall at mobile for every size'`, `'full-width prop fills the container at mobile'`.
- [ ] **Step 2: Run `npx vitest run src/components/Button`; expected FAIL**
- [ ] **Step 3: Implement `Button` with Radix `Slot` for `asChild`, cva variants. Stories: all variants x sizes, disabled, loading, with icon, RTL, and a `Responsive` story using `ResponsiveSpec` that documents the Button's behaviour at mobile / tablet / laptop / desktop.**
- [ ] **Step 4: Run vitest (unit + storybook project) and `npm run build`; expected PASS; `dist/components/Button/Button.js` exists**
- [ ] **Step 5: Commit (only after user approval)** `feat(Button): add Button`

