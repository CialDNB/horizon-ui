# Porting checklist (x-core -> horizon-ui)

Use for every component. Copy the list into the PR description and tick each item. Rules come from the plan's Global Constraints, Responsive Standard and Quality Bar; this file is the per-component form of them. `Button` (Task 6) is the reference implementation.

## 0. Pick the source

- [ ] Port the **highest-numbered version** of the family under the plain name (`SelectV2` -> `Select`). Never port a lower version. The family and its status are in `component-map.md`; `scripts/usage-report.ts` lists the versions.
- [ ] Read the x-core source (`x-core/src/components/<Latest>`) for behaviours to preserve and its `*.types.ts` for the public API to map.
- [ ] Mark the map row `in-progress`.
- [ ] Run `/impeccable craft` and get the design agreed against Figma/Horizon DS (not shadcn defaults) before writing code. Forms and overlays also get `/impeccable harden`.

## 1. Files and header

- [ ] Folder `src/components/<Name>/` with `<Name>.tsx`, `<Name>.stories.tsx`, `<Name>.test.tsx`, `index.ts`.
- [ ] File header comment names the **shadcn source and version** the component is based on (for example `Based on shadcn/ui <name> (registry <date or CLI version>)`), or `No shadcn base: Radix/native` when there is none, plus the x-core source component and version it replaces.
- [ ] Added to `src/components/index.ts` (named exports only; no default exports in `src/`).
- [ ] Public API snapshot updated and the diff reviewed (nothing exported by accident).
- [ ] `component-map.md` row updated: status `done`, **API differences** column filled with the real differences (props renamed, removed, added), and a migration table like the Button section when the surface is large.

## 2. API

- [ ] Props extend the native element props plus `DnbBase` (`data-did?: string`). No MUI props (`sx`, `color` palettes, `component`); polymorphism is `asChild` (Radix `Slot`) or `as` only where x-core had `component`.
- [ ] Variants are expressed with `cva` and merged with `cn()`; no boolean-prop explosion. A new need is a new variant, never a changed one (published APIs do not break).
- [ ] Compound parts (`Dialog.Header`) where shadcn does it; otherwise small single-purpose components. Extract shared logic at 3+ uses only.
- [ ] `React.forwardRef` and `displayName` set.
- [ ] Every public prop and the component carry a TSDoc comment (feeds Storybook autodocs and the MCP manifest).
- [ ] Type tests (`*.test-d.ts` with `// @ts-expect-error`) for required props, for example `aria-label` on icon-only controls.
- [ ] New direct dependency: bundle-size justification in the PR description.

## 3. Styling

