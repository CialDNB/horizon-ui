# horizon-ui: status and remaining work

Last updated after Task 12a. The implementation plan is `docs/superpowers/plans/2026-11-01-horizon-ui-foundation.md`; the architecture is in `docs/architecture/`. The full execution record (ledger with every ruling and review finding, per-task briefs and reports) is in `docs/superpowers/execution/` (`ledger.md` is the index).

## Built and reviewed

- Foundation (Tasks 1-9): scaffold, tokens, scoped Tailwind CSS with two builds (layered `styles.css`, `styles.unlayered.css`), provider, Storybook 10, MUI/Bootstrap coexistence harness (incl. customer360 host CSS and an x-core DialogV2 variant), icons and illustrations, migration map and usage report.
- Task 10: Button, Typography, Chip, Badge, Spinner, Alert, Separator, Progress, Avatar, IconButton, Link.
- Task 11a forms: Label, Input, Textarea, FormField, Checkbox, RadioGroup, Switch, Select.
- Task 11b overlays: Tooltip, Popover, Dialog, ConfirmationDialog, Drawer, DropdownMenu, Toast.
- Task 11c: Combobox, SearchBar, SplitButton, NumberInput, EmailsField, Filter.
- Task 12a: Table and Pagination.

## Remaining (in order)

1. Task 12b: Card, Accordion, Tabs, Timeline (brief: `docs/superpowers/execution/task-12b-brief.md`).
2. Task 12c: Layout, AppBar, NavigationDrawer as one unit (brief: `task-12c-brief.md`).
3. Task 13: heavy components, deferred until the needed ones are chosen (live in customer360: AreaChart, StackedBarChart, VerticalBarChart, date pickers, FileDropUploader).
4. Task 14: Playwright visual regression across four viewports; baselines need design review.
5. Task 15: CI (`.github/workflows`), CONSTITUTION.md, size-limit budgets, tree-shaking test, npm publish to GitHub Packages. Carry-ins: `dist/test-setup.d.ts` leak, Playwright browser install in CI, run `npm run test:coexistence` and `tsc -p coexistence` as gates.
6. Tasks 16-17: MCP manifest generator and authenticated Streamable HTTP MCP server (bearer tokens).
7. Tasks 18-19: MCP and Storybook container images, release pipeline, new `horizon-ui-deployment` repo (helmfile), token handling doc. External actions: need explicit go-ahead.
8. Task 20: customer360 pilot (separate PR in customer360; use `styles.unlayered.css`).

Deferred components: PhoneInput (dependency decision), LabelColorActionsPopover (customer360-local), Breadcrumbs (no customer360 usage). Skeleton dropped.

## Decisions needed from the owner

- Typography tokens with line-height ratio 1.0 (`body/secondary` 14/14, `body/lg` 20/20, `caption` 12/12, `micro` 10/10). Proposed 14/20, 20/28, 12/16 (see `docs/migration/token-gaps.md`).
- Chip colour palette: customer360 uses more colours than the six tones; a categorical palette is recommended.
- Destructive red for D&B and IL changed from `#ED3F48` to `#C90A2A` for AA contrast.
- No Figma link and Impeccable stops at init without `PRODUCT.md`: run `/impeccable init`, then audit and polish; all visuals are unreviewed.
- Combobox/Select list stays anchored on mobile (no bottom sheet); toasts at bottom (customer360 uses top-right).
- customer360 theme/token/hook imports have no horizon-ui equivalent yet.
- Old x-core prop values fall back with a dev warning and are not mapped (`variant="text"` becomes primary).

## Things to know when integrating customer360

- Use `@cialdnb/horizon-ui/styles.unlayered.css`; the layered build loses to customer360's unlayered Bootstrap reboot.
- Horizon overlays/controls inside MUI dialogs need an inner `<HorizonProvider>`; portaled MUI overlays opened inside a Horizon modal render below it. See `docs/architecture/05-migration-and-coexistence.md`.
- x-core DialogV2 uses `disablePortal`, which makes MUI hide the dialog itself from screen readers (existing defect).
- The coexistence suite takes about 4.6 minutes; set `COEX_PORT` if port 4173 is busy.
