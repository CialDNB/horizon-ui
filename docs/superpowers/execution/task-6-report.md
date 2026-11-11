# Task 6 report: Button vertical slice

Status: DONE_WITH_CONCERNS (concerns at the end; none block the task).

## Step 0: design pass

- Sources read: x-core `src/components/ButtonV2/{ButtonV2.tsx,ButtonV2.types.tsx,ButtonV2.stories.tsx}` and `src/theme/components/{mui-button.ts,mui-buttonV2.ts}`, plus the x-core Horizon palettes (`palette-{cial,dnb,il}.ts`) for hover values.
- ButtonV2 facts: MUI LoadingButton; variants contained/outlined/text multiplied by 11 colours; heights 24/36/42px; font 10/12/14px, weight 600, 1.25px tracking; radius 20px LTR and 16px RTL; inline padding 16/20/24px; contained hover = `palette.hover`; outlined hover fills with `main`; text hover underlines and nudges the end arrow (bounce keyframes); disabled = blueGrey/200 surface and blueGrey/400 text; loading hides the label and shows a spinner; elevation is forced to `none`.
- Impeccable: I invoked the skill (`/impeccable craft`). Its setup script returned `NO_PRODUCT_MD`, which routes to `init`. Init, shape and craft all have user gates (AskUserQuestion), and I can't reach the user from this subagent. So I did not write PRODUCT.md. Instead I applied the craft and product-register references myself: semantic first, the full state set, token-only colour, 150 to 250ms state-only motion, no decorative motion, verified contrast, every breakpoint checked visually. The design direction was taken from the controller brief plus the x-core spec, standing in for a confirmed shape brief. Visual verification used Playwright screenshots of the built Storybook at 375, 768 and 1280px (variants x sizes, brands, loading, disabled, long label, RTL, icons). That pass found one defect (a long unbroken word overflowing the button's padding), which is now fixed and covered by a test. A newer Impeccable version (v4.8.0) is available; I did not update it. `/impeccable audit` and `polish` (brief Step 0 tail) were also not run, for the same no-user-gate reason; my manual audit is the screenshot pass above.
- No Figma link was available. Decisions are documented below, in the Storybook docs description, and in `docs/migration/component-map.md`.

### Variant mapping (x-core -> horizon-ui)

| horizon-ui | x-core | Rest | Hover (pointer devices only, `@media (hover: hover)`) |
|---|---|---|---|
| `primary` | contained | `bg-primary`, `text-primary-foreground` | `bg-primary-hover` |
| `secondary` | outlined | 1px `border-primary`, transparent, `text-primary` | fills `bg-primary`, `text-primary-foreground` (as ButtonV2) |
| `tertiary` | text | transparent, `text-primary` | underline (ButtonV2 `showTextUnderLine` behaviour) |
| `destructive` | `color="error"` | `bg-destructive`, `text-destructive-foreground` | `bg-destructive-hover` |
| `ghost` | (new; neutral text) | transparent, `text-foreground` | `bg-accent`, `text-accent-foreground` (brand tint; a `muted` hover would fail contrast for D&B, see below) |
| `link` | (new) | `text-primary`, underline, no inline padding | underline thickens to 2px |

### Size table (min-height, px)

Density depends on pointer precision, not width alone (`hz:tablet:pointer-fine:min-h-*`), so touch tablets keep 44px targets.

| Size | Mobile (base; any coarse pointer at any width) | Tablet (fine pointer) | Laptop | Desktop | Type (all breakpoints) | Inline padding | Icon | Gap |
|---|---|---|---|---|---|---|---|---|
| `sm` | 44 | 32 | 32 | 32 | caption 12/16, semibold | 16 | 16 | 4 |
| `md` (default) | 44 | 36 | 36 | 36 | body-secondary 14/20, semibold | 20 | 16 | 8 |
| `lg` | 48 | 44 | 44 | 44 | body-default 16/24, semibold | 24 | 20 | 8 |