- [ ] Semantic tokens only (`bg-primary`, `text-muted-foreground`), never primitives such as `blue-500`. Missing semantic role: add it to `docs/migration/token-gaps.md` and `src/tokens`, do not inline a value.
- [ ] Spacing on the 4px scale, radius per the radius rule, motion from the motion tokens, type from the type scale. Never animate width/height/top/left; honour `prefers-reduced-motion`.
- [ ] Classes carry the `hz:` prefix; no global selectors; nothing outside `.hz-root` / the portal container.
- [ ] Logical properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`. No `left`/`right`/`ml`/`pl`. Directional icons use `mirrored` under RTL.
- [ ] No MUI or Emotion import (a test enforces it).

## 4. Responsive (every component, four breakpoints)

Breakpoints: mobile 0 (base), `tablet:` 768, `laptop:` 1280, `desktop:` 1920 (with the `hz:` prefix).

- [ ] A **`Responsive` story** containing a table of what changes at **mobile / tablet / laptop / desktop**: size, density, layout, content visibility, interaction pattern. "Identical at all four" is acceptable only when written down with the reason.
- [ ] `/impeccable adapt` pass done for the four breakpoints and the findings applied.
- [ ] Interactive elements are at least **44x44px at mobile** (and for coarse pointers); form controls are at least 44px tall with 16px text on mobile to prevent iOS zoom. Hover-only behaviour has a touch and keyboard equivalent.
- [ ] **No horizontal overflow at 320px**, with long text, RTL and 200% zoom (reflow).
- [ ] Overlays adapt: Dialog and Drawer are full-screen or bottom sheet at mobile; Popover, DropdownMenu and Select become sheets where content would overflow.
- [ ] Tables, navigation, pagination, tabs and app bar define an explicit small-screen pattern (card list, scroll with affordance, or collapse to menu).
- [ ] Layout flips exactly at the edges 767/768, 1279/1280, 1919/1920.
- [ ] Tests exercise four viewports: mobile 375x812, tablet 768x1024, laptop 1280x800, desktop 1920x1080.

## 5. Coexistence with legacy hosts (Tasks 7 and 7b lesson)

customer360 ships an unlayered Bootstrap 4.4.1 reboot that beats every `@layer`, so a component that looks right in Storybook can be restyled in the app.

- [ ] Components that render an anchor (`<a>`, `asChild` links, menu links, breadcrumbs, pagination links, tab links) use **`anchorGuard`** (`src/primitives`) so colour and decoration survive the reboot's `a`, `a:hover` and `a:not([href])` rules, including hover, focus, active, visited and touch.
- [ ] Buttons, inputs, selects and textareas set their own type, radius, focus ring and box model explicitly (the reboot restyles `button`, `input`, `select`, `textarea`, `label`, `table`, `fieldset`, `h1`-`h6`, `p`, `ul`).
- [ ] The component is added to the **coexistence harness** (`coexistence/main.tsx`) and checked against **both CSS builds** (`styles.css` layered and `styles.unlayered.css`) **with the Bootstrap reboot loaded in both load orders** (`?reboot=1`, `?order=horizon-first`). Add a Playwright assertion for the properties that matter (font-size, padding, radius, colour, focus ring) and run `npm run test:coexistence`.
- [ ] Overlays are added to the stacking test (above MUI modal 1300) and portal into `.hz-root` via `usePortalContainer()`; opened outside a provider they still render styled (dev warning, no crash).

## 6. Accessibility

- [ ] Correct role and accessible name; keyboard operable (Tab, arrows, Home/End, Enter/Space, Escape as applicable); visible `:focus-visible` ring; focus is trapped and restored for overlays.
- [ ] State attributes are real (`aria-expanded`, `aria-current`, `aria-invalid`, `aria-describedby`, `aria-busy`).
- [ ] `eslint-plugin-jsx-a11y` strict is clean; `vitest-axe` passes.
- [ ] Storybook a11y runs with `test: 'error'` on every story, including all three brands.

## 7. Stories and tests

- [ ] Stories: Default, every variant, sizes, states (hover, focus-visible, active, disabled, loading, error, empty, long text), **brand (cial, dnb, il) x direction (ltr, rtl)** matrix, `Responsive` (section 4).
- [ ] Unit tests (Testing Library): role, accessible name, keyboard interaction, focus management, prop-to-class variant mapping, ref forwarding, `data-did` pass-through, plus the per-breakpoint assertions listed for the task in the plan.
- [ ] Renders without `HorizonProvider` and with an unknown `brand` (falls back to `cial`, no crash, styled).
- [ ] Tree-shaking: importing only this component keeps the others out of the bundle; size-limit entry within budget.

## 8. Definition of done

- [ ] `npx tsc --noEmit` (`npm run typecheck`), `npx eslint .`, `npx vitest run` (unit and storybook projects), `npm run build`, `npm run test:coexistence` all clean.
- [ ] `/impeccable audit` clean, `/impeccable polish` pass done, visual baselines at four breakpoints reviewed by the user.
- [ ] Map row `done`; PR description has JIRA reference, Figma link, dependency justification (if any) and the "Why?" notes for any deviation from x-core behaviour.
- [ ] Commit only when the user says so; no `Co-Authored-By` trailer.
