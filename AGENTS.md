# AGENTS.md — Ingress AP Round

Project facts for coding agents. **Keep this file accurate.**

## Sync rule (mandatory)

Whenever you change behavior, AP tables, constraints, UI, scripts, deploy, or structure of this repo, **update this `AGENTS.md` in the same change** so it stays a complete mirror of the project. If a fact is obsolete, delete or rewrite it — do not leave stale claims.

Also update the user-facing [`README.md`](README.md) when end-user-visible behavior changes (inputs, guarantees, how to use).

## What this is

Browser PWA that plans Ingress in-game actions to earn an **exact AP gap** between *current AP* and *target AP*. Live site: https://nigh.github.io/ingress-ap-round/  
Repo: https://github.com/Nigh/ingress-ap-round  
License: **MIT** ([`LICENSE`](LICENSE))

## Stack

- Astro 6 + Svelte 5 + Tailwind 4 + DaisyUI + `@xianii/design-system`
- PWA via `@vite-pwa/astro`
- Template origin: `Nigh/astro-pwa-template`
- Node **24+** for CI (`npm ci` / `npm run build`)
- Deploy: GitHub Pages on push to `main` — [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)  
  Actions: `checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`  
  Deploy retries once after 90s if Pages sticks at `deployment_queued` ([actions/deploy-pages#406](https://github.com/actions/deploy-pages/issues/406)).  
  Repo Pages **build type** must be **GitHub Actions** (not branch). `gh-pages` branch pushes are unused while Actions deploy works.
- Astro `site`: `https://nigh.github.io`, `base`: `/ingress-ap-round`

## Layout (source of truth)

| Path | Role |
|------|------|
| `src/lib/actions.ts` | AP tables, destroy AP, nearby portals, costs, gap validation, guarantee constants |
| `src/lib/solver.ts` | Grouped knapsack DP (`hardMax`), `plan` / `alternatives` / `computePlans` |
| `src/lib/format.ts` | Solution rows `{ action, qty, ap, passcode? }` including nearby destroy+capture |
| `src/lib/selfcheck.ts` | Assert-based solver check (`npm run check:solver`) |
| `src/components/ApCalculator.svelte` | Main UI |
| `src/components/StarLink.astro` | Top-left GitHub Star link |
| `src/components/ThemeToggle.svelte` | Theme toggle (top-right) |
| `src/components/ReloadPrompt.svelte` | PWA update toast |
| `src/pages/index.astro` | Page shell |
| `src/layouts/Layout.astro` | HTML shell, PWA manifest link |
| `ref/` | Local Go prototype (**gitignored**, not published) |
| `graphify-out/`, `.cursor/` | Local tooling (**gitignored**) |

## Product rules (must match code)

- Gap = `targetAP - currentAP`. Valid iff both are non-negative integers, `target > current`, and `gap ≤ 10000` (`GAP_MAX`).
- Exact solutions **guaranteed** for gap ≥ **1688** (normal) or ≥ **3376** (Double AP). Smaller gaps may still solve. Nearby portals do **not** change guarantee claims.
- Double AP: all action AP ×2. Default toggle **off**.
- Odd gap + Double AP: force **at most one** official **1 AP passcode** (not a knapsack item; special UI row).
- Action **cost** weights: integers **1–100**, defaults in `DEFAULT_COSTS`; higher → planner avoids when possible. Cost UI uses `COST_KINDS` (excludes nearby kinds).
- **Nearby portals** (optional): at most one **enemy** and one **Machina**. Fields via **`<select>`** only: resonators **1–8**, mods **0–4**, links **0–1** (no free-typed illegal values). Links require resonators **≥ 3** (`NEARBY_LINK_MIN_RES`; Ingress drops links below 3 res) — otherwise links forced to **0**. Defaults: enemy `8/0/0`, Machina `8/4/0`. Each enabled portal → one `ApAction` (`nearbyEnemy` / `nearbyMachina`) with `hardMax: 8`. AP schedule = destroy inventory + Capture+1…8 resonators (same capture formula as white/machina). Destroy AP (wiki): res **75**, mod **80**, link **187**. Using the portal always clears configured inventory first; capture depth 1–8 is chosen by the solver. Default cost **1** (prefer nearby).
- Show up to **3** plans; **only `diff === 0`**. Header shows cost / AP badges, not diff.
- Solution steps are **checkboxes**. Checked AP sum + current AP is shown as expected total (“should be at”) for in-game verification.
- Mod deploy AP is **125** (wiki: Applying a Portal Mod). Other base AP values align with Ingress Access Points wiki (capture 675, resonator 125, complete +250, upgrade 65, link 313, field 1250, allied hack 100 / enemy 200, Machina recapture +1331, boost/beacon 500).

## Solver

- Lexicographic: minimize `|ap - gap|`, then minimize total cost.
- `hardMax` on an action caps knapsack count (nearby portals).
- Passcode path: `plan` solves `gap - 1` when double && odd, then attaches passcode.
- Alternatives: re-solve forbidding one used action; sort by diff then cost.
- `computePlans(target, double, want, costs?, nearby?)` passes nearby into `buildActions`.

## Commands

```bash
npm install
npm run dev
npm run check:solver
npm run build
npm run preview
```

## Agent habits for this repo

- Prefer small PRs to `main` for shippable changes (Pages deploys from `main`).
- Do not commit `ref/`, `node_modules/`, `dist/`, `graphify-out/`, `.cursor/`, `.vscode/`.
- After non-trivial solver changes, run `npm run check:solver` (and `npm run build` if UI/Astro touched).
- Avoid Svelte `class:foo/bar={...}` (slash utilities break the `class:` directive); use string conditionals.
- Follow user/global ponytail rules when present: minimal code, no unsolicited deps/abstractions.
