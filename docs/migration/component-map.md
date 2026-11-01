# Component map (x-core -> horizon-ui)

Seeded by Task 6 (Button). Task 7 fills in the full table and the `customer360 import count` column from `scripts/usage-report.ts`.

| x-core component | horizon-ui component | status | API differences | customer360 import count |
|---|---|---|---|---|
| `Button` | `Button` | superseded | Lower version of the family; not ported. | TBD (Task 7) |
| `ButtonV2` | `Button` | done | See below. | TBD (Task 7) |

## Button (from `ButtonV2`)

| x-core `ButtonV2` | horizon-ui `Button` |
|---|---|
| `variant="contained"` (any `color`) | `variant="primary"` |
| `variant="outlined"` | `variant="secondary"` |
| `variant="text"` | `variant="tertiary"` (`showTextUnderLine` is the default hover: underline) |
| `color="error"` | `variant="destructive"` |
| `color` = `secondary`/`success`/`warning`/`info`/`orange`/`purple`/`neutral`/`bright` | Not ported. Colour is set by the variant; status colours belong to Alert/Badge. `neutral` text buttons map to `variant="ghost"`. |
| (none) | `variant="ghost"`, `variant="link"` (new) |
| `size="small"` / `"medium"` / `"large"` | `size="sm"` / `"md"` / `"lg"` |
| `startIcon` / `endIcon` | Icons as `children`, before or after the label |
| `textColor` | Not ported (token-only colour) |
| `loading` | `loading` (also sets `aria-busy`/`aria-disabled`, keeps focus and width) |
| `sx`, MUI props | `className` (`hz:` utilities), `asChild` for links |
| (none) | `fullWidth` |

Visual deviations from ButtonV2 (no Figma link was available; decisions in the Task 6 report):

- Heights at tablet and up: sm 24 -> 32px, md 36px (same), lg 42 -> 44px (4px grid). Mobile and touch pointers: 44/44/48px minimum target.
- Type: sm 10 -> 12px, md 12 -> 14px (the Horizon `button` token), lg 14 -> 16px; semibold; no 1.25px letter-spacing.
- Radius 20px in both directions (ButtonV2 used 16px in RTL).
- No elevation (ButtonV2 forced `box-shadow: none` on the component anyway).
- Secondary hover fills with `primary` (as ButtonV2 outlined); tertiary hover underlines (as ButtonV2 text with `showTextUnderLine`). The end-icon bounce animation is not ported (decorative motion).
