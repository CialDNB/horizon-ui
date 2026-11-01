# 06 — Open Questions

Status: **Decided** (owner answered), **Default** (my default stands unless you object), **Open** (needs investigation).

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Name | Decided | `horizon-ui`, published as `@cialdnb/horizon-ui` |
| 2 | Icons | Decided | Port x-core icons as SVG components; lucide-react only for shadcn internals (chevrons, check) |
| 3 | IL brand typography | Decided | IL uses cial typography until design says otherwise |
| 4 | Visual regression | Decided | Playwright, self-hosted screenshots |
| 5 | Dark mode | Default | Not in v1; semantic-variable structure allows adding later |
| 6 | Tokens: copy vs separate package | Default | One-time copy into horizon-ui, then diverge |
| 7 | Consumers beyond customer360, React < 18 | Default | customer360 only; React >= 18 |
| 8 | Tailwind `hz:` prefix vs scope under `.hz-root` | Decided | Prefix + `@layer horizon`, `--tw-*` renamed to `--hz-tw-*`; spike evidence in [ADR 0001](decisions/0001-css-isolation.md) |
| 9 | Git home | Decided | New repo `CialDNB/horizon-ui` |
| 10 | DrawerV2 | Decided | Port behaviour, redesign visuals per Figma |
| 11 | Storybook hosting | Default | Same as x-core's (nginx image on the cluster) |
| 12 | MCP auth | Decided | Bearer tokens (per-team, k8s secrets, `Authorization` header). Auth stays isolated in one middleware so OAuth can replace it later |
| 13 | MCP deploy repo | Decided | New `horizon-ui-deployment` repo (helmfile, same shape as `x-core-deployment`) |
| 14 | MCP environments / reachability | Decided | `hdev` first at `horizon-ui-mcp.hdev.cial.tech`, internet-reachable behind bearer auth |
| 15 | MCP versions | Decided | Latest only in v1 |
| 16 | Source of the `cial/x-core-mcp` image / HTTP wrapper | Open | Not in the x-core repo (its Dockerfile builds Storybook; `mcp/server.js` is stdio only). Builder must locate it or write a new Streamable HTTP wrapper |

## Follow-ups created by decisions

- Bearer tokens: define issuing, rotation and revocation process (who issues, where stored, expiry). Add `/healthz` unauthenticated; everything else requires a token.
- `horizon-ui-deployment` needs the repo requirements listed in `x-core-deployment` README (protected branch, `dev`/`hdev` environments, `CLUSTER_CA`, `SVCACC_TOKEN`, `NAMESPACE_NAME`, ECR variables, ARC runner).
- Release pipeline in horizon-ui needs permission to open a tag-bump PR in `horizon-ui-deployment`.
