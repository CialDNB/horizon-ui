# 05 — Migration and Coexistence

## Strategy

horizon-ui lives beside x-core. Consumers (starting with customer360) add `@cialdnb/horizon-ui` as a second dependency and migrate screen by screen. x-core is frozen to fixes only, then removed once customer360 (and other consumers) no longer import it.

## Coexistence rules (what makes side-by-side safe)

| Risk | Mitigation |
|---|---|
| CSS reset leaking into MUI screens | No global preflight; reset scoped to `.hz-root` (03) |
| Class collisions with consumer CSS/Tailwind | `hz:` prefix (+ `@layer horizon` in the layered build) (03) |
| Unlayered global element CSS in the host (customer360: Bootstrap 4.4.1 reboot) restyling horizon elements | customer360 imports `@cialdnb/horizon-ui/styles.unlayered.css`, loaded after its legacy CSS; horizon classes beat element selectors by specificity (ADR 0001). Wrapping the legacy CSS in `@layer legacy` and using `styles.css` is an option, not a requirement |
| Root font-size mismatch (MUI `htmlFontSize: 14` against customer360's browser-default 16px root; a 14px `html` is the stress case; Horizon = 16px) | Type tokens are emitted in px and spacing/radius are px, so components render identically regardless of html size. The rem-against-scoped-font-size approach was disproved by the spike (rem resolves against `html`, not `.hz-root`); see [ADR 0001](decisions/0001-css-isolation.md) |
| Export name clash if both imported in one file | horizon-ui exports the same component names (`Button`, `Dialog`...). Consumers alias on import during transition. Not suffixed with V-numbers: x-core's `V2` suffix existed to dodge breaking changes; horizon-ui is a fresh API |
| Two theme systems | Independent. `ThemeProvider` (MUI) and `HorizonProvider` nest freely; they share only brand intent. Both read the same brand source in the app |
| Portals / z-index | Radix portals target `.hz-root` container; z-index scale tokens documented; MUI modals use 1300 — horizon overlays must be ordered intentionally (builder to define scale) |
| Bundle size during overlap | Both ship; accepted cost until x-core removed. Per-component imports keep horizon-ui tree-shakeable |
| RTL | MUI uses stylis-plugin-rtl; horizon-ui uses logical properties. A mixed RTL screen works because each is self-consistent under `dir="rtl"` |

## Verified coexistence (automated gate)

`npm run test:coexistence` (Playwright, `coexistence/`, details in [ADR 0001](decisions/0001-css-isolation.md)) renders MUI v5 (Legacy-like theme with `htmlFontSize: 14` on the 16px root as in customer360, and a 14px root as stress case, `CssBaseline`) beside horizon-ui built from the real package output and fails on any regression of these guarantees:

- Loading `styles.css` or `styles.unlayered.css` leaves MUI Button, Typography and `body` computed styles (font-size, padding, radius, colour, family, line-height) identical.
- Plain elements outside `.hz-root` (`button`, `h1`, `a`, `input`, `table`, `p`, `ul`, `body`) are unchanged by either build, without Bootstrap's reboot and with it in both load orders.
- With the unlayered build, the real Bootstrap 4.4.1 reboot changes none of 18 measured properties of the six Button variants (keyboard-focused) and the loading button, in both load orders: radius 20px, `md` type 14px/20px, 2px solid ring focus outline, no ring on mouse focus, progress cursor while loading.
- Horizon components do not depend on the host's root font-size: a Button is the same size at `html` 14px and 16px.
- Horizon `dir="rtl"` and MUI ltr on one page do not affect each other.
- No horizontal overflow at 320px; `hz:tablet:`, `hz:laptop:`, `hz:desktop:` flip exactly at 768, 1280 and 1920px.
- Pending (Task 11): Dialog stacking above/below a MUI modal and both clickable.

Not guaranteed (measured, see the ADR):

- With the layered `styles.css`, the unlayered reboot overrides the Horizon Button's `border-radius` (20px to 0), `font-size` (14px to 16px), `line-height` (20px to 24px), focus outline (2px solid ring to 5px auto, also on mouse focus) and loading cursor. That is why customer360 uses the unlayered build.
- With the layered build, `Button asChild` around an `<a href>` takes Bootstrap's `a { colour; transparent background }` at rest and `a:hover` colour (`#0056b3`) and underline on hover. With the unlayered build this is fixed: all six link variants keep colour, fill and decoration at rest, hover, focus, active and visited, and on touch devices, in both load orders (measured).

The harness needs `npx playwright install chromium`. MUI and Emotion are devDependencies used only there; they are never in `dependencies`, `peerDependencies` or `src/`.

## Horizon controls inside MUI dialogs

MUI renders a Dialog (and Modal, Drawer, Popover, Menu) into `document.body`, outside the app's `HorizonProvider` element. **Wrap the dialog content in a `HorizonProvider`** (no props needed: a nested provider inherits `brand` and `dir` from its parent, also across MUI's portal):

```tsx
<HorizonProvider brand="cial" dir={dir}>      {/* app root */}
    ...
    <MuiDialog open={open} onClose={close}>
        <DialogContent>
            <HorizonProvider>                  {/* no props: inherits brand and dir */}
                <FormField label="Company">
                    <Select placeholder="Choose">...</Select>
                </FormField>
            </HorizonProvider>
        </DialogContent>
    </MuiDialog>
</HorizonProvider>
```

