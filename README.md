# horizon-ui

`@cialdnb/horizon-ui` — successor to `@cialdnb/x-core`. React component library built on shadcn/ui (Radix + Tailwind v4), themed by the existing Horizon DS tokens, published to GitHub Packages.

**Status: architecture draft. Nothing is scaffolded. Awaiting approval of `docs/architecture/`.**

## Development

Requires Node >=20.19.

```sh
npm install
npx playwright install chromium   # browser for story tests (Vitest browser mode)
npm run storybook                 # dev server on :6006
npx vitest run                    # unit tests and story tests
npx vitest run --project storybook  # story tests only
npm run build-storybook
npm run test:coexistence          # MUI + Bootstrap coexistence harness (Playwright); needs `npx playwright install chromium`; must be a CI gate (with `tsc --noEmit -p coexistence`), wired in Task 15
```

## Using it in an app

Modern host (no unlayered global element CSS):

```ts
import '@cialdnb/horizon-ui/styles.css';
```

Legacy host with unlayered global element CSS such as Bootstrap's reboot (customer360), imported after the legacy CSS:

```ts
import '@cialdnb/horizon-ui/styles.unlayered.css';
```

Import exactly one of the two, once, and render components inside `HorizonProvider`. Which build to choose and why: [ADR 0001](docs/architecture/decisions/0001-css-isolation.md).

## Icons and illustrations

Icons are Phosphor (`@phosphor-icons/react`, same set as x-core), re-exported with the `*Icon` names. Prefer the subpath so bundlers can tree-shake: member access on the root `icons` namespace pulls in the whole set (about 5.5 MB minified).

```tsx
import { CaretRightIcon } from '@cialdnb/horizon-ui/icons';
import { EmptyState } from '@cialdnb/horizon-ui/illustrations';

<CaretRightIcon size={20} aria-hidden="true" mirrored={dir === 'rtl'} />
<EmptyState size={96} title="No results" />
```

Phosphor sets no `aria-*`: pass `aria-hidden="true"` on decorative icons and `aria-label` on meaningful ones. Directional icons (`ArrowLeftIcon`, `ArrowRightIcon`, `CaretLeftIcon`, `CaretRightIcon`, `ArrowBendUpLeftIcon`) need `mirrored` under `dir="rtl"`. Illustrations are decorative unless given `title` or `aria-label`. Regenerate them after changing an SVG in `src/illustrations/assets/` with `npm run port-illustrations`.

## Docs

| File | Content |
|---|---|
| `docs/architecture/01-overview.md` | Goals, non-goals, stack, key decisions |
| `docs/architecture/02-tokens-and-theming.md` | x-core tokens -> CSS variables, brands, RTL, dark mode |
| `docs/architecture/03-packaging-and-distribution.md` | Repo layout, build, npm package, CSS delivery |
| `docs/architecture/04-storybook-and-testing.md` | Storybook 10, test layers, CI gates |
| `docs/architecture/05-migration-and-coexistence.md` | Side-by-side with x-core inside customer360, retirement path |
| `docs/architecture/06-open-questions.md` | Decisions needing owner input |
| `docs/architecture/07-mcp-server.md` | Hosted, authenticated MCP server deployed on each release |
