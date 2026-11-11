# Task 8 report: icons (Phosphor re-export) and illustrations

Status: DONE_WITH_CONCERNS

## Decisions
- Icons: `src/icons/index.ts` = `export * from '@phosphor-icons/react'` + `export type { Icon, IconProps, IconWeight }`. `@phosphor-icons/react ^2.1.10` is a direct dependency; external in the build via the existing predicate (verified: `dist/icons/index.js` keeps bare `@phosphor-icons/react` imports). No legacy aliases, no lucide. No RTL helper added: documenting `mirrored` in TSDoc, README, component-map, Icons story (DirectionalRtl) is enough; a helper would only wrap `mirrored={dir === 'rtl'}`.
- Phosphor does NOT set `aria-hidden` (verified by test). Documented in `src/icons/index.ts` and README; test `icon aria-hidden by default` asserts the real behaviour (not set by default, forwarded when passed).
- Illustrations: 28 SVGs copied verbatim to `src/illustrations/assets/{cial,il}/`. Generator `scripts/port-illustrations.ts` (npm run port-illustrations) is a small own transform, no new devDependency: the SVGs use only 8 elements and ~25 attributes, so SVGR+SVGO (large dep tree, optimiser that could rewrite artwork) is unjustified. It converts only attribute spelling (fill-rule -> fillRule, style string -> object), whitelists elements/attributes and THROWS on anything unknown, formats with prettier, and is deterministic. One file per illustration in `src/illustrations/generated/` + generated index. Same export names as x-core (EmptyState, EmptyStateIL, DAAIL ...); mapping in `docs/migration/component-map.md`.
- Ids: 6 of 28 SVGs contain clipPath/mask ids (8 ids). These components call `useSvgId()` (useId reduced to `[A-Za-z0-9_-]`, prefix `hz`) so `id` and `url(#...)` are per instance.
- `IllustrationFrame` (internal) adds: ref, `size` (width+height), `title` -> `<title>` + role img, aria-hidden default, `focusable=false`, viewBox/width/height from the source. Non-square artwork letterboxes inside the `size` box.
- Boundaries: new elements `icons`, `illustrations` (entry only via index.ts; allowed from component, storybook, root). Stories live in `src/stories/` (storybook element).
- Public API: root namespaces `icons`, `illustrations` (snapshot updated intentionally) PLUS subpath exports `./icons` and `./illustrations` (see bundle notes; added because the root namespace cannot tree-shake).
- Docs updated: plan Task 8, 01-overview (stack row), 02 (rtl line), 03 (deps row), 06 Q2, README, component-map (Icons + Illustrations).

## TDD
- RED: `npx vitest run --project unit src/icons src/illustrations` -> both files failed "Failed to resolve import ./index" (no implementation).
- GREEN: 14 tests pass (7 icons, 7 illustrations); script tests 3 pass (no-drift/idempotent, artwork values preserved: every d/fill/stroke/transform equal to the sources, rejects unsupported content). Full `npx vitest run`: 17 files, 146 tests pass (unit + storybook browser project incl. Icons and Illustrations stories with a11y test:'error').
- The earlier 'no mui import' per-folder tests were dropped: the existing `package.test.ts` scans all of src (it flagged the literal regex in my tests).
- The public-API snapshot test imports the root, now loading all Phosphor, and timed out at 5s; its timeout is 30s.
- eslint ., typecheck (incl. coexistence), build, build-storybook, test:coexistence (32 passed, 1 skipped as before): clean.

## Bundle notes (measured with a consumer vite build, minified, react external, dist as input)
| import | size |
|---|---|
| `import { Button } from dist/index.js` (icons unused) | 50.6 KB, icons/illustrations tree-shaken away |
| `icons.CheckIcon` via ROOT namespace | 5507 KB (whole Phosphor set) |
| `CheckIcon` from `dist/icons` (subpath) | 2.6 KB |
| `illustrations.EmptyState` via root namespace | 323 KB (all 28) |
| `EmptyState` from `dist/illustrations` (subpath) | 9.5 KB |
Cause: rolldown lowers `export * as icons` (star re-export of an external) into a runtime `__reExport` object, so member access cannot be shaken (the alternative `import * as` + `export { }` form gives the same result). Only named imports from the subpaths (or `@phosphor-icons/react` directly) tree-shake. dist size: 1.4 MB total, illustrations ~1.0 MB including sourcemaps and d.ts (sources are one module per illustration).

