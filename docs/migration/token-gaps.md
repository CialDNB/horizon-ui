# Token gaps (x-core -> horizon-ui)

Palette and typography keys in x-core's Horizon palettes (`palette-{cial,dnb,il}.ts`, `typography-*.ts`) that have no semantic home in `SemanticKey` (`src/tokens/brands/types.ts`). They are not emitted as semantic variables. Primitives remain available as `--hz-*` but must not be used by components.

## Derived neutral roles (no direct x-core source)

x-core palettes define no `muted`, `accent`, `border`, `input` or `ring`. Decisions:

| Semantic key | cial | dnb | il |
|---|---|---|---|
| `muted` | blueGrey/100 | blueGrey/100 | #F1F5F9 |
| `muted-foreground` | `text.secondary` (blueGrey/600) | same | `text.secondary` (#64748B) |
| `accent` | primary.light | primary.light | primary.light |
| `accent-foreground` | primary.dark | primary.dark | primary.dark |
| `border` | `borderColor.subtle` | same | same |
| `input` | `borderColor.default` | same | same |
| `ring` | primary.main | primary.main | primary.main |

Also: `background` is `background.default` (grey/50); IL has no `background` and uses grey/50.

## Interactive state keys (added in Task 6, Button)

| Semantic key | cial | dnb | il | Source |
|---|---|---|---|---|
| `primary-hover` | blue/700 `#0039B2` | indigo/700 `#303F9F` | `#303F9F` | x-core `primary.hover` (CIAL, D&B); IL has no hover, uses the same indigo/700 as D&B |
| `destructive-hover` | red/700 `#AB0722` | red/700 `#AB0722` | `#AB0722` | x-core `error.hover` is red/700 (CIAL), red/600 (D&B); one step darker than `destructive` everywhere |

**`destructive` changed for dnb and il: red/400 `#ED3F48` -> red/600 `#C90A2A`.** White `destructive-foreground` on `#ED3F48` is 3.88:1, below WCAG AA 4.5:1 for button text. `#C90A2A` (D&B's own `error.hover`) gives 5.90:1. CIAL keeps red/500 `#E70D32` (4.67:1).

Contrast of every Button variant per brand is listed in `.superpowers/sdd/2026-11-01-horizon-ui-foundation/task-6-report.md` and checked by Storybook a11y (`Components/Button/Brands`).

## Tone keys (added in Task 10a: Typography, Chip, Badge)

`<tone>-subtle` is a tinted surface (Chip soft fill), `<tone>-strong` is the AA-legible text/icon shade of the tone: at least 4.5:1 on `background` and on its own `-subtle`, and `background`-coloured text on it (Badge count) is at least 4.5:1 too. The plain `success`/`warning`/`info`/`destructive` roles stay fills and indicators; as text on `background` they fail (`success` 3.52:1, CIAL `destructive` 4.47:1). The primary tone reuses `accent` / `accent-foreground`.

| Semantic key | cial | dnb | il | Source |
|---|---|---|---|---|
| `neutral-subtle` | blueGrey/100 `#F1F5F9` | same | `#F1F5F9` | x-core default chip surface family (blueGrey) |
| `neutral-strong` | blueGrey/700 `#334155` | same | `#334155` | darker than `muted-foreground` so it passes on `neutral-subtle` in every brand (dnb `foreground` on muted is 4.34:1) |
| `info-subtle` / `info-strong` | lightBlue/50 `#E1F5FE` / lightBlue/900 `#01579B` | same | `#E1F5FE` / `#01579B` | x-core chip info: INFO[50] / INFO[900]; IL `info.light`/`info.dark` |
| `success-subtle` / `success-strong` | teal/100 `#CCFBF1` / teal/800 `#115E59` | same | `#D9F4F1` / `#134E4A` | x-core chip success: TEAL[100] / TEAL[800]; IL `success.option_1`/`success.dark` |
| `warning-subtle` / `warning-strong` | amber/100 `#FEF3C7` / amber/900 `#9B5403` | same | `#FDF4DB` / `#9B5403` | x-core chip warning: WARNING[100] / WARNING[900]; IL `warning.light`/`warning.dark` |
| `destructive-subtle` / `destructive-strong` | red/100 `#FFE4E6` / red/600 `#C90A2A` | same | `#FCE0E2` / `#730314` | x-core chip error: ERROR[100] / ERROR[600]; IL `error.option_1`/`error.dark` |

Ratios per brand are asserted in `src/tokens/contrast.test.ts` and listed in `.superpowers/sdd/2026-11-01-horizon-ui-foundation/task-10a-report.md`. Not added: `success-foreground`/`warning-foreground`/`info-foreground` (solid fills with text), because no component needs them yet.

## Form and overlay keys (added in Task 11a: forms, Select)

| Semantic key | cial | dnb | il | Source |
|---|---|---|---|---|
| `control-border` | blueGrey/500 `#64748B` | same | `#64748B` | x-core input resting border (`shared/inputs/inputStyles.ts`: `blueGrey[500]`). `input` (blueGrey/300, 1.4:1 on background) fails WCAG 1.4.11 for a control boundary; it stays the disabled border. 4.6:1 on `background`, 4.8:1 on `popover`. |
| `popover` | white | white | `#FFFFFF` | x-core `background.paper`: floating surfaces (Select content; Popover/Dialog in Task 11b) |
| `popover-foreground` | = `foreground` | = `foreground` | = `foreground` | text on `popover` |

z-index scale (`src/tokens/zIndex.ts`, emitted as `--z-*` on `.hz-root`, utilities `hz:z-dialog` ...): dialog 1350, dropdown 1400, popover 1450, tooltip 1500, toast 1600; all above the MUI modal (1300) so horizon overlays opened from inside an x-core dialog stay on top.

## Palette keys without a semantic home

| x-core key | Brands | Note |
|---|---|---|
| `background.paper` | all | `popover`/`popover-foreground` added in Task 11a; `card`/`card-foreground` still to add with Card. |
| `text.disabled` | all | Needs a disabled token. |
| `<role>.light`, `<role>.dark`, `<role>.hover` for secondary/warning/success/info (primary/error hover now ported, see above) | all | Hover and tint/shade variants. `primary.light`/`dark` are used only to derive `accent`. |
| `success/warning/info .contrastText` | all | No `success-foreground`, `warning-foreground`, `info-foreground` keys (see Tone keys: text uses `<tone>-strong`). Warning contrast is amber/900 (CIAL, D&B) or #5F4B14 (IL). |
| `<role>.disable`, `option_1`, `backgroundColorLight`, `ultraDark`, `ultraLight`, `medium` | il | Alert backgrounds and disabled tints. |
| `grey`, `blueGrey`, `blue`, `indigo`, `cyan`, `lightBlue`, `red`, `amber`, `teal`, `green`, `orange`, `pink`, `purple` scales | cial, dnb | Exposed as `--hz-*` primitives only. |
| IL-specific scales (`lightBlue`, `orange`, `grey`, `blue`, `purple`, `pink`, `yellow`, `aquamarine`, `lightRed`, `deepPurple`, `lightGreen`) | il | Differ from the shared primitives; not ported. |
| `lime`, `black`, `bright` | all | Chart/ghost-button colours. |
| `gradient` (`main`, `option_1`, `option_2`) | all | Gradients are CIAL-only primitives (`--hz-gradient-cial1/2`); D&B and IL have no Horizon gradient. |
| `default`, `neutralDark`, `neutral`, `neutralLight` | all | Deprecated in x-core; not ported. |
| `globalPalette`, `horizonPalette` | all | Legacy extended scales; not ported. |

## Typography without a home

The 11 Horizon `typeScale` roles are ported, plus `label/sm|md|lg` (added in Task 6: semibold 12/16, 14/20, 16/24px; generalises the DS `button` style, 14px semibold, for buttons and other controls). Not ported: MUI variants `h5`, `h6`, `subtitle1`, `subtitle2`, `overline` (uppercase, 0.08em tracking), `button` (covered by `label/md`); legacy `title`, `bannerTitle`, `cardTitle`, `mainTitle`, `thead`; `letterSpacing`; x-core's IL typography (14px base, excluded from Horizon DS; IL uses cial typography by decision).

## Other

- `elevation` slots 5-24 and `muiShadowsArray` (MUI-specific) are dropped.
- Font tokens are authored in rem (16px root) in `src/tokens/typography.ts` but emitted as px in `tokens.css`, so a 14px host root (x-core Legacy) cannot shrink them. See `docs/architecture/decisions/0001-css-isolation.md`.

## Design-owner decisions

### Type roles with a 1.0 line-height ratio (logged in Task 10b, not changed)

Four roles in `src/tokens/typography.ts` have a line height equal to their font size, inherited 1:1 from x-core's Horizon typography:

| Role | Now (size / line height) | Proposed | Ratio after |
| --- | --- | --- | --- |
| `body/secondary` | 14 / 14 | 14 / 20 | 1.43 |
| `body/lg` | 20 / 20 | 20 / 28 | 1.4 |
| `caption` | 12 / 12 | 12 / 16 | 1.33 |
| `micro` | 10 / 10 | unchanged unless design decides (single-line badge labels only) | 1.0 |

A 1.0 ratio is fine for one-line labels but makes wrapped text touch line to line (descenders meet ascenders), and leaves no room for the WCAG 1.4.12 text-spacing override. Alert therefore uses `body/default` (16/20) for its description instead of `body/secondary` (x-core used MUI `body2`, 14px).

Changing these tokens is the design owner's call. It changes the rendered height of everything that uses them (Typography with those variants, the Progress value text on `body/secondary`, the Badge label on `micro` if that row changes), so the Typography story baselines and the measured coexistence values (`coexistence/tests/components.spec.ts`, Typography line heights) need updating in the same change.
