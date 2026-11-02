# 03 — Packaging and Distribution

## Repo layout

```
horizon-ui/
├── src/
│   ├── components/<Name>/{Name.tsx, Name.stories.tsx, Name.test.tsx, index.ts}
│   ├── primitives/        # internal shared bits (not exported)
│   ├── tokens/            # TS tokens (owned copy of x-core tokens)
│   ├── styles/            # tokens.css (generated), theme.css, base.css
│   ├── lib/               # cn(), small utils (extract only at 3+ uses, x-core rule)
│   ├── provider/HorizonProvider.tsx
│   └── index.ts           # public API
├── scripts/               # build-tokens, build-mcp-manifest (see below)
├── .storybook/
├── docs/
├── CONSTITUTION.md        # development rules (port the still-valid parts from x-core)
└── package.json
```

Single package, not a monorepo (matches x-core; revisit only if tokens or icons need independent release).

## Build

- Vite library mode, ESM only, `preserveModules: true`, sourcemaps, `.d.ts` emitted.
- Tailwind v4 compiles `src/styles/index.css` at build time to **`dist/styles.css`** (layered, `@layer horizon`) and **`dist/styles.unlayered.css`** (the same rules with every `@layer` flattened away, for legacy hosts), both from `scripts/build-styles.ts`.
- `dist/` is published; `src/` is not.
- `exports` map: `.` (JS), `./styles.css`, `./styles.unlayered.css`, `./tokens` (TS tokens for non-CSS use), `./icons` (Phosphor re-export), `./illustrations`, `./package.json`. Icons and illustrations are subpath-only: a root namespace cannot be tree-shaken (5.5 MB vs 2.6 KB measured). Per-component subpath exports are a builder option if tree-shaking proves insufficient.
- `sideEffects: ["**/*.css"]`.

## CSS delivery (the key constraint)

Consumers must not need Tailwind. Therefore:

- Ship precompiled CSS; consumer imports exactly one build, once:
  - `import '@cialdnb/horizon-ui/styles.css'` (layered): modern hosts, where the host's own unlayered CSS should be able to override horizon and the host has no unlayered global element CSS (or wraps it in a layer).
  - `import '@cialdnb/horizon-ui/styles.unlayered.css'`: legacy hosts with unlayered global element CSS such as Bootstrap's reboot (customer360). Load it after the legacy CSS. Horizon utilities then win over element selectors by specificity; consumers override by specificity and order. Measurements and rules in [ADR 0001](decisions/0001-css-isolation.md#two-builds-layered-and-unlayered-task-7b-controller-ruling).
- Coexistence safety (see 05):
  - **No global preflight.** Tailwind's reset is not emitted globally; a minimal reset is applied only inside `.hz-root` (provider wrapper) and to portal content roots.
  - Tailwind utilities use a **prefix** (`hz:`) in the compiled output so they cannot collide with consumer Tailwind or other classes. Authors write the prefix in source (`hz:flex`, `hz:tablet:px-6`); Tailwind's `--tw-*` internals are renamed to `--hz-tw-*` at build time. Decided in [ADR 0001](decisions/0001-css-isolation.md) after a spike showed scoping under `.hz-root` collides with consumer utility classes.
  - Layered build: all output in `@layer horizon` so consumers can order it relative to MUI/Emotion styles. Unlayered build: the same rules without layers, same scoping and prefix guarantees.
- Radix portals (Dialog, Popover, Select, Tooltip) render at `document.body`; provider re-targets the portal container to a `.hz-root` element so scoped styles/vars apply.
- Consumers *with* Tailwind v4 can optionally import `@cialdnb/horizon-ui/theme.css` to get tokens as `@theme` and use `bg-primary` in their own code. Optional, not required for v1.

## Dependencies

| Type | Packages |
|---|---|
| peer | `react`, `react-dom` (>=18) |
| dependencies | `@radix-ui/*` used, `class-variance-authority`, `clsx`, `tailwind-merge`, `@phosphor-icons/react` (icons re-export; external in the build, never vendored) |
| dev | tailwindcss, vite, typescript, storybook, vitest, playwright |

Radix and cva as direct `dependencies` (not peers) so consumers install nothing else. x-core rule retained: new direct dependency needs a bundle-size justification in the PR.

## Dependency justifications

Sizes are minified, measured by bundling the package alone with Vite (react external); gzip in brackets. Whole-module imports for the small ones, so an upper bound.

| Dependency | Size | Why it is a direct dependency |
|---|---|---|
| `@phosphor-icons/react` | one icon via the `@cialdnb/horizon-ui/icons` subpath: 2.6 KB (1.0 KB); the whole set via a namespace import: about 5.5 MB | x-core's icon set is already Phosphor, so names carry over. Subpath-only exports and `sideEffects: false` upstream keep named imports tree-shakeable (regression-tested in `src/__tests__/package.test.ts`); external in the build, never vendored. |
| `tailwind-merge` | 39.2 KB (10.0 KB) | Resolves conflicting `hz:` utilities when consumers pass `className` (`cn`). Largest of the runtime deps; shared by every component. |
| `class-variance-authority` | 1.6 KB (0.8 KB) | Typed variants (shadcn default); replaces boolean-prop explosions. |
| `@radix-ui/react-slot` | 4.3 KB (1.7 KB) | `asChild` composition (Button as link). Further Radix primitives are justified per component. |
| `clsx` | 0.8 KB (0.5 KB) | Conditional class strings inside `cn`. |
| `@radix-ui/react-checkbox` | 19.8 KB (6.3 KB), incl. its shared Radix internals (primitive, context, presence, use-size); most are shared with the other Radix packages, so the marginal cost after Select is far smaller | `Checkbox` (Task 11a): `role="checkbox"`, tri-state `aria-checked="mixed"`, Space toggling, label/`htmlFor` click, and a hidden native input so it submits with `<form>` and resets with `form.reset()`. Rebuilding this correctly by hand is the shadcn anti-pattern; x-core used MUI's. |
| `@radix-ui/react-radio-group` | 39.5 KB (11.3 KB), incl. roving focus, collection and direction internals (shared with Select) | `RadioGroup` (Task 11a): WAI-ARIA radio group with roving tabindex, arrow-key selection that skips disabled items and reverses in RTL, and native inputs for forms. Roving focus is the error-prone part and is reused by later menus/tabs. |
| `@radix-ui/react-switch` | 16.0 KB (5.3 KB), mostly the internals shared with Checkbox | `Switch` (Task 11a): `role="switch"` with `aria-checked`, Space/Enter, label click and a hidden native input for forms, the same contract as Checkbox. |

## Publishing

- GitHub Packages, `@cialdnb/horizon-ui`, same `.npmrc` registry setup as x-core.
- Semver. Start at `0.x` until first consumer integration lands, then `1.0.0`.
- CI: build, typecheck, lint, test, publish on tag / release (mirror x-core workflow; builder to read x-core's `.github/workflows`).
- Local dev against a consumer: `npm link` flow as in x-core.

## MCP server for AI agents

Hosted, authenticated, deployed on every release as a container (not bundled in the npm package). Full design in `07-mcp-server.md`. The same release pipeline publishes the npm package, the Storybook image, and the MCP image. Builder to port after the first ~10 components exist; not a launch blocker.
