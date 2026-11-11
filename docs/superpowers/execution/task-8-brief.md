### Task 8: Icons and illustrations port

**Files:**
- Create: `scripts/port-icons.ts`, `src/icons/**`, `src/illustrations/**`, `src/icons/index.ts`, `src/illustrations/index.ts`
- Modify: `src/index.ts` (export namespaces `icons`, `illustrations`)
- Test: `src/icons/icons.test.tsx`

**Interfaces:**
- Produces: each icon as `React.forwardRef<SVGSVGElement, IconProps>` where `IconProps = React.SVGProps<SVGSVGElement> & DnbBase & { size?: number | string }`; default `aria-hidden="true"` unless `aria-label`/`title` supplied; `currentColor` fill; directional icons carry `rtl:-scale-x-100`. `scripts/port-icons.ts` reads x-core's `src/icons` (MUI `SvgIcon` wrappers), extracts SVG paths, emits plain components.

- [ ] **Step 1: Write failing tests:** `'every exported icon renders an svg'` (iterate namespace), `'icons are aria-hidden by default'`, `'icon with aria-label exposes role img'`, `'size prop sets width and height'`, `'directional icons mirror under rtl'`, `'no mui import'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement the port script and run it; commit generated files; list any icon that could not be converted in `docs/migration/component-map.md`.**
- [ ] **Step 4: Run tests and `npm run build`; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `feat(icons): port x-core icons and illustrations`

