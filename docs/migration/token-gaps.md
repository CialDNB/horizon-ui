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

## Palette keys without a semantic home

| x-core key | Brands | Note |
|---|---|---|
| `background.paper` | all | Needs a `card`/`popover` pair. Add `card`, `card-foreground`, `popover`, `popover-foreground` when Card/Popover are ported. |
| `text.disabled` | all | Needs a disabled token. |
| `<role>.light`, `<role>.dark`, `<role>.hover` for secondary/warning/success/info (primary/error hover now ported, see above) | all | Hover and tint/shade variants. `primary.light`/`dark` are used only to derive `accent`. |
| `success/warning/info .contrastText` | all | No `success-foreground`, `warning-foreground`, `info-foreground` keys in the brief. Warning contrast is amber/900 (CIAL, D&B) or #5F4B14 (IL). |
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
