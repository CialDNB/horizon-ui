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
- `exports` map: `.` (JS), `./styles.css`, `./styles.unlayered.css`, `./tokens` (TS tokens for non-CSS use), `./package.json`. Per-component subpath exports are a builder option if tree-shaking proves insufficient.
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

## Publishing

- GitHub Packages, `@cialdnb/horizon-ui`, same `.npmrc` registry setup as x-core.
- Semver. Start at `0.x` until first consumer integration lands, then `1.0.0`.
- CI: build, typecheck, lint, test, publish on tag / release (mirror x-core workflow; builder to read x-core's `.github/workflows`).
- Local dev against a consumer: `npm link` flow as in x-core.

## MCP server for AI agents

Hosted, authenticated, deployed on every release as a container (not bundled in the npm package). Full design in `07-mcp-server.md`. The same release pipeline publishes the npm package, the Storybook image, and the MCP image. Builder to port after the first ~10 components exist; not a launch blocker.