## Concerns
1. Root `icons` namespace is a bundle-size footgun (5.5 MB) when members are used; ruling required it, so it is kept and flagged in TSDoc/README with the subpath as the recommended path. Controller should decide whether to keep the root namespace for icons at all (illustrations cost is modest).
2. Phosphor sets no aria-hidden; decorative icons need it from the consumer (future IconButton/Button usages must pass it).
3. Illustrations default to the artwork's intrinsic size (72-80px) rather than x-core's 50px `img` default: migration note recorded.
4. Button.stories.tsx still has local placeholder icons ("until Task 8"); not touched.
5. Vite warns about `configLoader: native` (pre-existing).

## Files
Created: scripts/port-illustrations.ts, scripts/__tests__/port-illustrations.test.ts, src/icons/{index.ts,icons.test.tsx}, src/illustrations/{Illustration.types.ts,IllustrationFrame.tsx,useSvgId.ts,index.ts,illustrations.test.tsx,assets/**,generated/**}, src/stories/{Icons,Illustrations}.stories.tsx.
Modified: package.json, package-lock.json, vite.config.ts, eslint.config.js, src/index.ts, src/__tests__/architecture.test.ts, README.md, docs (01, 02, 03, 06, migration/component-map.md, plan).

## Fix report: subpath-only exports (controller ruling on concern 1)
- Removed the `icons` and `illustrations` namespaces from `src/index.ts` (root stays flat `components` + provider + cn; API snapshot back to its pre-Task-8 keys). Public API is `@cialdnb/horizon-ui/icons` and `/illustrations` only; `exports` map has both (types + import), build emits JS and d.ts for them.
- Tests in `src/__tests__/package.test.ts` (against the real build in global setup): both subpaths resolve to existing JS and d.ts; root `index.js`/`index.d.ts` mention no icons/illustrations/phosphor; icons entry keeps `@phosphor-icons/react` bare; a consumer vite build importing `CheckIcon` from the built subpath stays under 50 KB (about 2.6 KB measured; whole set 5.5 MB). It takes about 1 s, so it stays a test.
- The snapshot test no longer loads Phosphor and passes alone in well under 5 s, but timed out once under full-run load, so its timeout is 15 s (down from 30 s).
- README, TSDoc (`src/icons/index.ts`, stories), component-map, 01-overview, 03-packaging and plan Task 8 updated: `import { CheckIcon } from '@cialdnb/horizon-ui/icons'` replaces x-core's `icons` namespace.
- Verification: eslint, typecheck, vitest (17 files, 151 tests), build, build-storybook, test:coexistence (32 passed, 1 skipped) all clean.

## Fix report: review round (responsive story, snapshot timeout, docs)
- Icons `Responsive` story added (ResponsiveSpec): catalog grid 2/4/6/8 columns at mobile/tablet/laptop/desktop; icon size identical at all four (chosen by the consuming component) with the reason written down; search input 44px/16px; tiles are non-interactive so no touch target applies. Story tests (a11y error) pass.
- API snapshot: removed the per-test 15 s timeout; the import is now in a `beforeAll` with a 30 s hook timeout and a comment naming the cause (cold transform of Radix-based components under parallel load; body ~200 ms). Full `npx vitest run` passed 3 times in a row (17 files, 152 tests each).
- package.test.ts: consumer-bundle temp dir is removed in `finally`.
- 06-open-questions Q2 now says "from the `@cialdnb/horizon-ui/icons` subpath"; `useSvgId` TSDoc notes separate React roots need different `identifierPrefix`.
- 03-packaging: new "Dependency justifications" section with measured sizes (Phosphor 2.6 KB/icon vs 5.5 MB set; tailwind-merge 39 KB (10 KB gz); cva 1.6 KB; react-slot 4.3 KB; clsx 0.8 KB).
- eslint, typecheck, build, build-storybook clean.