Measured in the coexistence harness (`coexistence/tests/components.spec.ts`, unlayered build + full Bootstrap + customer360 host CSS):

- **With the inner provider** the controls are inside `.hz-root` (Horizon variables and styles apply); a Select opens from the keyboard, arrows and Enter select, Escape closes only the list (the MUI dialog stays open), focus returns to the trigger, options are exposed to assistive technology (role queries find them), pointer selection works, and the list is above the dialog (`--z-dropdown` 1400 > MUI 1300).
- **Without it the controls are not usable**: they sit outside any `.hz-root`, so `var(--primary)` resolves to Bootstrap's own `:root --primary` (#007bff) and the other variables are missing; and a Select list portals into the app-level provider inside `#root`, which MUI's ModalManager marks `aria-hidden` while the dialog is open, so screen readers cannot reach the options even though keyboard focus is on one. horizon-ui does not try to detect MUI.

A `container` prop on Select was considered and not added: any container must itself be a `.hz-root` (for the variables), which is exactly what the inner provider gives; later overlays (Dialog, Popover, Tooltip) follow the same rule.

### Overlays and MUI dialogs: stacking, Escape, focus (Task 11b)

Every Horizon overlay layer is above the MUI modal (1300): Dialog/Drawer 1350 < DropdownMenu 1400 < Popover 1450 < Tooltip 1500 < Toast 1600 (`src/tokens/zIndex.ts`). Measured in `coexistence/tests/coexistence.spec.ts` ("stack in intended order") and `coexistence/tests/overlays.spec.ts`, both builds, full Bootstrap + customer360 host CSS:

- **Supported: a Horizon overlay opened from inside an MUI Dialog** (content wrapped in the inner `<HorizonProvider>`). It portals into that provider, i.e. inside the MUI dialog's DOM, so MUI's focus trap accepts focus in it and its content is not `aria-hidden`. It paints on top, a Horizon Dialog's scrim covers the MUI dialog (no click-through), Tab stays in the Horizon dialog, Escape and a scrim click close only the Horizon overlay and focus returns to its trigger inside the MUI dialog; a second Escape then closes the MUI dialog.
- **Escape containment.** MUI's Modal closes on any Escape `keydown` that reaches it, ignoring `defaultPrevented`. Radix handles Escape on `document` in the capture phase, so every Horizon overlay stops the native event there (`containEscape` in `src/primitives/overlay.ts`); without it one Escape closed both (measured before the fix).
- **Toasts while a modal is open** (an MUI Dialog with the inner provider, or a Horizon Dialog/Drawer): the toast list portals into the topmost open modal layer (the open Horizon panel, or a nested HorizonProvider inside a host `role="dialog"`), so it is inside the focus trap, not `aria-hidden`, keyboard (F8, Tab) and pointer reachable, and pressing a toast never closes the modal. Measured in `coexistence/tests/overlays.spec.ts` and `src/components/Toast/ToastInModal.test.tsx`. Enter animations fill `backwards` only, so after opening the panel is not a containing block and the list stays at the page's bottom end (measured: with `both` the list was confined to the dialog panel).
- **Not supported: an MUI Dialog opened from a Horizon Dialog.** The MUI dialog (1300, in `body`) renders below the Horizon dialog (1350) and the modal Horizon dialog blocks pointer input outside itself. Migrate the inner dialog first, or close the Horizon dialog before opening the MUI one.

## Component porting order (proposal)

Principle: foundational + most-used first so customer360 gets value early. Final ranking should come from import counts in customer360 (builder: grep x-core imports in `customer360/client`).

1. Foundations: Typography, Button, IconButton, Link, Badge/Chip, Icon wrapper.
2. Form controls: Input, Textarea, Select, Checkbox, Radio, Switch, Label, FormField (+ react-hook-form integration if used by customer360).
3. Overlays: Dialog, Drawer/Sheet, Popover, Tooltip, Menu/Dropdown, Toast.
4. Layout/nav: Tabs, Accordion, Breadcrumbs, Drawer navigation (x-core `DrawerV2` is recent and active — confirm whether to port or redesign), AppBar.
5. Data display: Table, Pagination, Card, Avatar, Skeleton, Alert.
6. Heavy / non-shadcn: charts, date pickers, file dropzone, flow diagrams. Chosen per case (Recharts already used directly; react-day-picker for dates; react-dropzone kept). Lowest priority; may remain on x-core longest.

Components with no shadcn base are built on Radix or headless libraries following the same conventions.

## Tracking

`docs/migration/component-map.md` (created during implementation): table of x-core component -> horizon-ui component -> status -> notes on API differences. API differences are expected (MUI props -> native props + variants), documented per component.

## Retirement criteria for x-core

1. Zero `@cialdnb/x-core` imports in customer360 and other listed consumers.
2. horizon-ui `1.0.0` published and adopted.
3. x-core archived read-only; last version tagged and left in the registry.

## Out of scope here

Automated codemods; migrating consumer repos other than customer360 (decided per repo later).
