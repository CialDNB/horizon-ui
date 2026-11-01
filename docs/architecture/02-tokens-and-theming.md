# 02 — Tokens and Theming

## Source of truth

x-core tokens in `x-core/src/theme/tokens/`: `colors`, `typography`, `spacing` (4px base), `borderRadius`, `borders`, `shadows`, `motion`, `iconography`; brand palettes in `x-core/src/theme/horizon/palette-{cial,dnb,il}.ts`; typography per brand `typography-{cial,dnb,il}.ts`.

Tokens are plain TS with no MUI imports (the palette files import MUI *types* only), so they are portable.

## Pipeline

```
tokens/*.ts  (copied once into horizon-ui/src/tokens, then owned here)
      |  scripts/build-tokens.ts
      v
src/styles/tokens.css   (generated, committed)  -> .hz-root primitives + .hz-root[data-brand] semantic vars (never :root)
src/styles/theme.css    (generated, committed)  -> Tailwind v4 `@theme inline` mapping to the vars
src/styles/typography.css (generated, committed) -> `@utility text-<role>` for the type-scale roles (11 Horizon roles + `label/sm|md|lg`)
src/styles/base.css     (hand-written)          -> reset scoped to .hz-root
src/styles/index.css    -> scripts/build-styles.ts -> dist/styles.css (prefix hz:, @layer horizon; ADR 0001)
```

- Copy, don't import across repos. x-core is being retired; a cross-repo dependency would pin us to it. A one-time copy then diverge. (Builder may instead publish tokens as `@cialdnb/horizon-tokens` if a non-React consumer appears — not needed now.)
- Generation script emits CSS variables; a test asserts every token key appears in CSS (no drift).

## Layering of variables

1. **Primitives** (`--hz-blue-500`, `--hz-grey-100`): from `colors.ts`. Never referenced by components (existing x-core rule).
2. **Semantic** (scoped to `.hz-root` / the portal container, never `:root`; `--primary`, `--primary-foreground`, `--background`, `--foreground`, `--muted`, `--border`, `--ring`, `--destructive`, plus Horizon extras like `--success`, `--warning`, `--info`): per brand. These are the names shadcn components already expect, so stock shadcn components work with minimal edits.
3. **Tailwind theme** (`@theme`): maps `--color-primary: var(--primary)` etc. so utilities like `bg-primary` work.

Non-color mappings:

| x-core token | CSS / Tailwind |
|---|---|
| `spacing` (4px unit) | Tailwind `--spacing: 4px` (matches default scale: `p-4` = 16px) |
| `borderRadius` xs 4 / sm 8 / md 16 / lg 20 / xl 40 / full | `--radius-xs..full`; shadcn `--radius` = lg (20, interactive elements) |
| `shadows` | `--shadow-*` |
| `motion` duration / easing | `--duration-*`, `--ease-*`; all transitions gated by `prefers-reduced-motion` |
| `typography` typeScale (`display/xl`, `heading/md`, `body/default`...) | utility classes `text-display-xl` etc. via `@utility`, bundling size, line-height, weight, family |
| `borders` | `--border-width-*` |

Note: tokens are authored in rem with a 16px root (Horizon uses `htmlFontSize: 16`). Consumers still on x-core Legacy set a 14px html font-size, so type sizes are emitted in px (decided in ADR 0001 from spike evidence); `.hz-root` also sets `font-size: 16px` for em-based values.

## Brands

`data-brand="cial|dnb|il"` on the root (or any subtree) overrides semantic variables. Default brand: `cial`. Note x-core's `typography-il.ts` is excluded from Horizon DS rules; IL brand typography here is an open question (see 06).

## Direction

`dir="rtl"` on the root. Components use logical utilities (`ms-*`, `ps-*`, `start-*`, `text-start`). No stylis RTL plugin needed. Directional icons flip via `rtl:` variant.

## Dark mode

Not in x-core today. Out of scope for v1, but semantic-variable structure allows adding `[data-theme=dark]` later without component changes.

## Provider

`<HorizonProvider brand dir>` sets `data-brand`/`dir` and the `hz-root` scope class on a wrapper element. It is optional for components using the default brand but required for non-default brand/RTL. No context-based theme object.
