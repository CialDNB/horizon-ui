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
```

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