Vertical padding is 4px (sm, md) or 8px (lg). It only matters when a label wraps; single-line height comes from min-height.
Deviations from ButtonV2: sm 24 -> 32px and lg 42 -> 44px (4px grid, and 24px is too small as a pointer target in a dense UI); type 10/12/14 -> 12/14/16 (the Horizon `button` token is 14px semibold for md); no 1.25px tracking; radius 20px in both directions (ButtonV2's 16px in RTL looked accidental); end-icon bounce dropped as decorative motion.

### States

- Focus-visible: 2px solid `ring` outline, 2px offset. The outline colour sits at rest so it does not fade in under `transition`; only style and width switch on focus.
- Active: `scale(0.98)` (transform family only, never width or height).
- Disabled: native `disabled`, not focusable; `bg-muted` + `text-muted-foreground` (secondary: `border-input`, transparent; ghost/link/tertiary: text only), `cursor: not-allowed`. Disabled rules are emitted after hover rules, so they win (verified in the compiled CSS).
- Loading: `aria-busy="true"` + `aria-disabled="true"`, not native disabled, so focus is kept; `onClick` blocked; the label stays in the DOM at `opacity: 0`, which keeps both the width and the accessible name; a 16px `currentColor` spinner (`animate-spin`) is centred over it; `cursor: progress`; no press scale. With `asChild` no spinner is rendered (the child's content is not wrapped); busy/disabled semantics still apply. This is documented in the prop TSDoc.
- Motion: Tailwind `transition` (colour, background, border, decoration, outline colour, `scale`), `duration-100` (`duration.fast`), `ease-standard`. Reduced motion: the scoped base stylesheet collapses transitions and animation to 0.01ms with `!important`, which stops the spinner (static ring).
- Long labels: wrap with `text-wrap: balance`, `overflow-wrap: anywhere`, `max-width: 100%`; never wider than the container, and content never spills past the button edge.
- Icons: SVG children are sized by the Button and get `pointer-events: none` and `shrink-0`. Icon-only usage needs `aria-label`; prefer `IconButton` (Task 10). RTL mirroring of directional icons is left to the icon set (Task 8).
- `asChild`: Radix `Slot`; the child gets all classes and props; no `type` attribute is added.

## Tokens (ruling: added semantic keys)

New semantic keys in all three brands: `primary-hover`, `destructive-hover`. Also, `destructive` for D&B and IL changed from `#ED3F48` (red/400) to `#C90A2A` (red/600, D&B's own `error.hover`), because white text on `#ED3F48` is **3.88:1 (fails AA)**. Recorded in `docs/migration/token-gaps.md` and in TSDoc on `dnb.ts`/`il.ts`; `tokens.css`/`theme.css` regenerated with `npm run build:tokens`. Drift tests are green.

## Contrast table (text on surface, WCAG ratio; 4.5:1 required)

| Variant (state) | cial | dnb | il |
|---|---|---|---|
| primary rest (`primary-foreground` on `primary`) | 6.17 | 5.74 | 5.74 |
| primary hover (on `primary-hover`) | 9.42 | 7.50 | 7.50 |
| secondary / tertiary / link rest (`primary` on `background` #FAFAFA) | 5.91 | 6.58 | 6.58 |
| secondary hover (= primary rest) | 6.17 | 5.74 | 5.74 |
| destructive rest | 4.67 | 5.90 (was 3.88) | 5.90 (was 3.88) |
| destructive hover (white on #AB0722) | 7.54 | 7.54 | 7.54 |
| ghost rest (`foreground` on `background`) | 12.15 | **4.56** (borderline pass, #64748B) | 17.10 |
| ghost hover (`accent-foreground` on `accent`) | 10.09 | 8.20 | 8.20 |
| disabled (`muted-foreground` on `muted`; WCAG-exempt) | 6.92 | 6.92 | 4.34 |

Static states are machine-checked by Storybook a11y (`test: 'error'`) on every story, including `Brands`, which renders all three brands side by side with every variant. I mutation-checked the gate: reverting D&B `destructive` to `#ED3F48` makes `Brands` fail with `color-contrast`. Hover values were computed by hand (axe does not test hover). D&B `foreground` passes on `background` at 4.56 but **fails on `muted` (4.34)**, which is why ghost hover uses `accent`. Later components that put `foreground` on `muted` for D&B will need care.

## TDD evidence

| Group | RED | GREEN |
|---|---|---|
| Unit (jsdom, `Button.test.tsx`, 9 tests: role/name, Enter+Space, disabled, loading, ref+data-did, asChild, displayName, className merge, defaults/type) | Against a stub `Button` (renders null): 9/9 failed with "Unable to find role button" etc. | 9/9 pass |
| Browser (Storybook project, real compiled CSS; viewport set from `globals.viewport` by addon-vitest): `is at least 44px tall at mobile for every size`, `full-width prop fills the container at mobile`, `uses dense heights with a fine pointer at tablet/laptop/desktop`, `applies Horizon tokens to the rendered button` (radius 20px, weight 600, size/line-height per size, transition 0.1s standard easing, includes `scale`, focus outline 2px/2px/solid/ring colour, disabled = muted), plus play functions on Disabled, Loading, LongLabel | Against the stub: 9 failed | 17/17 pass (with a11y error mode) |
| Transition includes `scale` (added after I found `scale-[0.98]` uses the `scale` property, not `transform`) | failed: `'color, background-color, …' to contain 'scale'` | pass after switching to `hz:transition` |
| Focus ring colour | failed: outline `rgb(255,255,255)` (transitioning from currentColor) | pass after moving `outline-ring` to rest |
| Long word stays inside the button | failed: `247 <= 238` | pass after `wrap-anywhere` |
| Boundaries: component story may import `src/stories` helpers; component source may not | story case failed | 7/7 pass after the eslint element change |
| API snapshot | failed (Button/buttonVariants missing) | pass after intentional snapshot update |

Mutation checks (temporarily broke the source, then reverted; each was caught):

- removed `min-h-11` from sm -> mobile 44px test fails
- removed `w-full` -> full-width test (and the viewport tests that include it) fail
- removed `pointer-fine` density -> tablet/laptop/desktop tests fail
- `outline-0` on focus -> token test fails
- `rounded-md` -> token test fails
- loading guard removed -> loading test fails
- default `type` removed -> role test fails
- displayName removed -> displayName test fails
- asChild ignored -> asChild test fails
- ref dropped -> ref test fails

Note: removing only the component's focus classes is not caught, because the scoped base already draws the identical ring (`.hz-root :where(:focus-visible)`). The behaviour is guaranteed either way.

Final gate: `npx vitest run` 11 files / 99 tests passed; `npm run typecheck` 0 errors; `npm run lint` 0 problems; `npm run build` OK (`dist/components/Button/Button.js` 3.50 kB, 1.36 kB gzip); `npm run build-storybook` OK. A type test (`Button.test-d.ts`) pins the union types and `exactOptionalPropertyTypes` behaviour.

## Files changed

- Added: `src/components/Button/{Button.tsx,Button.stories.tsx,Button.test.tsx,Button.test-d.ts,index.ts}`, `docs/migration/component-map.md` (seeded with the Button/ButtonV2 rows in Task 7's column format)
- Modified: `src/components/index.ts` (exports), `src/__tests__/architecture.test.ts` (API snapshot: + `Button`, `buttonVariants`), `src/tokens/brands/{types,cial,dnb,il}.ts`, `src/styles/{tokens,theme}.css` (generated), `docs/migration/token-gaps.md`, `eslint.config.js` (component `*.stories.tsx` classified as `storybook` so they may import `src/stories/ResponsiveSpec`), `src/__tests__/eslint-boundaries.test.ts` (+2 cases), `src/__tests__/styles.test.ts` (selector splitter now respects escaped commas in arbitrary-value class names; latent bug), `package.json`/`package-lock.json`
- Public API from `src/index.ts`: `Button`, `buttonVariants` (values); `ButtonProps`, `ButtonVariant`, `ButtonSize`, `ButtonVariantOptions` (types). `buttonVariants(options)` returns a conflict-resolved (`cn`) string, so it can be applied to elements that cannot use `asChild`.

## Dependency justification (bundle size)

- `class-variance-authority@^0.7.1`: 976 B unminified ESM in `dist/node_modules` (about 0.5 kB gzip). It is the plan's mandated variant mechanism (Quality Bar: variants through cva), it has no dependencies apart from clsx (already a dependency), and it replaces hand-written variant maps that every component would otherwise duplicate.
- `@radix-ui/react-slot@^1.5.0`: 3.5 kB + `@radix-ui/react-compose-refs` 0.8 kB unminified (about 1.5 kB gzip together). It provides `asChild` with correct prop/ref/handler merging; later Radix-based components (Dialog, Popover, Select, Tooltip) depend on it anyway, so it is shared, not additive.

## Concerns

1. **Impeccable gates not run with the user**: `init` (PRODUCT.md), `shape` confirmation, `audit`/`polish`. They need user interaction, which a subagent cannot reach. The controller or user should run `/impeccable init` once for the repo, then `audit`/`polish` on Button. Visual baselines at four breakpoints still need user review (Quality Bar).
2. **Token semantics changed**: D&B/IL `destructive` is now red/600 instead of the DS `error.main` red/400, for AA contrast. Design should confirm.
3. **D&B `foreground` (#64748B) is borderline**: 4.56 on `background`, 4.34 (fail) on `muted`. A future component pairing those will fail AA for D&B.
4. **Font not loaded in Storybook**: `--font-family` is `'Open Sans', sans-serif`, but nothing loads Open Sans, so stories (and the screenshots) render in the fallback sans. Consumers must supply the font; Storybook should load it (`preview-head.html`) in a follow-up.
5. **Dependencies are bundled into `dist/node_modules`** (pre-existing pattern: clsx and tailwind-merge already ship this way, since `rollupOptions.external` lists only React). cva and the Radix slot follow the same pattern; worth revisiting in Task 15 (size-limit), since consumers with their own Radix copy get a duplicate.
6. `asChild` + `loading` renders no spinner (semantics only); `asChild` + `disabled` on an `<a>` is not handled (consumers pass `aria-disabled`). Both are documented in TSDoc.
7. The 4 extra viewport/token test stories are tagged `!dev`/`!autodocs`, so they run in vitest but are hidden from the Storybook sidebar and docs.

---

## Review fixes (round 1)

### 1. Externalize dependencies (Important)
- `vite.config.ts`: `external` is now a function that treats every `dependencies` and `peerDependencies` name from package.json (and its subpaths: `react-dom/client`, `react/jsx-dev-runtime`, ...) as external. `dist/node_modules` is gone; `Button.js` imports bare `class-variance-authority` and `@radix-ui/react-slot`, and `lib/cn.js` imports bare `clsx` and `tailwind-merge`. This also fixes the same defect from Task 4.
- Test: `scripts/vitest-global-setup.ts` now provides `buildOutDir` (the real `vite build` temp dir). `src/__tests__/package.test.ts` gains `does not vendor dependencies into the output` and `imports runtime dependencies by bare specifier`. RED before the fix: both failed (`expected true to be false`; specifier arrays missing). GREEN after.
- Observation, out of scope: `dist/_virtual/_rolldown/runtime.js` and `dist/test-setup.d.ts` are emitted too (both predate Task 6). The second is a dts `exclude` gap for `src/test-setup.ts`; worth fixing in Task 15.

### 2. asChild + disabled, aria-disabled (Important)
- With `asChild`, `disabled` is no longer forwarded. The child gets `aria-disabled="true"` and `tabIndex={-1}`, and clicks are prevented (`preventDefault`, no `onClick`). The click guard is now `loading || disabled || aria-disabled === true/'true'`.
- Decision: a consumer-set `aria-disabled` on a native Button also blocks `onClick` (it gets the disabled look, and a disabled-looking control that fires is a trap). It stays focusable (that is the point of `aria-disabled`). Documented in the story docs.
- Styling: instead of duplicating every `hz:disabled:*` class as `hz:aria-disabled:*`, I added one custom variant in `src/styles/index.css`: `@custom-variant inactive (&:is(:disabled, [aria-disabled='true']:not([aria-busy='true'])))`. Every disabled style is written once as `hz:inactive:*`. The `:not([aria-busy])` is needed because loading also sets `aria-disabled` and must keep its variant colours. It is reusable for later controls, and it also applies when `buttonVariants` styles a raw element. The compiled CSS emits `inactive` after `hover`, so it wins.
- Tests: unit `asChild disabled maps to aria-disabled and blocks the link` (RED, then GREEN), `consumer aria-disabled blocks onClick but keeps the button focusable` (RED, then GREEN), `asChild loading blocks navigation` (already GREEN: the loading guard already called preventDefault; kept as a regression test). Browser: the token story now asserts that an asChild disabled link has the same background and colour as a native disabled button, and `cursor: not-allowed` (RED `rgb(0, 80, 240)` vs muted, then GREEN). Mutations: `inactive:bg-muted` -> `disabled:bg-muted` fails the browser test; dropping `tabIndex: -1` fails the unit test.

### 3. Motion tokens (Minor)
- `scripts/build-tokens.ts` emits `--transition-duration-*: initial` plus `--transition-duration-{instant,fast,normal,slow,slower}` from `src/tokens/motion.ts` into `@theme inline`. Probed against Tailwind 4.3.3: `duration-*` utilities read the `--transition-duration-*` namespace, not `--duration-*`. Button uses `hz:duration-fast`. Easing was already token-backed (`hz:ease-standard`).
- Test: `build-tokens.test.ts` asserts the namespace reset and every duration (RED, then GREEN). Drift tests are green after `npm run build:tokens`. ADR 0001's "Durations" bullet was amended.

### 4. Typography overrides (Minor)
- Decision: add three type-scale roles, `label/sm` (12/16), `label/md` (14/20), `label/lg` (16/24), all semibold, to `src/tokens/typography.ts`. They generalise Horizon's `button` style (14px semibold) for buttons, tabs and chips, with leading that suits wrapped labels. Button now uses `hz:text-label-{sm,md,lg}` only; the `leading-*` and `font-semibold` overrides are gone. Rendering is identical: the existing computed-style story still asserts 12/16, 14/20, 16/24px and weight 600, unchanged. `cn` picks the new roles up automatically (derived from `typeScale`).
- Role-count tests 11 -> 14 (`build-tokens.test.ts` x2 plus explicit label values, `styles.test.ts`): RED, then GREEN. Docs updated: token-gaps.md, ADR 0001, 02-tokens-and-theming.md.

### 5. Types and comments (Minor)
- `ButtonVariantOptions = VariantProps<typeof buttonStyles>`; `ButtonVariant` and `ButtonSize` are derived from it with `NonNullable<...>`. `ButtonProps` still exposes `variant?: ButtonVariant`, so `exactOptionalPropertyTypes` behaviour is unchanged (the type test still passes).
- Added a comment on the inner `[gap:inherit]` span, and TSDoc on `buttonVariants` stating the convention: the exported `*Variants` wraps cva in `cn()`.

### 6. Link target and report correction (Minor)
- The `link` variant gets `hz:min-w-11` (it has no inline padding). The mobile viewport test now checks a `Go` link at every size is at least 44x44 (RED: width 18.67, then GREEN; mutation removing `min-w-11` fails it).
- Correction to the contrast table above: **cial ghost rest is 17.10:1**, not 12.15. CIAL `foreground` is blueGrey/900 `#0F172A`; I had used blue/900 `#1F3258`. Ghost rest per brand: cial 17.10, dnb 4.56, il 17.10. The cial hover cells already used `accent-foreground` blue/900 `#1F3258` on `accent` correctly (10.09). Pass/fail conclusions are unchanged.

### Verification
`npx vitest run`: 11 files / 104 tests pass. `npm run typecheck` 0 errors; `npm run lint` clean; `npm run build` OK (`Button.js` 3.60 kB / 1.40 kB gzip, no `dist/node_modules`); `npm run build-storybook` OK.

Deferred as instructed: coarse-pointer and breakpoint-edge tests, hover-while-loading and spinner reduced-motion tweaks, Storybook font loading.
