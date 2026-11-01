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

## Palette keys without a semantic home

| x-core key | Brands | Note |
|---|---|---|
| `background.paper` | all | Needs a `card`/`popover` pair. Add `card`, `card-foreground`, `popover`, `popover-foreground` when Card/Popover are ported. |
| `text.disabled` | all | Needs a disabled token. |
| `<role>.light`, `<role>.dark`, `<role>.hover` for primary/secondary/error/warning/success/info | all | Hover and tint/shade variants. `primary.light`/`dark` are used only to derive `accent`. |
| `success/warning/info .contrastText` | all | No `success-foreground`, `warning-foreground`, `info-foreground` keys in the brief. Warning contrast is amber/900 (CIAL, D&B) or #5F4B14 (IL). |
| `<role>.disable`, `option_1`, `backgroundColorLight`, `ultraDark`, `ultraLight`, `medium` | il | Alert backgrounds and disabled tints. |
| `grey`, `blueGrey`, `blue`, `indigo`, `cyan`, `lightBlue`, `red`, `amber`, `teal`, `green`, `orange`, `pink`, `purple` scales | cial, dnb | Exposed as `--hz-*` primitives only. |
| IL-specific scales (`lightBlue`, `orange`, `grey`, `blue`, `purple`, `pink`, `yellow`, `aquamarine`, `lightRed`, `deepPurple`, `lightGreen`) | il | Differ from the shared primitives; not ported. |
| `lime`, `black`, `bright` | all | Chart/ghost-button colours. |
| `gradient` (`main`, `option_1`, `option_2`) | all | Gradients are CIAL-only primitives (`--hz-gradient-cial1/2`); D&B and IL have no Horizon gradient. |
| `default`, `neutralDark`, `neutral`, `neutralLight` | all | Deprecated in x-core; not ported. |
| `globalPalette`, `horizonPalette` | all | Legacy extended scales; not ported. |

## Typography without a home

Only the 11 `typeScale` roles are ported. Not ported: MUI variants `h5`, `h6`, `subtitle1`, `subtitle2`, `overline` (uppercase, 0.08em tracking), `button`; legacy `title`, `bannerTitle`, `cardTitle`, `mainTitle`, `thead`; `letterSpacing`; x-core's IL typography (14px base, excluded from Horizon DS; IL uses cial typography by decision).

## Other

- `elevation` slots 5-24 and `muiShadowsArray` (MUI-specific) are dropped.
- Rem-based font tokens assume a 16px root; scoping `font-size` on `.hz-root` is deferred to the coexistence task.
