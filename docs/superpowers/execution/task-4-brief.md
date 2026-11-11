### Task 4: HorizonProvider and utilities

**Files:**
- Create: `src/provider/HorizonProvider.tsx`, `src/provider/portal-context.ts`, `src/lib/cn.ts`, `src/provider/index.ts`
- Test: `src/provider/HorizonProvider.test.tsx`, `src/lib/cn.test.ts`

**Interfaces:**
- Produces: `HorizonProvider` (`React.forwardRef<HTMLDivElement, HorizonProviderProps>`, `HorizonProviderProps = { brand?: 'cial'|'dnb'|'il'; dir?: 'ltr'|'rtl'; children: ReactNode } & React.HTMLAttributes<HTMLDivElement> & DnbBase`); `usePortalContainer(): HTMLElement`; `cn(...inputs: ClassValue[]): string` (clsx + tailwind-merge aware of the prefix).
- Consumes: `DnbBase`.

- [ ] **Step 1: Write failing tests:**
  - `'renders wrapper with hz-root, data-brand and dir'`
  - `'defaults to cial and ltr'`
  - `'unknown brand falls back to cial'` (Review Focus 1; cast invalid value)
  - `'usePortalContainer returns the provider element inside provider'`
  - `'usePortalContainer outside provider returns a lazily created hz-root portal root on document.body and warns once'` (Review Focus 3; assert `console.warn` called once, container has class `hz-root`)
  - `'cn merges conflicting prefixed utilities'`
- [ ] **Step 2: Run; expected FAIL**
- [ ] **Step 3: Implement per signatures. Fallback portal root is created once and reused; warning uses `console.warn` (allowed for actionable developer warnings).**
- [ ] **Step 4: Run; expected PASS**
- [ ] **Step 5: Commit (only after user approval)** `feat(provider): HorizonProvider and cn`

