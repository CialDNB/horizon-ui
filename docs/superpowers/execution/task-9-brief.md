### Task 9: Component port template and migration map

**Files:**
- Create: `docs/migration/component-map.md`, `docs/migration/porting-checklist.md`, `scripts/usage-report.ts`

**Interfaces:**
- Produces: `component-map.md` table with columns `x-core component | horizon-ui component | status (todo/in-progress/done/superseded/no-equivalent) | API differences | customer360 import count`. `scripts/usage-report.ts <path-to-customer360-client>` prints import counts of each `@cialdnb/x-core` component, sorted descending, and groups version families (`Foo`, `FooV2`, `FooV3`) so only the highest version carries `todo`; lower versions are pre-filled `superseded`. Known families to pre-fill (verified in `x-core/src/components`): Accordion, AppBar, AppBarActions (V3), AppBarDropdown, AppBarHelp, AreaChart, BackdropLoader, Breadcrumbs, Button, Card, Checkbox, CountryInput, DatePicker, DateRangePicker, Dialog, EmailsField, FileDropUploader, Layout, MultipleBarChart, NotificationsDropdown, Pagination, Popover, ProductsDropdown, Radio, RatingBar, SearchBar, Select, Switch, Timeline, Tooltip; `Drawer` is the exception case (V2 = navigation menu, V3 = content side panel).

- [ ] **Step 1: Write failing test `scripts/__tests__/usage-report.test.ts`** over a fixture directory: `'counts named imports from @cialdnb/x-core'`, `'counts aliased and default-namespace imports'`, `'ignores other packages'`.
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement the script (TypeScript compiler API import walk). Run it on `/Users/simonmor/dnb/customer360/client`; populate the map with all x-core components and counts; reorder the batch lists in Tasks 10-13 by real counts (keep the group boundaries).**
- [ ] **Step 4: Write `porting-checklist.md` per component: a `Responsive` story with the per-breakpoint spec (mobile / tablet / laptop / desktop) and `/impeccable adapt` pass, 44px mobile touch targets, no overflow at 320px, shadcn source version noted in file header, native-prop API, variants via cva, tokens only, logical properties, `forwardRef`+`displayName`, stories (brand x RTL), unit tests (role, name, keyboard, focus), a11y story check, map row updated, export added.**
- [ ] **Step 5: Run tests; expected PASS**
- [ ] **Step 6: Commit (only after user approval)** `docs: migration map and usage report`

