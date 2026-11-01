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

```ts
// Modern host (no unlayered global element CSS):
import '@cialdnb/horizon-ui/styles.css';
// Legacy host with unlayered global element CSS such as Bootstrap's reboot
// (customer360). Import after the legacy CSS:
import '@cialdnb/horizon-ui/styles.unlayered.css';
```

Import exactly one of the two, once, and render components inside `HorizonProvider`. Which build to choose and why: [ADR 0001](docs/architecture/decisions/0001-css-isolation.md).

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
